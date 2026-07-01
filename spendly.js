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
    const recCategoryEl = document.getElementById('recCategory');
    const recSubEl = document.getElementById('recSub');
    const budgetCategoryEl = document.getElementById('budgetCategory');

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

    // Init Budgets Dropdowns
    if (budgetCategoryEl) {
        budgetCategoryEl.innerHTML = Object.keys(categoryMap)
            .map((c) => `<option value="${c}">${c}</option>`).join('');
    }

    // Init Recurring Dropdowns
    if (recCategoryEl) {
        recCategoryEl.innerHTML = Object.keys(categoryMap)
            .map((c) => `<option value="${c}">${c}</option>`).join('');
        
        recCategoryEl.addEventListener('change', () => {
            const cat = recCategoryEl.value;
            recSubEl.innerHTML = categoryMap[cat].map(s => `<option value="${s}">${s}</option>`).join('');
        });
        
        recCategoryEl.dispatchEvent(new Event('change'));
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
            
            // Sort by amount descending
            const sortedEntries = Object.entries(cData).sort((a, b) => b[1] - a[1]);
            
            let finalLabels = [];
            let finalVals = [];
            
            if (sortedEntries.length > 6) {
                // Take top 5
                for (let i = 0; i < 5; i++) {
                    finalLabels.push(sortedEntries[i][0]);
                    finalVals.push(sortedEntries[i][1]);
                }
                // Group the rest as 'Other'
                let otherSum = 0;
                for (let i = 5; i < sortedEntries.length; i++) {
                    otherSum += sortedEntries[i][1];
                }
                finalLabels.push('Other Categories');
                finalVals.push(otherSum);
            } else {
                finalLabels = sortedEntries.map(e => e[0]);
                finalVals = sortedEntries.map(e => e[1]);
            }
            
            if(finalLabels.length > 0) {
                charts.cat = new Chart(ctxC, {
                    type: 'pie',
                    data: {
                        labels: finalLabels,
                        datasets: [{
                            data: finalVals,
                            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'],
                            borderWidth: 0
                        }]
                    },
                    options: { 
                        plugins: { 
                            legend: { 
                                position: 'bottom',
                                labels: {
                                    boxWidth: 12,
                                    padding: 15,
                                    font: { size: 11 }
                                }
                            } 
                        } 
                    }
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

            const canvasCtx = ctxDaily.getContext('2d');
            const gradient = canvasCtx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

            charts.daily = new Chart(ctxDaily, {
                type: 'line',
                data: {
                    labels: dLabels,
                    datasets: [{
                        label: 'Daily Exps',
                        data: dailyData,
                        borderColor: '#ef4444',
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#ef4444',
                        pointHoverBackgroundColor: '#ffffff',
                        pointHoverBorderColor: '#ef4444',
                        pointHoverBorderWidth: 3,
                        pointHoverRadius: 6
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
        renderBudgets();
        renderRecurring();
        checkRecurringAlert();
    }

    // ----------------------------------------------------
    // DATA UTILITIES: BACKUP, RESTORE & CSV EXPORT
    // ----------------------------------------------------
    window.openDataModal = function() {
        document.getElementById('dataModal').classList.add('active');
    };

    window.backupDataJSON = function() {
        const backupObj = {
            fin_spendly: window.loadData('fin_spendly') || [],
            fin_pocketcal: window.loadData('fin_pocketcal') || [],
            fin_full_category_map: window.loadData('fin_full_category_map') || null,
            fin_spendly_budgets: window.loadData('fin_spendly_budgets') || {},
            fin_spendly_recurring: window.loadData('fin_spendly_recurring') || []
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `moneyflow_backup_${new Date().toISOString().split('T')[0]}.json`);
        dlAnchorElem.click();
        showSnackbar("Backup file created! 📥");
    };

    window.restoreDataJSON = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const parsed = JSON.parse(e.target.result);
                window.showConfirmModal(
                    "Restore Backup?",
                    "Warning: This will overwrite your current transactions and settings. Do you want to proceed?",
                    "Restore",
                    () => {
                        if (parsed.fin_spendly) window.saveData('fin_spendly', parsed.fin_spendly);
                        if (parsed.fin_pocketcal) window.saveData('fin_pocketcal', parsed.fin_pocketcal);
                        if (parsed.fin_full_category_map) window.saveData('fin_full_category_map', parsed.fin_full_category_map);
                        if (parsed.fin_spendly_budgets) window.saveData('fin_spendly_budgets', parsed.fin_spendly_budgets);
                        if (parsed.fin_spendly_recurring) window.saveData('fin_spendly_recurring', parsed.fin_spendly_recurring);
                        
                        data = window.loadData('fin_spendly') || [];
                        fullCategoryMap = window.loadData('fin_full_category_map') || fullCategoryMap;
                        budgets = window.loadData('fin_spendly_budgets') || {};
                        recurringBills = window.loadData('fin_spendly_recurring') || [];
                        
                        updateUI();
                        showSnackbar("Data successfully restored! 🎉");
                        setTimeout(() => window.location.reload(), 1000);
                    }
                );
            } catch (err) {
                showSnackbar("Invalid backup file format.", "error");
            }
        };
        reader.readAsText(file);
    };

    window.exportToCSV = function() {
        if (!data || data.length === 0) {
            showSnackbar("No transactions to export.", "info");
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Date,Type,Amount,Category,Subcategory,Notes\n";
        
        data.forEach(item => {
            const cleanNotes = (item.notes || "").replace(/"/g, '""');
            csvContent += `"${item.id}","${item.date}","${item.type}","${item.amount}","${emojiStrip(item.category)}","${emojiStrip(item.sub)}","${cleanNotes}"\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", encodedUri);
        dlAnchor.setAttribute("download", `moneyflow_ledger_${new Date().toISOString().split('T')[0]}.csv`);
        dlAnchor.click();
        showSnackbar("CSV Ledger exported successfully! 📊");
    };

    // ----------------------------------------------------
    // CATEGORY BUDGETS ENGINE
    // ----------------------------------------------------
    let budgets = window.loadData('fin_spendly_budgets') || {};

    window.saveCategoryBudget = function(category, amount) {
        budgets[category] = Number(amount);
        window.saveData('fin_spendly_budgets', budgets);
        updateUI();
        showSnackbar(`Budget set for ${emojiStrip(category)}! 🎯`);
    };

    window.deleteCategoryBudget = function(category) {
        delete budgets[category];
        window.saveData('fin_spendly_budgets', budgets);
        updateUI();
        showSnackbar(`Budget removed for ${emojiStrip(category)}.`);
    };

    function renderBudgets() {
        const container = document.getElementById('categoryBudgetsContainer');
        if (!container) return;
        container.innerHTML = '';

        const currentM = today.slice(0, 7);
        const monthlySpends = {};
        data.filter(d => d.type === 'expense' && d.date.startsWith(currentM)).forEach(d => {
            monthlySpends[d.category] = (monthlySpends[d.category] || 0) + Number(d.amount);
        });

        const activeBudgets = Object.keys(budgets);
        if (activeBudgets.length === 0) {
            container.innerHTML = `
                <div class="col-span-full p-6 text-center text-muted text-sm glass-panel bg-white/5 border border-white/5 rounded-2xl">
                    <i data-lucide="target" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
                    No category budgets set. Define budgets below to track limits.
                </div>
            `;
            if (window.lucide) lucide.createIcons({ root: container });
            return;
        }

        activeBudgets.forEach(cat => {
            const limit = budgets[cat];
            const spent = monthlySpends[cat] || 0;
            const percent = Math.min(100, Math.round((spent / limit) * 100));
            const progressColor = percent >= 100 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : percent >= 85 ? 'bg-orange-500 shadow-[0_0_10px_#f97316]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]';
            
            const card = document.createElement('div');
            card.className = 'glass-panel p-4 flex flex-col justify-between border-white/5 hover:border-white/10 transition-all';
            card.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="font-extrabold text-sm text-slate-200 truncate pr-2">${cat}</span>
                    <button onclick="deleteCategoryBudget('${cat}')" class="text-xs text-muted hover:text-red-400 p-1 transition-colors"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>
                <div class="flex justify-between items-end mb-1">
                    <span class="text-xs text-muted">Spent: <strong class="text-slate-100">${fmt(spent)}</strong></span>
                    <span class="text-xs font-bold text-muted">${fmt(limit)} (${percent}%)</span>
                </div>
                <div class="w-full bg-black/30 h-2 rounded-full overflow-hidden border border-white/5">
                    <div class="h-full ${progressColor} transition-all duration-1000" style="width: ${percent}%"></div>
                </div>
            `;
            container.appendChild(card);
        });
        if (window.lucide) lucide.createIcons({ root: container });
    }

    // ----------------------------------------------------
    // RECURRING BILLS ENGINE
    // ----------------------------------------------------
    let recurringBills = window.loadData('fin_spendly_recurring') || [];

    window.addRecurringBill = function(name, amount, category, sub, dayOfMonth) {
        recurringBills.push({
            id: Date.now(),
            name: name,
            amount: Number(amount),
            category: category,
            sub: sub,
            dayOfMonth: Number(dayOfMonth)
        });
        window.saveData('fin_spendly_recurring', recurringBills);
        updateUI();
        showSnackbar(`Recurring bill "${name}" added! 📅`);
    };

    window.deleteRecurringBill = function(id) {
        recurringBills = recurringBills.filter(b => b.id !== id);
        window.saveData('fin_spendly_recurring', recurringBills);
        updateUI();
        showSnackbar("Recurring bill removed.");
    };

    window.logRecurringBillNow = function(id) {
        const bill = recurringBills.find(b => b.id === id);
        if (!bill) return;

        const entry = {
            id: Date.now(),
            type: 'expense',
            date: today,
            amount: bill.amount,
            category: bill.category,
            sub: bill.sub || 'All',
            notes: `Auto-logged Recurring: ${bill.name}`
        };

        data.push(entry);
        window.saveData('fin_spendly', data);
        updateUI();
        showTransactionPopup('expense');
        showSnackbar(`Logged expense of ${fmt(bill.amount)} for ${bill.name}!`);
    };

    function renderRecurring() {
        const container = document.getElementById('recurringContainer');
        if (!container) return;
        container.innerHTML = '';

        if (recurringBills.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center text-muted text-sm glass-panel bg-white/5 border border-white/5 rounded-2xl w-full">
                    <i data-lucide="calendar" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
                    No recurring bills set up. Add subscriptions below.
                </div>
            `;
            if (window.lucide) lucide.createIcons({ root: container });
            return;
        }

        recurringBills.forEach(bill => {
            const card = document.createElement('div');
            card.className = 'glass-panel p-4 flex justify-between items-center border-white/5 hover:border-white/10 transition-all w-full';
            card.innerHTML = `
                <div class="truncate pr-2">
                    <h5 class="font-extrabold text-sm text-slate-200 truncate">${bill.name}</h5>
                    <p class="text-[11px] text-muted truncate">Amt: <strong class="text-slate-300">${fmt(bill.amount)}</strong> • Day ${bill.dayOfMonth}</p>
                </div>
                <div class="flex gap-2 flex-shrink-0">
                    <button onclick="logRecurringBillNow(${bill.id})" class="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[11px] font-extrabold transition">Log</button>
                    <button onclick="deleteRecurringBill(${bill.id})" class="text-muted hover:text-red-400 p-1 transition-colors"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>
            `;
            container.appendChild(card);
        });
        if (window.lucide) lucide.createIcons({ root: container });
    }

    function checkRecurringAlert() {
        const alertBanner = document.getElementById('recurringAlertBanner');
        if (!alertBanner) return;

        const currentDay = new Date().getDate();
        const dueToday = recurringBills.filter(b => b.dayOfMonth === currentDay);

        if (dueToday.length > 0) {
            alertBanner.classList.remove('hidden');
            const alertText = document.getElementById('recurringAlertText');
            if (alertText) {
                alertText.innerHTML = `Today is the due date for subscription: <strong>${dueToday.map(b => b.name).join(', ')}</strong>. Click Log Now to record it.`;
            }
            const alertBtn = document.getElementById('btnLogRecurringAlert');
            if (alertBtn) {
                alertBtn.onclick = () => {
                    dueToday.forEach(b => logRecurringBillNow(b.id));
                    alertBanner.classList.add('hidden');
                };
            }
        } else {
            alertBanner.classList.add('hidden');
        }
    }

    // ----------------------------------------------------
    // GROUP BILL SPLITTER ENGINE
    // ----------------------------------------------------
    window.openSplitModal = function() {
        document.getElementById('splitModal').classList.add('active');
        const splitCat = document.getElementById('splitCategory');
        if (splitCat) {
            splitCat.innerHTML = Object.keys(categoryMap)
                .map((c) => `<option value="${c}">${c}</option>`).join('');
            splitCat.dispatchEvent(new Event('change'));
        }
    };

    const splitCatEl = document.getElementById('splitCategory');
    const splitSubEl = document.getElementById('splitSub');
    if (splitCatEl && splitSubEl) {
        splitCatEl.addEventListener('change', () => {
            const cat = splitCatEl.value;
            splitSubEl.innerHTML = categoryMap[cat].map(s => `<option value="${s}">${s}</option>`).join('');
        });
    }

    window.calculateSplit = function() {
        const amount = Number(document.getElementById('splitAmount').value) || 0;
        const members = Number(document.getElementById('splitMembers').value) || 1;
        const share = (amount / members).toFixed(2);
        
        const resultText = document.getElementById('splitResultText');
        if (resultText) {
            resultText.innerHTML = `Each person owes: <strong class="text-cyan-400 text-lg">₹${Number(share).toLocaleString('en-IN', {minimumFractionDigits:2})}</strong>`;
        }
        return Number(share);
    };

    document.getElementById('splitForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = Number(document.getElementById('splitAmount').value) || 0;
        const members = Number(document.getElementById('splitMembers').value) || 1;
        const myShare = (amount / members).toFixed(2);

        if (myShare <= 0) {
            showSnackbar("Please enter a valid amount and split count.", "error");
            return;
        }

        const entry = {
            id: Date.now(),
            type: 'expense',
            date: today,
            amount: myShare,
            category: document.getElementById('splitCategory').value,
            sub: document.getElementById('splitSub').value,
            notes: `Split Bill: ${document.getElementById('splitDescription').value || 'Group Outing'} (My share of ₹${amount} split with ${members} people)`
        };

        data.push(entry);
        window.saveData('fin_spendly', data);
        
        document.getElementById('splitForm').reset();
        closeModal('#splitModal');
        updateUI();
        showTransactionPopup('expense');
        showSnackbar(`Logged split: ₹${myShare} recorded successfully! 💸`);
    });

    // Form Event Listeners Setup
    document.addEventListener('DOMContentLoaded', () => {
        const budgetForm = document.getElementById('budgetConfigForm');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const cat = document.getElementById('budgetCategory').value;
                const limit = document.getElementById('budgetLimit').value;
                saveCategoryBudget(cat, limit);
                budgetForm.reset();
            });
        }

        const recurringForm = document.getElementById('recurringConfigForm');
        if (recurringForm) {
            recurringForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('recName').value;
                const amount = document.getElementById('recAmount').value;
                const cat = document.getElementById('recCategory').value;
                const sub = document.getElementById('recSub').value;
                const day = document.getElementById('recDay').value;
                addRecurringBill(name, amount, cat, sub, day);
                recurringForm.reset();
                if (recCategoryEl) recCategoryEl.dispatchEvent(new Event('change'));
            });
        }
    });

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

    // ----------------------------------------------------
    // AI SMART FEATURES & ADVANCED NLP PARSING (SPENDLY)
    // ----------------------------------------------------
    let lastLoggedTransaction = null;

    // Advanced NLP Date Parser
    function parseSmartDate(input) {
        const todayDate = new Date();
        let targetDate = new Date(todayDate);
        const lowerInput = input.toLowerCase();
        
        if (lowerInput.includes('today')) {
            // Already set to today
        } else if (lowerInput.includes('yesterday')) {
            targetDate.setDate(todayDate.getDate() - 1);
        } else if (lowerInput.includes('day before yesterday')) {
            targetDate.setDate(todayDate.getDate() - 2);
        } else {
            const daysAgoMatch = lowerInput.match(/(\d+)\s*days?\s*ago/);
            if (daysAgoMatch) {
                targetDate.setDate(todayDate.getDate() - parseInt(daysAgoMatch[1], 10));
            } else {
                // Check for relative weekdays (e.g. "on monday", "last friday")
                const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                let foundWeekday = -1;
                for (let i = 0; i < 7; i++) {
                    if (new RegExp('\\b' + weekdays[i] + '\\b').test(lowerInput)) {
                        foundWeekday = i;
                        break;
                    }
                }
                
                if (foundWeekday !== -1) {
                    const currentDay = todayDate.getDay();
                    let diff = currentDay - foundWeekday;
                    if (diff <= 0) diff += 7; // Grab the most recent past occurrence
                    targetDate.setDate(todayDate.getDate() - diff);
                } else {
                    // Check for specific date match like "25 june", "25 jun", "june 25"
                    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                    const monthsFull = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                    
                    let monthIdx = -1;
                    let dayNum = -1;
                    
                    for(let i = 0; i < 12; i++) {
                        if (lowerInput.includes(monthsFull[i]) || lowerInput.includes(months[i])) {
                            monthIdx = i;
                            break;
                        }
                    }
                    
                    if (monthIdx !== -1) {
                        const dayMatch = lowerInput.match(/\b(\d{1,2})(st|nd|rd|th)?\b/);
                        if (dayMatch) {
                            dayNum = parseInt(dayMatch[1], 10);
                        }
                    }
                    
                    if (monthIdx !== -1 && dayNum !== -1) {
                        targetDate.setMonth(monthIdx);
                        targetDate.setDate(dayNum);
                        // If date is future-bound, assume previous year
                        if (targetDate > todayDate) {
                            targetDate.setFullYear(todayDate.getFullYear() - 1);
                        }
                    } else {
                        // Standard formats: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD
                        const formatMatch = lowerInput.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/) || lowerInput.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
                        if (formatMatch) {
                            if (formatMatch[3].length === 4) { // DD-MM-YYYY
                                targetDate = new Date(formatMatch[3], formatMatch[2] - 1, formatMatch[1]);
                            } else { // YYYY-MM-DD
                                targetDate = new Date(formatMatch[1], formatMatch[2] - 1, formatMatch[3]);
                            }
                        }
                    }
                }
            }
        }
        return targetDate.toISOString().split('T')[0];
    }

    // Advanced Notes Cleaner
    function extractSmartNotes(input, amount, type, category, sub) {
        let clean = input.toLowerCase();
        
        // Remove amount
        if (amount) {
            clean = clean.replace(new RegExp('\\b' + amount + '\\b', 'g'), '');
        }
        
        // Remove currencies
        const curWords = ['rs', 'rupees', 'bucks', 'rupee', 'cents', 'dollars', 'dollar', 'usd', 'inr', '₹', '\\$'];
        curWords.forEach(w => {
            clean = clean.replace(new RegExp('\\b' + w + '\\b', 'g'), '');
            clean = clean.replace(new RegExp(w, 'g'), '');
        });
        
        // Remove calendar date formats
        clean = clean.replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g, '');
        clean = clean.replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, '');
        
        // Remove relative dates & weekdays
        const dateWords = ['today', 'yesterday', 'day before yesterday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'days? ago', 'ago'];
        dateWords.forEach(w => {
            clean = clean.replace(new RegExp('\\b' + w + '\\b', 'g'), '');
        });
        
        // Remove action triggers
        const verbs = ['spent', 'got', 'received', 'earned', 'logged', 'added', 'add', 'log', 'buy', 'bought', 'paid', 'pay', 'income', 'expense', 'record', 'recorded'];
        verbs.forEach(w => {
            clean = clean.replace(new RegExp('\\b' + w + '\\b', 'g'), '');
        });

        // Remove prepositions & fillers
        const preps = ['on', 'for', 'in', 'at', 'from', 'to', 'with', 'of', 'a', 'an', 'the'];
        preps.forEach(w => {
            clean = clean.replace(new RegExp('\\b' + w + '\\b', 'g'), '');
        });

        // Remove matched category names to clean the string
        if (category) {
            let plainCat = category.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/u, '').toLowerCase().trim();
            clean = clean.replace(new RegExp('\\b' + plainCat + '\\b', 'g'), '');
        }
        if (sub) {
            let plainSub = sub.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/u, '').toLowerCase().trim();
            clean = clean.replace(new RegExp('\\b' + plainSub + '\\b', 'g'), '');
        }

        // Remove brackets, trailing dashes, or punctuation
        clean = clean.replace(/[^a-zA-Z0-9\s]/g, ' ');
        clean = clean.replace(/\s+/g, ' ').trim();
        
        if (!clean) {
            return `Smart Entry: ${category || 'Transaction'}`;
        }
        
        return clean.charAt(0).toUpperCase() + clean.slice(1);
    }

    // Expose Global UI AI Interaction endpoints
    window.aiUndoTransaction = function(id) {
        const idx = data.findIndex(d => d.id === id);
        if (idx !== -1) {
            const removed = data.splice(idx, 1)[0];
            window.saveData('fin_spendly', data);
            updateUI();
            
            if (lastLoggedTransaction && lastLoggedTransaction.id === id) {
                lastLoggedTransaction = null;
            }
            if (window.showSnackbar) window.showSnackbar(`Transaction of ₹${removed.amount} undone! 🗑️`);
            
            const history = document.getElementById('aiChatHistory');
            if (history) {
                const bubble = document.createElement('div');
                bubble.className = 'chat-bubble bot flex gap-2 w-full';
                bubble.innerHTML = `
                    <div class="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400 text-[10px]"><i data-lucide="bot" class="w-3.5 h-3.5"></i></div>
                    <div class="bubble-content shadow-md border border-white/5 bg-white/5 p-3 rounded-2xl text-xs text-slate-200 leading-relaxed">
                        Undone! I have removed the logged transaction of <strong>₹${removed.amount}</strong> for <em>${removed.category}</em>.
                    </div>
                `;
                history.appendChild(bubble);
                history.scrollTop = history.scrollHeight;
                if (window.lucide) lucide.createIcons({ root: bubble });
            }
        }
    };

    window.aiSetBudget = function(category, limit) {
        if (typeof window.saveCategoryBudget === 'function') {
            window.saveCategoryBudget(category, limit);
            if (window.showSnackbar) window.showSnackbar(`Budget configured for ${category}! 🎯`);
            
            const history = document.getElementById('aiChatHistory');
            if (history) {
                const bubble = document.createElement('div');
                bubble.className = 'chat-bubble bot flex gap-2 w-full';
                bubble.innerHTML = `
                    <div class="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400 text-[10px]"><i data-lucide="bot" class="w-3.5 h-3.5"></i></div>
                    <div class="bubble-content shadow-md border border-white/5 bg-white/5 p-3 rounded-2xl text-xs text-slate-200 leading-relaxed">
                        I've set your monthly budget limit for <strong>${category}</strong> to <strong>₹${limit}</strong>.
                    </div>
                `;
                history.appendChild(bubble);
                history.scrollTop = history.scrollHeight;
                if (window.lucide) lucide.createIcons({ root: bubble });
            }
        }
    };

    window.processSmartEntry = function() {
        const input = document.getElementById('smartEntryInput').value;
        if(!input) return;
        
        const lowerInput = input.toLowerCase();

        // 1. Extract clean numeric amount
        // Strips common currency prefixes/suffixes to get clean digits
        const amountMatch = lowerInput.replace(/[₹$]/g, '').match(/\b\d+(\.\d{1,2})?\b/);
        if(!amountMatch) {
            showSnackbar('Could not find transaction amount. Try: "Spent 300 on cab"', 'error');
            return;
        }
        const amount = Number(amountMatch[0]);

        // 2. Parse relative or specific date
        const dateStr = parseSmartDate(lowerInput);
        
        // 3. Determine transaction type
        let type = 'expense';
        if (lowerInput.includes('got') || lowerInput.includes('received') || lowerInput.includes('earned') || lowerInput.includes('income') || lowerInput.includes('salary') || lowerInput.includes('pocket money')) {
            type = 'income';
        }

        // 4. Advanced Category Matching (utilizing full custom category maps)
        let category = 'Other';
        let sub = 'All';

        if (type === 'expense') {
            let bestScore = 0;
            for (const [cat, subList] of Object.entries(fullCategoryMap.expenseMap)) {
                const plainCat = cat.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/u, '').toLowerCase().trim();
                let catScore = new RegExp('\\b' + plainCat + '\\b', 'i').test(lowerInput) ? 3 : 0;
                
                subList.forEach(s => {
                    const plainSub = s.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/u, '').toLowerCase().trim();
                    let score = catScore;
                    
                    if (lowerInput.includes(plainSub)) {
                        score += 15;
                    } else {
                        const words = plainSub.split(/[\s\/&()]+/).filter(w => w.length > 2);
                        let matchedWords = 0;
                        words.forEach(w => {
                            let singular = w.endsWith('s') ? w.slice(0, -1) : w;
                            if (new RegExp('\\b' + w + '\\b', 'i').test(lowerInput) || new RegExp('\\b' + singular + '\\b', 'i').test(lowerInput)) {
                                matchedWords++;
                            }
                        });
                        score += (matchedWords * 4);
                    }
                    
                    if (score > bestScore) {
                        bestScore = score;
                        category = cat;
                        sub = s;
                    }
                });
            }
        } else {
            let bestScore = 0;
            // Match custom incomes first
            fullCategoryMap.incomeList.forEach(inc => {
                const plainInc = inc.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/u, '').toLowerCase().trim();
                let score = 0;
                if (lowerInput.includes(plainInc)) {
                    score += 15;
                } else {
                    const words = plainInc.split(/[\s\/&()]+/).filter(w => w.length > 2);
                    words.forEach(w => {
                        let singular = w.endsWith('s') ? w.slice(0, -1) : w;
                        if (new RegExp('\\b' + w + '\\b', 'i').test(lowerInput) || new RegExp('\\b' + singular + '\\b', 'i').test(lowerInput)) {
                            score += 4;
                        }
                    });
                }
                if (score > bestScore) {
                    bestScore = score;
                    category = inc;
                }
            });
            
            // Fallback default incomes
            if (bestScore === 0) {
                const defaultIncomes = ['💵 Pocket Money', '💼 Salary', '🎁 Gift/Eidi', '🤝 Loan Given Back', '💸 Cashback/Discount', '📈 Investment Returns', '👨‍💻 Freelance/Side Hustle'];
                defaultIncomes.forEach(inc => {
                    const plainInc = inc.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/u, '').toLowerCase().trim();
                    let score = 0;
                    if (lowerInput.includes(plainInc)) {
                        score += 15;
                    } else {
                        const words = plainInc.split(/[\s\/&()]+/).filter(w => w.length > 2);
                        words.forEach(w => {
                            if (new RegExp('\\b' + w + '\\b', 'i').test(lowerInput)) {
                                score += 4;
                            }
                        });
                    }
                    if (score > bestScore) {
                        bestScore = score;
                        category = inc;
                    }
                });
            }
        }

        // 5. Build cleaned, precise notes
        const notes = extractSmartNotes(input, amount, type, category, sub);

        const newEntry = {
            id: Date.now(),
            type: type,
            date: dateStr,
            amount: amount,
            category: category,
            sub: sub,
            notes: notes
        };

        if(typeof checkForAnomaly === 'function' && checkForAnomaly(newEntry)) {
            window.pendingAnomalyEntry = newEntry;
            document.getElementById('anomalyModal').classList.add('active');
            return;
        }

        data.push(newEntry);
        saveData('fin_spendly', data);
        
        lastLoggedTransaction = newEntry;
        
        if (type === 'income' && typeof syncIncomeToPocketCal === 'function') {
            syncIncomeToPocketCal(newEntry);
        }

        document.getElementById('smartEntryInput').value = '';
        updateUI();
        if(typeof showTransactionPopup === 'function') showTransactionPopup(type);
        showSnackbar(`Smart logged ₹${amount} on ${category}! ✨`);
    };

    window.generateAIHealthReport = function() {
        const container = document.getElementById('aiHealthReportContainer');
        const textEl = document.getElementById('aiHealthReportText');
        if(!container || !textEl) return;
        
        container.classList.remove('hidden');
        textEl.innerHTML = '<i class="lucide lucide-loader animate-spin w-5 h-5 inline-block mr-2 text-purple-400"></i> Running structural health diagnostics...';
        if(window.lucide) lucide.createIcons();
        
        setTimeout(() => {
            const currentM = new Date().toISOString().split('T')[0].slice(0, 7);
            let monthInc = 0; let monthExp = 0;
            let topCat = {name: '', amount: 0};
            let catMap = {};
            
            data.forEach(d => {
                if (d.date.startsWith(currentM)) {
                    if (d.type === 'income') monthInc += Number(d.amount);
                    else {
                        monthExp += Number(d.amount);
                        catMap[d.category] = (catMap[d.category] || 0) + Number(d.amount);
                    }
                }
            });

            Object.entries(catMap).forEach(([k, v]) => {
                if(v > topCat.amount) topCat = {name: k, amount: v};
            });

            let savingsRate = monthInc > 0 ? ((monthInc - monthExp) / monthInc * 100) : 0;
            let message = "";

            if(monthInc === 0 && monthExp === 0) {
                message = "💡 No transaction logs registered for this month yet. Log a few items to run structural diagnostics.";
            } else {
                message = `<div class="space-y-3 font-semibold text-slate-300">`;
                
                if (savingsRate < 0) {
                    message += `<p class="flex items-center gap-2 text-rose-400 font-extrabold text-sm"><i data-lucide="alert-circle" class="w-4 h-4"></i> Cash Deficit Detected</p>
                                <p>You have spent <strong>₹${Math.abs(monthInc - monthExp).toLocaleString('en-IN')}</strong> more than you logged. Your current deficit rate is <strong>${Math.abs(savingsRate).toFixed(1)}%</strong>. Immediate spending cuts are advised.</p>`;
                } else if (savingsRate < 20) {
                    message += `<p class="flex items-center gap-2 text-amber-400 font-extrabold text-sm"><i data-lucide="alert-triangle" class="w-4 h-4"></i> Below Savings Threshold</p>
                                <p>You saved <strong>${savingsRate.toFixed(1)}%</strong> of your income this month. Standard recommendations target a 20% savings buffer. Try limiting discretionary spending.</p>`;
                } else {
                    message += `<p class="flex items-center gap-2 text-emerald-400 font-extrabold text-sm"><i data-lucide="check-circle" class="w-4 h-4"></i> Optimal Financial Health</p>
                                <p>Superb budgeting! Your savings rate is a robust <strong>${savingsRate.toFixed(1)}%</strong> (₹${(monthInc - monthExp).toLocaleString('en-IN')} saved). You are on track with your long-term goals.</p>`;
                }

                if(topCat.amount > 0) {
                    let catPercent = (topCat.amount / monthExp) * 100;
                    message += `<div class="mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
                                📊 <strong>Top Category:</strong> ${topCat.name} accounts for <strong>${catPercent.toFixed(1)}%</strong> (₹${topCat.amount.toLocaleString('en-IN')}) of your total monthly expenditures.
                               </div>`;
                }
                message += `</div>`;
            }

            textEl.innerHTML = message;
            if(window.lucide) lucide.createIcons({ root: textEl });
        }, 1200);
    };

    // ----------------------------------------------------
    // AI ADVISOR CHAT ENGINE
    // ----------------------------------------------------
    window.toggleAIChat = function() {
        const sidebar = document.getElementById('aiChatSidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
            if (window.playUISound) window.playUISound('tap');
        }
    };

    // Override the Anime Assistant button if on Spendly page
    const assistantBtn = document.getElementById('animeAssistantBtn');
    if (assistantBtn) {
        const newBtn = assistantBtn.cloneNode(true);
        assistantBtn.parentNode.replaceChild(newBtn, assistantBtn);
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAIChat();
        });
    }

    const aiChatForm = document.getElementById('aiChatForm');
    const aiChatInput = document.getElementById('aiChatInput');
    const aiChatHistory = document.getElementById('aiChatHistory');

    if (aiChatForm && aiChatInput && aiChatHistory) {
        aiChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const prompt = aiChatInput.value.trim();
            if (!prompt) return;

            appendChatBubble(prompt, 'user');
            aiChatInput.value = '';
            aiChatHistory.scrollTop = aiChatHistory.scrollHeight;

            setTimeout(() => {
                const response = processAIQuery(prompt);
                appendChatBubble(response, 'bot');
                aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
                if (window.playUISound) window.playUISound('on');
            }, 600);
        });
    }

    function appendChatBubble(text, sender) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender} flex gap-2 w-full`;
        
        let avatar = '';
        if (sender === 'bot') {
            avatar = `<div class="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400 text-[10px]"><i data-lucide="bot" class="w-3.5 h-3.5"></i></div>`;
        } else {
            avatar = `<div class="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400 text-[10px]"><i data-lucide="user" class="w-3.5 h-3.5"></i></div>`;
        }

        bubble.innerHTML = `
            ${sender === 'bot' ? avatar : ''}
            <div class="bubble-content shadow-md border border-white/5 rounded-2xl leading-relaxed text-xs">
                ${text}
            </div>
            ${sender === 'user' ? avatar : ''}
        `;
        aiChatHistory.appendChild(bubble);
        if (window.lucide) lucide.createIcons({ root: bubble });
    }

    function processAIQuery(query) {
        const lowerQuery = query.toLowerCase().trim();
        const currentM = today.slice(0, 7);
        const monthlyIncome = data.filter(d => d.type === 'income' && d.date.startsWith(currentM)).reduce((s, d) => s + Number(d.amount), 0);
        const monthlyExpense = data.filter(d => d.type === 'expense' && d.date.startsWith(currentM)).reduce((s, d) => s + Number(d.amount), 0);
        const balance = monthlyIncome - monthlyExpense;

        // Intent 1: Undo / Delete
        if (lowerQuery === 'undo' || lowerQuery === 'delete last' || lowerQuery === 'scratch that' || lowerQuery === 'cancel last' || lowerQuery === 'remove last') {
            if (lastLoggedTransaction) {
                const id = lastLoggedTransaction.id;
                const idx = data.findIndex(d => d.id === id);
                if (idx !== -1) {
                    const removed = data.splice(idx, 1)[0];
                    window.saveData('fin_spendly', data);
                    updateUI();
                    lastLoggedTransaction = null;
                    return `Transaction undone! 🗑️<br>I've removed the entry of <strong>₹${removed.amount}</strong> for <em>${removed.category}</em>.`;
                }
            }
            // Fallback: Delete most recent transaction logged today
            const todayLogs = data.filter(d => d.date === today);
            if (todayLogs.length > 0) {
                const target = todayLogs[todayLogs.length - 1];
                const idx = data.findIndex(d => d.id === target.id);
                if (idx !== -1) {
                    data.splice(idx, 1);
                    window.saveData('fin_spendly', data);
                    updateUI();
                    return `Undid your last logged transaction from today: removed <strong>₹${target.amount}</strong> for <em>${target.category}</em>.`;
                }
            }
            return "I couldn't find any recent transactions in this session to undo.";
        }

        // Intent 2: Edit Last Transaction Amount or Details
        if (lastLoggedTransaction && (lowerQuery.includes('actually') || lowerQuery.includes('change') || lowerQuery.includes('correct'))) {
            const idx = data.findIndex(d => d.id === lastLoggedTransaction.id);
            if (idx !== -1) {
                let updated = false;
                
                // 2a. Modify amount
                const amtMatch = lowerQuery.replace(/[₹$]/g, '').match(/\b\d+(\.\d{1,2})?\b/);
                if (amtMatch) {
                    const oldAmt = data[idx].amount;
                    data[idx].amount = Number(amtMatch[0]);
                    updated = true;
                }
                
                // 2b. Modify category
                let matchedCat = null;
                let matchedSub = null;
                for (const [cat, subList] of Object.entries(fullCategoryMap.expenseMap)) {
                    if (lowerQuery.includes(cat.toLowerCase())) {
                        matchedCat = cat;
                        break;
                    }
                    for (let s of subList) {
                        const plainSub = s.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/u, '').toLowerCase();
                        if (lowerQuery.includes(plainSub)) {
                            matchedCat = cat;
                            matchedSub = s;
                            break;
                        }
                    }
                }
                if (matchedCat) {
                    data[idx].category = matchedCat;
                    if (matchedSub) data[idx].sub = matchedSub;
                    updated = true;
                }

                // 2c. Modify notes
                if (lowerQuery.includes('notes') || lowerQuery.includes('for') || lowerQuery.includes('description')) {
                    const notesMatch = query.match(/(?:notes|for|to)\s+(.+)$/i);
                    if (notesMatch) {
                        data[idx].notes = notesMatch[1].trim();
                        updated = true;
                    }
                }

                if (updated) {
                    window.saveData('fin_spendly', data);
                    updateUI();
                    return `Done! I've updated your last transaction details:<br><br>
                            <strong>Amount:</strong> ₹${data[idx].amount}<br>
                            <strong>Category:</strong> ${data[idx].category} (${data[idx].sub || 'All'})<br>
                            <strong>Notes:</strong> ${data[idx].notes}`;
                }
            }
        }

        // Intent 3: Log a new transaction via Chat
        if (lowerQuery.startsWith('add') || lowerQuery.startsWith('log') || lowerQuery.includes('spent') || lowerQuery.includes('got') || lowerQuery.includes('received') || lowerQuery.includes('paid')) {
            const amountMatch = lowerQuery.replace(/[₹$]/g, '').match(/\b\d+(\.\d{1,2})?\b/);
            if (!amountMatch) {
                return "I need an amount to log a transaction. Try: <em>'Spent 500 on Food'</em>.";
            }
            const amount = Number(amountMatch[0]);
            
            let type = 'expense';
            if (lowerQuery.includes('got') || lowerQuery.includes('received') || lowerQuery.includes('earned') || lowerQuery.includes('income') || lowerQuery.includes('salary') || lowerQuery.includes('pocket money')) {
                type = 'income';
            }

            let category = 'Other';
            let sub = 'All';

            if (type === 'expense') {
                let bestScore = 0;
                for (const [cat, subList] of Object.entries(fullCategoryMap.expenseMap)) {
                    const plainCat = cat.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/u, '').toLowerCase().trim();
                    let catScore = new RegExp('\\b' + plainCat + '\\b', 'i').test(lowerQuery) ? 3 : 0;
                    
                    subList.forEach(s => {
                        const plainSub = s.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/u, '').toLowerCase().trim();
                        let score = catScore;
                        
                        if (lowerQuery.includes(plainSub)) {
                            score += 15;
                        } else {
                            const words = plainSub.split(/[\s\/&()]+/).filter(w => w.length > 2);
                            let matchedWords = 0;
                            words.forEach(w => {
                                let singular = w.endsWith('s') ? w.slice(0, -1) : w;
                                if (new RegExp('\\b' + w + '\\b', 'i').test(lowerQuery) || new RegExp('\\b' + singular + '\\b', 'i').test(lowerInput)) {
                                    matchedWords++;
                                }
                            });
                            score += (matchedWords * 4);
                        }
                        
                        if (score > bestScore) {
                            bestScore = score;
                            category = cat;
                            sub = s;
                        }
                    });
                }
            } else {
                let bestScore = 0;
                fullCategoryMap.incomeList.forEach(inc => {
                    const plainInc = inc.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/u, '').toLowerCase().trim();
                    let score = 0;
                    if (lowerQuery.includes(plainInc)) {
                        score += 15;
                    } else {
                        const words = plainInc.split(/[\s\/&()]+/).filter(w => w.length > 2);
                        words.forEach(w => {
                            let singular = w.endsWith('s') ? w.slice(0, -1) : w;
                            if (new RegExp('\\b' + w + '\\b', 'i').test(lowerQuery) || new RegExp('\\b' + singular + '\\b', 'i').test(lowerQuery)) {
                                score += 4;
                            }
                        });
                    }
                    if (score > bestScore) {
                        bestScore = score;
                        category = inc;
                    }
                });
            }

            const parsedDate = parseSmartDate(lowerQuery);
            const notes = extractSmartNotes(query, amount, type, category, sub);

            const entry = {
                id: Date.now(),
                type: type,
                date: parsedDate,
                amount: amount,
                category: category,
                sub: sub,
                notes: notes
            };

            data.push(entry);
            window.saveData('fin_spendly', data);
            
            lastLoggedTransaction = entry;
            
            if (type === 'income' && typeof syncIncomeToPocketCal === 'function') {
                syncIncomeToPocketCal(entry);
            }
            updateUI();
            
            return `<div class="space-y-2">
                        <p class="text-emerald-400 font-extrabold flex items-center gap-1.5"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Transaction Logged</p>
                        <p>I have added <strong>₹${amount.toLocaleString('en-IN')}</strong> to your ledger.</p>
                        <div class="text-[10px] bg-white/5 border border-white/5 rounded-xl p-2.5 mt-1 space-y-1 text-slate-400">
                            <div>• <strong>Type:</strong> ${type.toUpperCase()}</div>
                            <div>• <strong>Date:</strong> ${parsedDate}</div>
                            <div>• <strong>Category:</strong> ${category} (${sub})</div>
                            <div>• <strong>Notes:</strong> ${notes}</div>
                        </div>
                        <div class="flex gap-2 mt-2">
                            <button onclick="window.aiUndoTransaction(${entry.id})" class="text-[10px] font-extrabold bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white px-2.5 py-1.5 rounded-lg transition-all">Undo</button>
                            <button onclick="window.openEditModal(${entry.id})" class="text-[10px] font-extrabold bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500 hover:text-white px-2.5 py-1.5 rounded-lg transition-all">Edit Details</button>
                        </div>
                    </div>`;
        }

        // Intent 4: Budget recommendations & suggestions
        if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('advice') || lowerQuery.includes('tip')) {
            const monthlySpends = {};
            data.filter(d => d.type === 'expense' && d.date.startsWith(currentM)).forEach(d => {
                monthlySpends[d.category] = (monthlySpends[d.category] || 0) + Number(d.amount);
            });

            let suggestions = `<strong>AI Smart Budget Recommendation:</strong><br><br>`;
            const cats = ['Food', 'Travel', 'Shopping', 'Entertainment'];
            let addedSug = false;

            cats.forEach(cat => {
                const spent = monthlySpends[cat] || 0;
                if (spent > 0) {
                    const suggestedLimit = Math.round(spent * 0.85); // Suggest 15% reduction
                    suggestions += `<div class="mb-3 p-2.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
                                        <div>
                                            <p class="font-extrabold text-slate-200">${cat}</p>
                                            <p class="text-[10px] text-muted">Current Spend: ${fmt(spent)}</p>
                                        </div>
                                        <button onclick="window.aiSetBudget('${cat}', ${suggestedLimit})" class="px-2.5 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-[10px] font-extrabold hover:bg-cyan-500 hover:text-white transition">Limit ₹${suggestedLimit}</button>
                                    </div>`;
                    addedSug = true;
                }
            });

            if (!addedSug) {
                suggestions += `<p>I suggestion configuring baseline target limits to set up safe boundaries:</p>
                                <div class="space-y-2 mt-3">
                                    <div class="p-2.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
                                        <span>🍔 Food Budget</span>
                                        <button onclick="window.aiSetBudget('Food', 4000)" class="px-2.5 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-[10px] font-extrabold hover:bg-cyan-500 hover:text-white transition">Limit ₹4,000</button>
                                    </div>
                                    <div class="p-2.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
                                        <span>🛺 Travel Budget</span>
                                        <button onclick="window.aiSetBudget('Travel', 2000)" class="px-2.5 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-[10px] font-extrabold hover:bg-cyan-500 hover:text-white transition">Limit ₹2,000</button>
                                    </div>
                                </div>`;
            }
            return suggestions;
        }

        // Intent 5: Budget Status Query
        if (lowerQuery.includes('budget') || lowerQuery.includes('limit')) {
            const activeBudgets = Object.keys(budgets);
            if (activeBudgets.length === 0) {
                return "No budgets configured yet. Create a category limit in the Category Budgets card on your dashboard!";
            }

            const monthlySpends = {};
            data.filter(d => d.type === 'expense' && d.date.startsWith(currentM)).forEach(d => {
                monthlySpends[d.category] = (monthlySpends[d.category] || 0) + Number(d.amount);
            });

            let status = `<strong>Category Budgets Summary:</strong><br><br>`;
            activeBudgets.forEach(cat => {
                const limit = budgets[cat];
                const spent = monthlySpends[cat] || 0;
                const p = Math.round((spent / limit) * 100);
                status += `<div class="mb-2">
                             <div class="flex justify-between text-xs font-semibold mb-1">
                                <span>${cat}</span>
                                <span class="${p >= 100 ? 'text-rose-400' : p >= 80 ? 'text-amber-400' : 'text-slate-300'}">${fmt(spent)} / ${fmt(limit)} (${p}%)</span>
                             </div>
                             <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div class="h-full rounded-full bg-gradient-to-r ${p >= 100 ? 'from-rose-500 to-red-500' : p >= 80 ? 'from-amber-400 to-orange-500' : 'from-cyan-400 to-indigo-400'}" style="width: ${Math.min(p, 100)}%"></div>
                             </div>
                           </div>`;
            });
            return status;
        }

        // Intent 6: Spending Forecast
        if (lowerQuery.includes('predict') || lowerQuery.includes('forecast') || lowerQuery.includes('trend')) {
            const daysInMonth = new Date(today.slice(0, 4), today.slice(5, 7), 0).getDate();
            const currentDay = parseInt(today.slice(8, 10), 10);
            
            if (currentDay === 0 || monthlyExpense === 0) {
                return "Not enough transaction history to run spending forecast projections.";
            }

            const velocity = monthlyExpense / currentDay;
            const projected = velocity * daysInMonth;

            let diagnosis = `<strong>AI Spend Forecast:</strong><br><br>`;
            diagnosis += `• Daily Burn Velocity: <strong>${fmt(velocity)}/day</strong><br>`;
            diagnosis += `• Projected Month-End: <strong>${fmt(projected)}</strong><br><br>`;

            if (monthlyIncome > 0) {
                const deficit = projected - monthlyIncome;
                if (projected > monthlyIncome) {
                    diagnosis += `<p class="text-rose-400 flex items-center gap-1"><i data-lucide="alert-triangle" class="w-4 h-4"></i> warning:</p>
                                  You are on track to exceed your income by <strong>${fmt(deficit)}</strong>. Recommend slowing discretionary purchases.`;
                } else {
                    diagnosis += `<p class="text-emerald-400 flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> safe:</p>
                                  Safely inside income limits. Projected surplus: <strong>${fmt(monthlyIncome - projected)}</strong>.`;
                }
            } else {
                diagnosis += `💡 Tip: Log your monthly income to unlock savings projection metrics.`;
            }
            return diagnosis;
        }

        // Intent 7: Basic Metrics
        if (lowerQuery.includes('spend') || lowerQuery.includes('expense')) {
            return `You've spent a total of <strong>${fmt(monthlyExpense)}</strong> this month.`;
        }

        if (lowerQuery.includes('income') || lowerQuery.includes('earn')) {
            return `You've logged a total income of <strong>${fmt(monthlyIncome)}</strong> this month.`;
        }

        if (lowerQuery.includes('balance') || lowerQuery.includes('net')) {
            return `Your net balance for this month is <strong>${fmt(balance)}</strong> (Income: ${fmt(monthlyIncome)}, Expense: ${fmt(monthlyExpense)}).`;
        }

        return `I can help you audit and record transactions!
                <br><br>
                Try saying:
                <ul class="list-disc pl-4 mt-2 space-y-1 text-muted">
                    <li>"How much did I spend this month?"</li>
                    <li>"Show my budget status"</li>
                    <li>"Predict my month end spending"</li>
                    <li>"Add expense 350 for travel yesterday"</li>
                    <li>"Suggest budgets"</li>
                </ul>`;
    }

    window.addEventListener('DOMContentLoaded', () => {
        updateUI();
        // Redraw charts on theme change
        document.addEventListener('themeChanged', renderCharts);
    });

})();
