/* ========================================================================
   MONEYFLOW - SPENDLY.JS
   Analytics Logic, Sync, PDF generation. Fully retained functional math.
======================================================================== */

(function () {
    'use strict';

    // Default Map
    const defaultCategoryMap = {
        Travel: ['🛺 Auto/Rickshaw', '🤝 Shared Auto', '🚍 BEST/City Bus', '🚇 Metro', '🚆 Local Train', '🚌 Long Journey', '🛵 Bike Petrol', '⛽ Fuel/Diesel', '🚗 Taxi/Cab', '🚲 Bicycle', '🛤️ Toll/Parking', '🎫 Monthly Pass', 'All'],
        Food: ['🥛 Milk/Doodh', '🌾 Ration/Kirana', '🥬 Vegetables/Mandi', '🍎 Fruits', '🍞 Bakery/Bread', '🍗 Non-Veg/Meat', '🌶️ Masala/Spices', '🍳 Breakfast', '🍛 Lunch/Dinner', '☕ Tea/Chai', '🥙 Street Food', '🍔 Outside Junk', '🥤 Cold Drinks', 'All'],
        'Home & Rent': ['🏠 House Rent', '🏡 PG/Hostel', '🧹 Maid/Bai', '🔥 Gas Cylinder', '🚰 Drinking Water/Can', '🔌 Hardware/Tools', '🧴 Detergent/Soaps', '📰 Newspaper', 'All'],
        Bills: ['💡 Electricity Bill', '📱 Mobile Recharge', '🌐 WiFi/Broadband', '📺 Cable/DTH', '🏦 Bank Charges', '💳 Credit Card Bill', '🌊 Water Bill', 'All'],
        Shopping: ['👕 Clothes', '👟 Shoes/Chappal', '🧢 Daily Wear', '🧴 Personal Care', '🧵 Tailor/Stitching', '📱 Gadgets', '🛍️ Online Sale', 'All'],
        Health: ['💊 Medicines/Pharmacy', '🩺 Doctor Visit/Clinic', '🏥 Hospital', '🩸 Blood Test/Pathology', '🦷 Dental', '🧴 Skin Care', '🧘 Yoga/Gym', 'All'],
        Education: ['🖨️ Printout/Xerox', '📄 Assignment/Project', '📚 Text Books', '📓 Notebooks/Registers', '🖊️ Stationary (Pens/Pencils)', '🎒 Bag/Accessories', '🏫 School/College Fees', '🧑‍🏫 Tuition/Coaching', '📝 Exam Form/Fees', '💻 Cyber Cafe', '💻 Online Course', 'All'],
        Entertainment: ['🎬 Movies/Theater', '🎥 OTT (Netflix/Prime)', '🍿 Outing/Mela', '🎮 Games', '🎡 Fun Activities', '🎵 Spotify/Music', 'All'],
        Savings: ['🏦 Bank Deposit', '💰 Cash Piggubank', '📈 Mutual Funds/SIP', '🏅 Gold/Jewelry', '🚨 Emergency Fund', 'All'],
        Family: ['🎉 Festivals/Puja', '🎁 Gifts/Shagun', '👶 Kids Fees/Toys', '🍛 Family Dinner', '👵 Parent Medicine', '🏠 Home Repair', 'All'],
        Other: ['💇 Haircut/Barber', '👚 Laundry/Dhobi', '📦 Courier/Post', '🚗 Bike/Auto Service', '💵 Charity/Zakat', '💸 Lost/Stolen', '🚬 Smoking/Pan', '🍺 Alcohol', 'All']
    };

    let fullCategoryMap = window.loadData('fin_full_category_map') || {
        expenseMap: JSON.parse(JSON.stringify(defaultCategoryMap)),
        incomeList: []
    };

    // Backward compatibility for old custom categories
    const oldCustomCats = window.loadData('fin_custom_categories');
    if (oldCustomCats && !window.loadData('fin_full_category_map')) {
        if (oldCustomCats.expense && oldCustomCats.expense.length > 0) {
            fullCategoryMap.expenseMap['Custom'] = oldCustomCats.expense;
        }
        if (oldCustomCats.income && oldCustomCats.income.length > 0) {
            fullCategoryMap.incomeList = oldCustomCats.income;
        }
        window.saveData('fin_full_category_map', fullCategoryMap);
    }
    
    const categoryMap = fullCategoryMap.expenseMap;

    let data = loadData('fin_spendly') || [];
    let showLimit = 6;
    let showAll = false;
    let charts = {};

    const today = new Date().toISOString().split('T')[0];
    
    // Elements
    const expenseCategoryEl = document.getElementById('expenseCategory');
    const expenseSubEl = document.getElementById('expenseSub');
    const incomeCategoryEl = document.getElementById('incomeCategory');

    // Init Custom Income Categories
    if (incomeCategoryEl && fullCategoryMap.incomeList && fullCategoryMap.incomeList.length > 0) {
        fullCategoryMap.incomeList.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            incomeCategoryEl.appendChild(opt);
        });
    }

    // Init Expense Categories
    if (expenseCategoryEl) {
        expenseCategoryEl.innerHTML = Object.keys(categoryMap)
            .map((c) => `<option value="${c}">${c}</option>`).join('');
        
        expenseCategoryEl.addEventListener('change', () => {
            const cat = expenseCategoryEl.value;
            expenseSubEl.innerHTML = categoryMap[cat].map(s => `<option value="${s}">${s}</option>`).join('');
        });
        
        // initial trigger
        expenseCategoryEl.dispatchEvent(new Event('change'));
    }

    // Init Dates
    document.getElementById('incomeDate').value = today;
    document.getElementById('expenseDate').value = today;

    // ----------------------------------------------------
    // TYPE SWITCHING
    // ----------------------------------------------------
    window.switchType = function (type) {
        document.querySelectorAll('.transaction-form').forEach(f => {
            f.classList.remove('active', 'block');
            f.classList.add('hidden');
        });
        
        const target = document.getElementById(type + 'Form');
        target.classList.remove('hidden');
        target.classList.add('active', 'block');

        const incomeBtn = document.getElementById('btnIncomeType');
        const expenseBtn = document.getElementById('btnExpenseType');
        const switcherPill = document.getElementById('typeSwitcherPill');
        const switcherNeon = document.getElementById('typeSwitcherNeon');
        
        if (type === 'income') {
            if (switcherPill) {
                switcherPill.style.transform = 'translateX(0%)';
                switcherPill.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.3)';
                switcherPill.style.backgroundColor = ''; // Clear inline background if any
            }
            if (switcherNeon) {
                switcherNeon.className = 'absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[3px] rounded-t-full bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,1)] transition-colors duration-500';
            }
            if (incomeBtn) incomeBtn.className = "relative flex-1 py-3 text-xs sm:text-sm font-black tracking-widest uppercase rounded-[1.75rem] text-white transition-colors duration-300 z-10 active:scale-95";
            if (expenseBtn) expenseBtn.className = "relative flex-1 py-3 text-xs sm:text-sm font-black tracking-widest uppercase rounded-[1.75rem] text-muted hover:text-white transition-colors duration-300 z-10 active:scale-95";
        } else {
            if (switcherPill) {
                switcherPill.style.transform = 'translateX(100%)';
                switcherPill.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.3)';
                switcherPill.style.backgroundColor = ''; // Clear inline background if any
            }
            if (switcherNeon) {
                switcherNeon.className = 'absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[3px] rounded-t-full bg-gradient-to-r from-rose-400 to-red-500 shadow-[0_0_12px_rgba(239,68,68,1)] transition-colors duration-500';
            }
            if (expenseBtn) expenseBtn.className = "relative flex-1 py-3 text-xs sm:text-sm font-black tracking-widest uppercase rounded-[1.75rem] text-white transition-colors duration-300 z-10 active:scale-95";
            if (incomeBtn) incomeBtn.className = "relative flex-1 py-3 text-xs sm:text-sm font-black tracking-widest uppercase rounded-[1.75rem] text-muted hover:text-white transition-colors duration-300 z-10 active:scale-95";
        }
    };

    // ----------------------------------------------------
    // SYNC POCKETCAL LOGIC
    // ----------------------------------------------------
    function syncIncomeToPocketCal(entry) {
        if (entry.type !== 'income' || entry.category !== '💵 Pocket Money') return;
        let pcData = loadData('fin_pocketcal') || [];
        pcData = pcData.filter(d => d.date !== entry.date); // overwrite day
        pcData.push({
            id: entry.id.toString(),
            date: entry.date,
            amount: Number(entry.amount),
            category: '💵 Pocket Money',
            notes: entry.notes || '',
            source: 'spendly'
        });
        saveData('fin_pocketcal', pcData);
    }

    function deletePocketCalForSpendly(dateStr) {
        let pcData = loadData('fin_pocketcal') || [];
        const beforeLen = pcData.length;
        pcData = pcData.filter((d) => !(d.date === dateStr && d.source === 'spendly'));
        if (pcData.length !== beforeLen) saveData('fin_pocketcal', pcData);
    }

    // ----------------------------------------------------
    // TOTALS CALCULATION
    // ----------------------------------------------------
    function calcTotals() {
        const totalIncome = data.filter(d => d.type === 'income').reduce((s, d) => s + Number(d.amount || 0), 0);
        const totalExpense = data.filter(d => d.type === 'expense').reduce((s, d) => s + Number(d.amount || 0), 0);
        const balance = totalIncome - totalExpense;

        document.getElementById('totalIncome').textContent = fmt(totalIncome);
        document.getElementById('totalExpense').textContent = fmt(totalExpense);
        document.getElementById('balance').textContent = fmt(balance);
        
        return { totalIncome, totalExpense, balance };
    }

    // ----------------------------------------------------
    // RENDER LIST
    // ----------------------------------------------------
    window.renderList = function (filter = '') {
        const list = document.getElementById('listSpend');
        const emptyState = document.getElementById('emptyState');
        list.innerHTML = '';

        const q = filter.toLowerCase();
        const selMonth = document.getElementById('filterMonth').value;

        let items = data.slice().reverse().filter((it) => {
            let match = true;
            if (q) match = (it.notes || '').toLowerCase().includes(q) || (it.category || '').toLowerCase().includes(q) || (it.sub || '').toLowerCase().includes(q);
            if (selMonth) match = match && it.date.startsWith(selMonth);
            return match;
        });

        if (!showAll) items = items.slice(0, showLimit);

        if (items.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('block');
        } else {
            emptyState.classList.remove('block');
            emptyState.classList.add('hidden');
            
            items.forEach((it, idx) => {
                const li = document.createElement('li');
                li.className = 'list-item';
                li.onclick = () => openEditModal(it.id);
                li.style.animationDelay = `${idx * 0.05}s`;

                const displayCategory = it.type === 'income' ? it.category : `${it.category} - ${it.sub}`;

                li.innerHTML = `
                  <div class="item-left">
                    <span class="item-type type-${it.type}">${it.type}</span>
                    <div class="item-main">${displayCategory}</div>
                    <div class="item-meta">📅 ${it.date} ${it.notes ? `• ${it.notes}` : ''}</div>
                  </div>
                  <div class="item-amount amount-${it.type}">
                    ${it.type === 'income' ? '+' : '-'}${fmt(it.amount)}
                  </div>
                `;
                list.appendChild(li);
            });
        }
    };

    window.toggleShowAll = function() {
        showAll = !showAll;
        document.getElementById('toggleTextBtn').textContent = showAll ? 'Show Less' : 'Show All';
        renderList(document.getElementById('searchInput').value);
    };

    // ----------------------------------------------------
    // ADD TRANSACTIONS
    // ----------------------------------------------------
    // Pending entry for anomaly detection
    window.pendingAnomalyEntry = null;

    window.confirmAnomaly = function() {
        if(window.pendingAnomalyEntry) {
            data.push(window.pendingAnomalyEntry);
            saveData('fin_spendly', data);
            if(window.pendingAnomalyEntry.type === 'income') {
                syncIncomeToPocketCal(window.pendingAnomalyEntry);
                document.getElementById('incomeForm').reset();
                document.getElementById('incomeDate').value = today;
            } else {
                document.getElementById('expenseForm').reset();
                document.getElementById('expenseDate').value = today;
                expenseCategoryEl.dispatchEvent(new Event('change'));
            }
            updateUI();
            showTransactionPopup(window.pendingAnomalyEntry.type);
            window.pendingAnomalyEntry = null;
            document.getElementById('anomalyModal').classList.remove('active');
        }
    };

    window.cancelAnomaly = function() {
        window.pendingAnomalyEntry = null;
        document.getElementById('anomalyModal').classList.remove('active');
    };

    function checkForAnomaly(entry) {
        // Look for exact same amount and category in the last 24h
        const recent = data.find(d => 
            d.type === entry.type && 
            d.amount === entry.amount && 
            d.category === entry.category && 
            d.date === entry.date
        );
        return recent != null;
    }

    document.getElementById('incomeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const entry = {
            id: Date.now(),
            type: 'income',
            date: document.getElementById('incomeDate').value,
            amount: document.getElementById('incomeAmount').value,
            category: document.getElementById('incomeCategory').value,
            sub: '',
            notes: document.getElementById('incomeNotes').value
        };
        
        if(checkForAnomaly(entry)) {
            window.pendingAnomalyEntry = entry;
            document.getElementById('anomalyModal').classList.add('active');
            return;
        }

        data.push(entry);
        saveData('fin_spendly', data);
        syncIncomeToPocketCal(entry);

        document.getElementById('incomeForm').reset();
        document.getElementById('incomeDate').value = today;

        updateUI();
        showTransactionPopup('income');
    });

    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const entry = {
            id: Date.now(),
            type: 'expense',
            date: document.getElementById('expenseDate').value,
            amount: document.getElementById('expenseAmount').value,
            category: document.getElementById('expenseCategory').value,
            sub: document.getElementById('expenseSub').value,
            notes: document.getElementById('expenseNotes').value
        };

        if(checkForAnomaly(entry)) {
            window.pendingAnomalyEntry = entry;
            document.getElementById('anomalyModal').classList.add('active');
            return;
        }

        data.push(entry);
        saveData('fin_spendly', data);

        document.getElementById('expenseForm').reset();
        document.getElementById('expenseDate').value = today;
        expenseCategoryEl.dispatchEvent(new Event('change'));

        updateUI();
        showTransactionPopup('expense');
    });

    function showTransactionPopup(type) {
        let popup = document.getElementById('mfTxPopup');
        let overlay = document.getElementById('mfTxOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mfTxOverlay';
            overlay.className = 'mf-tx-overlay';
            document.body.appendChild(overlay);
        }
        
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'mfTxPopup';
            popup.className = 'mf-tx-popup';
            document.body.appendChild(popup);
        }
        
        let icon = type === 'income' ? '<i data-lucide="arrow-down-to-line"></i>' : '<i data-lucide="arrow-up-from-line"></i>';
        let msg = type === 'income' ? 'Income Added ✅' : 'Expense Added 💸';
        let cls = type === 'income' ? 'mf-tx-income' : 'mf-tx-expense';
        
        popup.innerHTML = `${icon} <span>${msg}</span>`;
        popup.className = `mf-tx-popup ${cls}`;
        if(window.lucide) lucide.createIcons();
        if(window.playUISound) window.playUISound(type === 'income' ? 'on' : 'off');
        else if(window.playClickSound) window.playClickSound();

        // Reveal
        overlay.classList.add('show');
        popup.classList.add('show');
        
        clearTimeout(window.txPopupTimer);
        window.txPopupTimer = setTimeout(() => {
            popup.classList.remove('show');
            overlay.classList.remove('show');
        }, 2200);
    }

    // ----------------------------------------------------
    // EDIT & DELETE
    // ----------------------------------------------------
    window.openEditModal = function(id) {
        const item = data.find((d) => d.id === id);
        if (!item) return;

        document.getElementById('editId').value = id;
        document.getElementById('editType').value = item.type;
        document.getElementById('editDate').value = item.date;
        document.getElementById('editAmount').value = item.amount;

        const catSelect = document.getElementById('editCategory');
        const subSelect = document.getElementById('editSub');
        
        catSelect.innerHTML = '';
        if (item.type === 'income') {
            fullCategoryMap.incomeList.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c; opt.textContent = c;
                catSelect.appendChild(opt);
            });
            subSelect.innerHTML = '<option value="">N/A</option>';
            subSelect.disabled = true;
            subSelect.style.opacity = '0.5';
        } else {
            Object.keys(fullCategoryMap.expenseMap).forEach(c => {
                const opt = document.createElement('option');
                opt.value = c; opt.textContent = c;
                catSelect.appendChild(opt);
            });
            subSelect.disabled = false;
            subSelect.style.opacity = '1';
        }
        
        catSelect.onchange = () => {
            if (item.type === 'expense') {
                subSelect.innerHTML = '';
                const cat = catSelect.value;
                if (fullCategoryMap.expenseMap[cat]) {
                    fullCategoryMap.expenseMap[cat].forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s; opt.textContent = s;
                        subSelect.appendChild(opt);
                    });
                }
            }
        };

        catSelect.value = item.category || '';
        if (!catSelect.value && item.category) {
            const opt = document.createElement('option');
            opt.value = item.category; opt.textContent = item.category;
            catSelect.appendChild(opt);
            catSelect.value = item.category;
        }
        
        catSelect.dispatchEvent(new Event('change'));
        
        subSelect.value = item.sub || '';
        if (!subSelect.value && item.sub && item.type === 'expense') {
            const opt = document.createElement('option');
            opt.value = item.sub; opt.textContent = item.sub;
            subSelect.appendChild(opt);
            subSelect.value = item.sub;
        }
        document.getElementById('editNotes').value = item.notes || '';

        document.getElementById('editModal').classList.add('active');
    };

    window.closeModal = function(id) {
        document.querySelector(id).classList.remove('active');
    };

    document.getElementById('editForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = Number(document.getElementById('editId').value);
        const idx = data.findIndex(d => d.id === id);
        if (idx !== -1) {
            const oldDate = data[idx].date;
            const isInc = data[idx].type === 'income';

            data[idx].date = document.getElementById('editDate').value;
            data[idx].amount = document.getElementById('editAmount').value;
            data[idx].category = document.getElementById('editCategory').value;
            data[idx].sub = document.getElementById('editSub').value; 
            data[idx].notes = document.getElementById('editNotes').value;

            saveData('fin_spendly', data);

            if (isInc) {
                deletePocketCalForSpendly(oldDate);
                syncIncomeToPocketCal(data[idx]);
            }

            closeModal('#editModal');
            updateUI();
            showSnackbar('Updated successfully!');
        }
    });

    window.deleteTransaction = function() {
        window.showConfirmModal(
            'Delete Transaction?', 
            'Are you sure you want to delete this permanently?', 
            'Delete', 
            () => {
                const id = Number(document.getElementById('editId').value);
                const tx = data.find(d => d.id === id);
                
                data = data.filter(d => d.id !== id);
                saveData('fin_spendly', data);

                if(tx && tx.type === 'income' && tx.category.includes('Pocket Money')){
                    deletePocketCalForSpendly(tx.date);
                }

                closeModal('#editModal');
                updateUI();
                showSnackbar('Deleted successfully.');
            }
        );
    };

    // ----------------------------------------------------
    // CHARTS (Chart.js)
    // ----------------------------------------------------
    function renderCharts() {
        if (!window.Chart) return;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#f8fafc' : '#0f172a';
        const totals = calcTotals();

        // Destroy old
        Object.values(charts).forEach((c) => c && c.destroy && c.destroy());
        charts = {};

        Chart.defaults.color = textColor;
        Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
        Chart.defaults.animation = {
            duration: 2000,
            easing: 'easeOutQuart'
        };

        // 1. Doughnut
        const ctxD = document.getElementById('incomeExpenseChart');
        if (ctxD && totals.totalIncome > 0 || totals.totalExpense > 0) {
            charts.ie = new Chart(ctxD, {
                type: 'doughnut',
                data: {
                    labels: ['Income', 'Expense'],
                    datasets: [{
                        data: [totals.totalIncome, totals.totalExpense],
                        backgroundColor: ['#10b981', '#ef4444'],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: { plugins: { legend: { position: 'bottom' } } }
            });
        }

        // 2. Pie (Categories)
        const ctxC = document.getElementById('categoryChart');
        if (ctxC) {
            const cData = {};
            data.filter(d => d.type === 'expense').forEach(d => {
                cData[d.category] = (cData[d.category] || 0) + Number(d.amount);
            });
            const labels = Object.keys(cData);
            const vals = Object.values(cData);
            if(labels.length > 0) {
                charts.cat = new Chart(ctxC, {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: vals,
                            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'],
                            borderWidth: 0
                        }]
                    },
                    options: { plugins: { legend: { position: 'bottom' } } }
                });
            }
        }

        // 3. Trend Histogram/Line
        const ctxT = document.getElementById('trendChart');
        if (ctxT) {
            const monthlyData = {};
            data.forEach(d => {
                const m = d.date.slice(0, 7);
                if (!monthlyData[m]) monthlyData[m] = { inc: 0, exp: 0 };
                monthlyData[m][d.type === 'income' ? 'inc' : 'exp'] += Number(d.amount);
            });
            const sorted = Object.keys(monthlyData).sort().slice(-6); // last 6 months

            charts.trend = new Chart(ctxT, {
                type: 'bar',
                data: {
                    labels: sorted,
                    datasets: [
                        { label: 'Income', data: sorted.map(m=>monthlyData[m].inc), backgroundColor: '#10b981', borderRadius: 6 },
                        { label: 'Expense', data: sorted.map(m=>monthlyData[m].exp), backgroundColor: '#ef4444', borderRadius: 6 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } },
                        x: { grid: { display:false } }
                    }
                }
            });
        }

        // 4. Daily Activity (Current Month)
        const ctxDaily = document.getElementById('dailyActivityChart');
        if (ctxDaily) {
            const currentM = today.slice(0, 7);
            const daysInMonth = new Date(today.slice(0, 4), today.slice(5, 7), 0).getDate();
            const dailyData = Array(daysInMonth).fill(0);
            
            data.filter(d => d.type === 'expense' && d.date.startsWith(currentM)).forEach(d => {
                const day = parseInt(d.date.slice(8, 10), 10);
                dailyData[day - 1] += Number(d.amount);
            });
            const dLabels = Array.from({length: daysInMonth}, (_, i) => i + 1);

            charts.daily = new Chart(ctxDaily, {
                type: 'line',
                data: {
                    labels: dLabels,
                    datasets: [{
                        label: 'Daily Exps',
                        data: dailyData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { display: false },
                        x: { display: true, grid: { display: false }, ticks: { maxTicksLimit: 10 } }
                    }
                }
            });
        }

        // 5. Weekday Activity (Polar Area)
        const ctxW = document.getElementById('weekdayActivityChart');
        if (ctxW) {
            const weekdayTotals = [0,0,0,0,0,0,0]; // Sun..Sat
            data.filter(d => d.type === 'expense').forEach(d => {
                let dateObj = new Date(d.date);
                weekdayTotals[dateObj.getDay()] += Number(d.amount);
            });

            charts.weekday = new Chart(ctxW, {
                type: 'polarArea',
                data: {
                    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    datasets: [{
                        label: 'Weekday Spends',
                        data: weekdayTotals,
                        backgroundColor: [
                            'rgba(239, 68, 68, 0.6)',
                            'rgba(245, 158, 11, 0.6)',
                            'rgba(16, 185, 129, 0.6)',
                            'rgba(59, 130, 246, 0.6)',
                            'rgba(139, 92, 246, 0.6)',
                            'rgba(236, 72, 153, 0.6)',
                            'rgba(99, 102, 241, 0.6)'
                        ],
                        borderWidth: 1,
                        borderColor: isDark ? '#1e293b' : '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        r: { ticks: { display: false }, grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' } }
                    },
                    animation: { delay: 400 } // staggered entry
                }
            });
        }

        // 6. Spending Spread (Radar)
        const ctxRadar = document.getElementById('radarChart');
        if (ctxRadar) {
            const radarData = { 'Food': 0, 'Travel': 0, 'Shopping': 0, 'Health': 0, 'Entertainment': 0, 'Other': 0 };
            data.filter(d => d.type === 'expense').forEach(d => {
                let cat = d.category;
                if(radarData[cat] === undefined) cat = 'Other';
                radarData[cat] += Number(d.amount);
            });
            charts.radar = new Chart(ctxRadar, {
                type: 'radar',
                data: {
                    labels: Object.keys(radarData),
                    datasets: [{
                        label: 'Expense Spread',
                        data: Object.values(radarData),
                        backgroundColor: 'rgba(245, 158, 11, 0.4)',
                        borderColor: '#f59e0b',
                        pointBackgroundColor: '#f59e0b',
                        fill: true
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        r: { ticks: { display: false }, angleLines: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }, grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' } }
                    },
                    animation: { delay: 600 } // staggered entry
                }
            });
        }

        // 7. Savings Trend (Line)
        const ctxSavings = document.getElementById('savingsTrendChart');
        if (ctxSavings) {
            const monthlySavings = {};
            data.forEach(d => {
                const m = d.date.slice(0, 7);
                if (!monthlySavings[m]) monthlySavings[m] = { inc: 0, exp: 0 };
                monthlySavings[m][d.type === 'income' ? 'inc' : 'exp'] += Number(d.amount);
            });
            const sorted = Object.keys(monthlySavings).sort().slice(-6);
            const savingsData = sorted.map(m => monthlySavings[m].inc - monthlySavings[m].exp);

            charts.savingsTrend = new Chart(ctxSavings, {
                type: 'line',
                data: {
                    labels: sorted,
                    datasets: [{
                        label: 'Net Savings',
                        data: savingsData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#10b981'
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } },
                        x: { grid: { display: false } }
                    },
                    animation: { delay: 800 } // staggered entry
                }
            });
        }
    }

    // ----------------------------------------------------
    // PDF BANK PASSBOOK EXPORT — HDFC STYLE (JSPDF + AUTOTABLE)
    // ----------------------------------------------------
    window.openPDFModal = function() {
        document.getElementById('pdfModal').classList.add('active');
    };

    // Listen for changes in the PDF Modal Radio options
    document.querySelectorAll('input[name="pdfRange"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const display = e.target.value === 'custom' ? 'block' : 'none';
            document.getElementById('customDateRange').style.display = display;
        });
    });

    // Strip emoji prefix from category strings for PDF-safe rendering
    // jsPDF Helvetica cannot render Unicode emoji glyphs — we extract the text label
    function emojiStrip(str) {
        if (!str) return '';
        // Remove leading emoji character(s) followed by optional space
        return str.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/u, '').trim();
    }

    window.generatePDF = function() {
        try {
            if (!window.jspdf) {
                showSnackbar('PDF generator loading… please try again.', 'error');
                return;
            }

            // ── 1. Date filtering ──────────────────────────────────────────
            const range   = document.querySelector('input[name="pdfRange"]:checked').value;
            const nToday  = new Date();
            const tzOff   = nToday.getTimezoneOffset() * 60000;
            const todayStr= (new Date(Date.now() - tzOff)).toISOString().split('T')[0];

            let filteredData = [...data];
            if (range === 'today') {
                filteredData = filteredData.filter(d => d.date === todayStr);
            } else if (range === 'week') {
                const lw = new Date(nToday); lw.setDate(lw.getDate() - 7);
                const lwStr = (new Date(lw.getTime() - tzOff)).toISOString().split('T')[0];
                filteredData = filteredData.filter(d => d.date >= lwStr && d.date <= todayStr);
            } else if (range === 'month') {
                filteredData = filteredData.filter(d => d.date.startsWith(todayStr.slice(0,7)));
            } else if (range === 'year') {
                filteredData = filteredData.filter(d => d.date.startsWith(todayStr.slice(0,4)));
            } else if (range === 'custom') {
                const sDate = document.getElementById('pdfStartDate').value;
                const eDate = document.getElementById('pdfEndDate').value;
                if (!sDate || !eDate) { showSnackbar('Please select both dates', 'error'); return; }
                filteredData = filteredData.filter(d => d.date >= sDate && d.date <= eDate);
            }

            if (filteredData.length === 0) { showSnackbar('No transactions in this range', 'info'); return; }

            // ── 2. Build passbook rows (sorted ASC) ───────────────────────
            const sortedAsc = filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
            let runBal = 0, totalDr = 0, totalCr = 0;

            const passbookRows = sortedAsc.map((d, idx) => {
                const isInc = d.type === 'income';
                const amt   = Number(d.amount || 0);
                runBal     += isInc ? amt : -amt;
                if (isInc) totalCr += amt; else totalDr += amt;

                // Build a PDF-safe description:
                // Line 1 — cleaned category (emoji stripped for Helvetica compat)
                // Line 2 — sub-category if present
                // Line 3 — user notes if present
                const catClean  = emojiStrip(d.category);
                const subClean  = d.sub   && d.sub.trim()   ? emojiStrip(d.sub)   : '';
                const noteClean = d.notes && d.notes.trim() ? d.notes.trim()       : '';

                let descParts = [catClean];
                if (subClean)  descParts.push(subClean);
                if (noteClean) descParts.push(noteClean);
                const rawDesc = descParts.join('\n');

                return {
                    sno:  String(idx + 1),
                    date: d.date,
                    desc: rawDesc,
                    dr:   !isInc ? amt.toFixed(2) : '',
                    cr:   isInc  ? amt.toFixed(2) : '',
                    bal:  runBal.toFixed(2),
                    type: isInc ? 'cr' : 'dr'
                };
            });

            // ── 3. PDF setup (A4 portrait, pt) ────────────────────────────
            const { jsPDF } = window.jspdf;
            const doc       = new jsPDF('p', 'pt', 'a4');
            const PW        = doc.internal.pageSize.getWidth();   // 595.28
            const PH        = doc.internal.pageSize.getHeight();  // 841.89

            // HDFC colour palette
            const NAVY   = [0,   44,  95];   // #002C5F deep navy
            const MAROON = [161,  25,  47];  // #A1192F HDFC red
            const GOLD   = [201, 153,  49];  // #C99931 accent gold
            const WHITE  = [255, 255, 255];
            const LGREY  = [245, 246, 248];
            const DGREY  = [80,  80,  80];
            const GREEN  = [0,  130,  80];
            const RED    = [200,  30,  30];

            // Helper: draw a filled rectangle
            const fillRect = (x, y, w, h, rgb) => {
                doc.setFillColor(...rgb);
                doc.rect(x, y, w, h, 'F');
            };

            // Helper: draw text
            const txt = (text, x, y, opts = {}) => {
                doc.setFont(opts.font || 'helvetica', opts.style || 'normal');
                doc.setFontSize(opts.size || 10);
                doc.setTextColor(...(opts.color || DGREY));
                doc.text(String(text), x, y, { align: opts.align || 'left', maxWidth: opts.maxW });
            };

            // ── 4. COVER HEADER BAND ──────────────────────────────────────
            fillRect(0, 0, PW, 110, NAVY);

            // Bank name (left)
            txt('MoneyFlow', 36, 44, { font: 'helvetica', style: 'bold', size: 22, color: WHITE });
            txt('Personal Finance Bank', 36, 62, { size: 9.5, color: GOLD });

            // Right side branding line
            txt('ACCOUNT PASSBOOK', PW - 36, 44, { style: 'bold', size: 14, color: WHITE, align: 'right' });
            txt('Statement of Account', PW - 36, 62, { size: 9, color: GOLD, align: 'right' });

            // Gold divider strip
            fillRect(0, 110, PW, 4, GOLD);

            // ── 5. ACCOUNT HOLDER INFO BOX ───────────────────────────────
            fillRect(36, 126, PW - 72, 90, LGREY);
            doc.setDrawColor(...GOLD);
            doc.setLineWidth(0.8);
            doc.rect(36, 126, PW - 72, 90);

            // ── Account info — pull from Settings localStorage keys ────────
            const userName    = localStorage.getItem('fin_userName') || 'Account Holder';
            const userGender  = localStorage.getItem('userGender')  || '';
            const userLocation= localStorage.getItem('userLocation')|| 'India';
            // Generate stable account number from username hash
            const acSeed      = [...userName].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
            const acNo        = 'MF-' + String(Math.abs(acSeed) % 100000000).padStart(8, '0');
            const rangeLabels = { today:'Today', week:'Last 7 Days', month:'This Month', year:'This Year', custom:'Custom Range' };
            const periodLabel = rangeLabels[range] || range;
            const printDate   = nToday.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

            txt('Account Holder :', 48, 148, { style: 'bold', size: 9, color: NAVY });
            txt(userName,           170, 148, { style: 'bold', size: 9, color: [20,20,20] });

            txt('Account No. :',   48, 165, { style: 'bold', size: 9, color: NAVY });
            txt(acNo,              170, 165, { size: 9, color: [20,20,20] });

            txt('Location :',      48, 182, { style: 'bold', size: 9, color: NAVY });
            txt(userLocation + (userGender ? '  |  ' + userGender : ''), 170, 182, { size: 9, color: [20,20,20] });

            txt('Statement Period :', PW / 2 + 10, 148, { style: 'bold', size: 9, color: NAVY });
            txt(periodLabel,          PW / 2 + 130, 148, { size: 9, color: [20,20,20] });

            txt('Print Date :',     PW / 2 + 10, 165, { style: 'bold', size: 9, color: NAVY });
            txt(printDate,          PW / 2 + 130, 165, { size: 9, color: [20,20,20] });

            txt('Total Entries :',  PW / 2 + 10, 182, { style: 'bold', size: 9, color: NAVY });
            txt(String(passbookRows.length), PW / 2 + 130, 182, { size: 9, color: [20,20,20] });

            // ── 6. PASSBOOK TABLE ─────────────────────────────────────────
            const tableBody = passbookRows.map(r => [
                r.sno,
                r.date,
                r.desc,
                r.dr  ? '₹ ' + Number(r.dr).toLocaleString('en-IN', {minimumFractionDigits:2}) : '',
                r.cr  ? '₹ ' + Number(r.cr).toLocaleString('en-IN', {minimumFractionDigits:2}) : '',
                '₹ ' + Number(r.bal).toLocaleString('en-IN', {minimumFractionDigits:2})
            ]);

            doc.autoTable({
                startY: 228,
                margin: { left: 36, right: 36 },
                head: [['#', 'Date', 'Description / Narration', 'Debit (Dr)', 'Credit (Cr)', 'Balance']],
                body: tableBody,
                theme: 'plain',
                headStyles: {
                    fillColor: NAVY,
                    textColor: WHITE,
                    fontStyle: 'bold',
                    fontSize: 8.5,
                    halign: 'center',
                    cellPadding: { top:6, bottom:6, left:5, right:5 },
                    lineColor: GOLD,
                    lineWidth: 0.4
                },
                bodyStyles: {
                    fontSize: 8,
                    cellPadding: { top:5, bottom:5, left:5, right:5 },
                    lineColor: [210, 215, 220],
                    lineWidth: 0.3,
                    valign: 'middle'
                },
                alternateRowStyles: {
                    fillColor: [250, 251, 253]
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 22, textColor: DGREY },
                    1: { halign: 'center', cellWidth: 62, textColor: [40,40,40] },
                    2: { halign: 'left',   cellWidth: 'auto', textColor: [30,30,30] },
                    3: { halign: 'right',  cellWidth: 70 },
                    4: { halign: 'right',  cellWidth: 70 },
                    5: { halign: 'right',  cellWidth: 78, fontStyle: 'bold' }
                },
                didParseCell: function(hookData) {
                    if (hookData.section !== 'body') return;
                    const rowData = passbookRows[hookData.row.index];
                    if (!rowData) return;

                    // Debit column — red
                    if (hookData.column.index === 3 && rowData.type === 'dr') {
                        hookData.cell.styles.textColor = RED;
                    }
                    // Credit column — green
                    if (hookData.column.index === 4 && rowData.type === 'cr') {
                        hookData.cell.styles.textColor = GREEN;
                    }
                    // Balance — navy bold
                    if (hookData.column.index === 5) {
                        hookData.cell.styles.textColor = Number(rowData.bal) < 0 ? RED : NAVY;
                        hookData.cell.styles.fontStyle = 'bold';
                    }
                },
                willDrawCell: function(hookData) {
                    // Draw left border accent on each body row
                    if (hookData.section === 'body') {
                        const rowData = passbookRows[hookData.row.index];
                        if (rowData && hookData.column.index === 0) {
                            doc.setFillColor(...(rowData.type === 'cr' ? GREEN : RED));
                            doc.rect(hookData.cell.x, hookData.cell.y, 2.5, hookData.cell.height, 'F');
                        }
                    }
                }
            });

            // ── 7. SUMMARY FOOTER BAND ────────────────────────────────────
            const finalY = doc.lastAutoTable.finalY + 18;

            if (finalY + 70 < PH - 40) {
                fillRect(36, finalY, PW - 72, 58, [240, 244, 250]);
                doc.setDrawColor(...NAVY);
                doc.setLineWidth(0.5);
                doc.rect(36, finalY, PW - 72, 58);

                txt('STATEMENT SUMMARY', 48, finalY + 16, { style: 'bold', size: 8.5, color: NAVY });

                const col2 = PW / 3;
                const col3 = (PW / 3) * 2;

                txt('Total Credits (Income)', 48,   finalY + 33, { size: 8, color: DGREY });
                txt('Total Debits (Expense)',  col2, finalY + 33, { size: 8, color: DGREY });
                txt('Closing Balance',         col3, finalY + 33, { size: 8, color: DGREY });

                txt('₹ ' + totalCr.toLocaleString('en-IN',{minimumFractionDigits:2}),
                    48,   finalY + 49, { style:'bold', size:9.5, color: GREEN });
                txt('₹ ' + totalDr.toLocaleString('en-IN',{minimumFractionDigits:2}),
                    col2, finalY + 49, { style:'bold', size:9.5, color: RED });
                txt('₹ ' + runBal.toLocaleString('en-IN',{minimumFractionDigits:2}),
                    col3, finalY + 49, { style:'bold', size:9.5, color: runBal < 0 ? RED : NAVY });
            }

            // ── 8. PAGE FOOTER (each page) ────────────────────────────────
            const totalPages = doc.internal.getNumberOfPages();
            for (let pg = 1; pg <= totalPages; pg++) {
                doc.setPage(pg);
                fillRect(0, PH - 28, PW, 28, NAVY);
                txt('MoneyFlow Personal Finance  •  This is a computer-generated statement.',
                    PW / 2, PH - 14, { size: 7.5, color: [180,200,220], align: 'center' });
                txt(`Page ${pg} of ${totalPages}`,
                    PW - 36, PH - 14, { size: 7.5, color: GOLD, align: 'right' });
            }

            // ── 9. Save ───────────────────────────────────────────────────
            const safePeriod = periodLabel.replace(/\s+/g, '_');
            doc.save(`MoneyFlow_Passbook_${safePeriod}_${todayStr}.pdf`);
            closeModal('#pdfModal');
            showSnackbar('Passbook PDF Exported Successfully! 🎉');

        } catch (err) {
            console.error('PDF generation error:', err);
            showSnackbar('PDF Generation Failed: ' + err.message, 'error');
        }
    };

    // ----------------------------------------------------
    // INIT
    // ----------------------------------------------------
    function populateMonthFilter() {
        const sel = document.getElementById('filterMonth');
        if(!sel) return;
        const currentVal = sel.value;
        const months = new Set();
        data.forEach(d => months.add(d.date.slice(0, 7)));
        
        let html = '<option value="">All Time</option>';
        [...months].sort().reverse().forEach(m => {
            html += `<option value="${m}">${m}</option>`;
        });
        sel.innerHTML = html;
        if([...months].includes(currentVal)) sel.value = currentVal;
    }

    function checkStreaks() {
        const streakBanner = document.getElementById('streakBanner');
        if (!streakBanner) return;
        
        let noJunkStreak = 0;
        const todayObj = new Date();
        
        // Count consecutive days going backwards without 'Food' -> 'Outside Junk'
        for(let i=0; i<30; i++) {
            let d = new Date(todayObj);
            d.setDate(d.getDate() - i);
            let ds = d.toISOString().split('T')[0];
            
            let hasJunk = data.find(tx => tx.date === ds && tx.category === 'Food' && (tx.sub.includes('Outside') || tx.sub.includes('Street')));
            if(hasJunk) break;
            noJunkStreak++;
        }

        if(noJunkStreak >= 3) {
            streakBanner.classList.remove('hidden');
            document.getElementById('streakTitle').textContent = `🔥 ${noJunkStreak}-Day Cooking Streak!`;
            document.getElementById('streakDesc').textContent = "You've avoided outside junk food. You're saving money and staying healthy!";
        } else {
            streakBanner.classList.add('hidden');
        }
    }

    function checkBudgetAlert() {
        const alertBanner = document.getElementById('budgetAlert');
        if(!alertBanner) return;
        
        const currentM = today.slice(0, 7);
        const daysInMonth = new Date(today.slice(0, 4), today.slice(5, 7), 0).getDate();
        const currentDay = parseInt(today.slice(8, 10), 10);
        
        const monthlyIncome = data.filter(d => d.type === 'income' && d.date.startsWith(currentM)).reduce((s, d) => s + Number(d.amount), 0);
        const monthlyExpense = data.filter(d => d.type === 'expense' && d.date.startsWith(currentM)).reduce((s, d) => s + Number(d.amount), 0);
        
        if(currentDay > 3 && monthlyIncome > 0) {
            const velocity = monthlyExpense / currentDay;
            const projected = velocity * daysInMonth;
            if(projected > monthlyIncome) {
                alertBanner.classList.remove('hidden');
                document.getElementById('budgetAlertDesc').textContent = `At this rate (₹${velocity.toFixed(0)}/day), you're projected to spend ₹${projected.toFixed(0)} this month, exceeding your income!`;
                return;
            }
        }
        alertBanner.classList.add('hidden');
    }

    function updateUI() {
        populateMonthFilter();
        calcTotals();
        renderList(document.getElementById('searchInput') ? document.getElementById('searchInput').value : '');
        renderCharts();
        checkStreaks();
        checkBudgetAlert();
    }

    // ----------------------------------------------------
    // AI SMART FEATURES
    // ----------------------------------------------------

    window.processSmartEntry = function() {
        const input = document.getElementById('smartEntryInput').value.toLowerCase();
        if(!input) return;
        
        // Simple NLP Heuristics
        // Match numbers
        const amountMatch = input.match(/\d+/);
        if(!amountMatch) {
            showSnackbar('Could not find an amount. Try "Spent 250 on food"');
            return;
        }
        const amount = amountMatch[0];
        
        let type = 'expense';
        if(input.includes('got') || input.includes('received') || input.includes('salary') || input.includes('pocket money')) {
            type = 'income';
        }

        let cat = type === 'income' ? 'Other' : 'Other';
        let sub = 'All';

        // Smart Categorization Dictionary
        if(type === 'expense') {
            const aiDict = {
                'zomato': ['🍔 Food & Dining', 'Swiggy / Zomato'],
                'swiggy': ['🍔 Food & Dining', 'Swiggy / Zomato'],
                'mcdonalds': ['🍔 Food & Dining', 'Fast Food'],
                'pizza': ['🍔 Food & Dining', 'Fast Food'],
                'lunch': ['🍔 Food & Dining', 'Dining Out'],
                'dinner': ['🍔 Food & Dining', 'Dining Out'],
                'uber': ['🚕 Transportation', 'Uber'],
                'ola': ['🚕 Transportation', 'Ola'],
                'auto': ['🚕 Transportation', 'Auto Rickshaw'],
                'rickshaw': ['🚕 Transportation', 'Auto Rickshaw'],
                'cab': ['🚕 Transportation', 'Cab'],
                'train': ['🚕 Transportation', 'Train'],
                'metro': ['🚕 Transportation', 'Metro'],
                'best': ['🚕 Transportation', 'BEST Bus'],
                'bus': ['🚕 Transportation', 'Bus'],
                'flight': ['🚕 Transportation', 'Flights'],
                'printout': ['📚 Education', 'Printout'],
                'xerox': ['📚 Education', 'Xerox'],
                'book': ['📚 Education', 'Books'],
                'stationery': ['📚 Education', 'Stationery'],
                'amazon': ['🛍️ Shopping', 'Amazon'],
                'flipkart': ['🛍️ Shopping', 'Flipkart'],
                'shirt': ['🛍️ Shopping', 'Clothing'],
                'shoes': ['🛍️ Shopping', 'Clothing'],
                'movie': ['🎬 Entertainment', 'Movies'],
                'netflix': ['🎬 Entertainment', 'Netflix'],
                'spotify': ['🎬 Entertainment', 'Spotify'],
                'hospital': ['💊 Health & Fitness', 'Hospital'],
                'doctor': ['💊 Health & Fitness', 'Medical'],
                'pharmacy': ['💊 Health & Fitness', 'Pharmacy'],
                'medicine': ['💊 Health & Fitness', 'Pharmacy'],
                'gym': ['💊 Health & Fitness', 'Gym'],
                'wifi': ['🧾 Bills & Utilities', 'Internet'],
                'recharge': ['🧾 Bills & Utilities', 'Mobile Recharge'],
                'electricity': ['🧾 Bills & Utilities', 'Electricity']
            };

            for(const [keyword, [mainCat, subCat]] of Object.entries(aiDict)) {
                // simple boundary matching so "training" doesn't match "train"
                if(new RegExp(`\\b${keyword}\\b`, 'i').test(input)) {
                    cat = mainCat;
                    sub = subCat;
                    break;
                }
            }
        } else {
            if(input.includes('pocket')) cat = '💵 Pocket Money';
            if(input.includes('salary')) cat = '💼 Salary';
            if(input.includes('gift')) cat = '🎁 Gift/Eidi';
        }

        const entry = {
            id: Date.now(),
            type: type,
            date: today,
            amount: amount,
            category: cat,
            sub: sub,
            notes: input // use the original string as notes
        };

        if(checkForAnomaly(entry)) {
            window.pendingAnomalyEntry = entry;
            document.getElementById('anomalyModal').classList.add('active');
            return;
        }

        data.push(entry);
        saveData('fin_spendly', data);
        
        if(type === 'income') syncIncomeToPocketCal(entry);

        document.getElementById('smartEntryInput').value = '';
        updateUI();
        showTransactionPopup(type);
    };

    window.generateAIHealthReport = function() {
        const container = document.getElementById('aiHealthReportContainer');
        const textEl = document.getElementById('aiHealthReportText');
        
        container.classList.remove('hidden');
        textEl.innerHTML = '<i class="lucide lucide-loader animate-spin w-5 h-5 inline-block mr-2"></i> Analyzing your data...';
        
        setTimeout(() => {
            const currentM = today.slice(0, 7);
            const monthlyIncome = data.filter(d => d.type === 'income' && d.date.startsWith(currentM)).reduce((s, d) => s + Number(d.amount), 0);
            const monthlyExpense = data.filter(d => d.type === 'expense' && d.date.startsWith(currentM)).reduce((s, d) => s + Number(d.amount), 0);
            
            const savings = monthlyIncome - monthlyExpense;
            const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;
            
            let message = "";
            if(monthlyExpense === 0) {
                message = "You haven't spent anything this month yet. Great start! Keep logging your expenses to get insights.";
            } else if(savings < 0) {
                message = `<strong>Warning:</strong> You've spent ₹${Math.abs(savings)} more than your income this month. You need to review your top expenses immediately.`;
            } else if(savingsRate > 20) {
                message = `<strong>Awesome job!</strong> You are saving ${savingsRate.toFixed(1)}% of your income this month. Your financial discipline is paying off.`;
            } else {
                message = `You're on track, but your savings rate is only ${savingsRate.toFixed(1)}%. Try cutting down on non-essential categories like Entertainment and Outside Food to hit 20%.`;
            }
            
            textEl.innerHTML = message;
        }, 1200); // Fake delay for "AI processing" effect
    };

    // ----------------------------------------------------
    // AI SMART AUTO-CATEGORIZATION
    // ----------------------------------------------------
    const expenseNotesEl = document.getElementById('expenseNotes');
    if(expenseNotesEl) {
        let lastMatchedWord = "";
        expenseNotesEl.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            const catSelect = document.getElementById('expenseCategory');
            const subSelect = document.getElementById('expenseSub');
            if(!catSelect || !subSelect) return;
            
            let matchedMain = null;
            let matchedSub = null;
            let matchedWord = null;
            
            const keywordMap = {
                'zomato': ['🍔 Food & Dining', 'Swiggy / Zomato'],
                'swiggy': ['🍔 Food & Dining', 'Swiggy / Zomato'],
                'mcdonalds': ['🍔 Food & Dining', 'Fast Food'],
                'pizza': ['🍔 Food & Dining', 'Fast Food'],
                'lunch': ['🍔 Food & Dining', 'Dining Out'],
                'dinner': ['🍔 Food & Dining', 'Dining Out'],
                'uber': ['🚕 Transportation', 'Uber'],
                'ola': ['🚕 Transportation', 'Ola'],
                'auto': ['🚕 Transportation', 'Auto Rickshaw'],
                'rickshaw': ['🚕 Transportation', 'Auto Rickshaw'],
                'cab': ['🚕 Transportation', 'Cab'],
                'train': ['🚕 Transportation', 'Train'],
                'metro': ['🚕 Transportation', 'Metro'],
                'best': ['🚕 Transportation', 'BEST Bus'],
                'bus': ['🚕 Transportation', 'Bus'],
                'flight': ['🚕 Transportation', 'Flights'],
                'printout': ['📚 Education', 'Printout'],
                'xerox': ['📚 Education', 'Xerox'],
                'book': ['📚 Education', 'Books'],
                'stationery': ['📚 Education', 'Stationery'],
                'amazon': ['🛍️ Shopping', 'Amazon'],
                'flipkart': ['🛍️ Shopping', 'Flipkart'],
                'shirt': ['🛍️ Shopping', 'Clothing'],
                'shoes': ['🛍️ Shopping', 'Clothing'],
                'movie': ['🎬 Entertainment', 'Movies'],
                'netflix': ['🎬 Entertainment', 'Netflix'],
                'spotify': ['🎬 Entertainment', 'Spotify'],
                'hospital': ['💊 Health & Fitness', 'Hospital'],
                'doctor': ['💊 Health & Fitness', 'Medical'],
                'pharmacy': ['💊 Health & Fitness', 'Pharmacy'],
                'medicine': ['💊 Health & Fitness', 'Pharmacy'],
                'gym': ['💊 Health & Fitness', 'Gym'],
                'wifi': ['🧾 Bills & Utilities', 'Internet'],
                'recharge': ['🧾 Bills & Utilities', 'Mobile Recharge'],
                'electricity': ['🧾 Bills & Utilities', 'Electricity']
            };

            for(const [keyword, [main, sub]] of Object.entries(keywordMap)) {
                if(new RegExp(`\\b${keyword}\\b`, 'i').test(val)) {
                    matchedMain = main;
                    matchedSub = sub;
                    matchedWord = keyword;
                    break;
                }
            }

            if(matchedMain && matchedWord !== lastMatchedWord) {
                lastMatchedWord = matchedWord;
                // Ensure the main category exists in the dropdown options
                const mainExists = Array.from(catSelect.options).some(opt => opt.value === matchedMain);
                if(mainExists && catSelect.value !== matchedMain) {
                    catSelect.value = matchedMain;
                    // Dispatch change event to trigger sub-category population
                    catSelect.dispatchEvent(new Event('change'));
                }
                
                // Ensure subcategory exists
                setTimeout(() => {
                    const subExists = Array.from(subSelect.options).some(opt => opt.value === matchedSub);
                    if(!subExists) {
                        const opt = document.createElement('option');
                        opt.value = matchedSub; opt.textContent = matchedSub;
                        subSelect.appendChild(opt);
                    }
                    if(subSelect.value !== matchedSub) {
                        subSelect.value = matchedSub;
                        if(window.playUISound) window.playUISound('success');
                        showSnackbar(`AI Auto-Selected: ${matchedSub} ✨`);
                    }
                }, 50);
            }
        });
    }

    window.addEventListener('DOMContentLoaded', () => {
        updateUI();
        // Redraw charts on theme change
        document.addEventListener('themeChanged', renderCharts);
    });

})();
