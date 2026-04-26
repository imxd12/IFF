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
        
        if (type === 'income') {
            if (switcherPill) {
                switcherPill.style.transform = 'translateX(0%)';
                switcherPill.style.backgroundColor = '#10b981';
            }
            if (incomeBtn) incomeBtn.className = "relative flex-1 py-2 text-sm font-bold rounded-xl text-white transition-colors duration-300 z-10";
            if (expenseBtn) expenseBtn.className = "relative flex-1 py-2 text-sm font-bold rounded-xl text-muted hover:text-white transition-colors duration-300 z-10";
        } else {
            if (switcherPill) {
                switcherPill.style.transform = 'translateX(100%)';
                switcherPill.style.backgroundColor = '#ef4444';
            }
            if (expenseBtn) expenseBtn.className = "relative flex-1 py-2 text-sm font-bold rounded-xl text-white transition-colors duration-300 z-10";
            if (incomeBtn) incomeBtn.className = "relative flex-1 py-2 text-sm font-bold rounded-xl text-muted hover:text-white transition-colors duration-300 z-10";
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
        document.getElementById('editCategory').value = item.type === 'income' ? item.category : `${item.category} - ${item.sub}`;
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
            // Free text edit simplifies categorical updates slightly
            data[idx].category = document.getElementById('editCategory').value;
            data[idx].sub = ''; 
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
                    }
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

    function updateUI() {
        populateMonthFilter();
        calcTotals();
        renderList(document.getElementById('searchInput') ? document.getElementById('searchInput').value : '');
        renderCharts();
    }

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
                'uber': ['🚕 Transportation', 'Uber / Ola'],
                'ola': ['🚕 Transportation', 'Uber / Ola'],
                'train': ['🚕 Transportation', 'Public Transit'],
                'flight': ['🚕 Transportation', 'Flights'],
                'amazon': ['🛍️ Shopping', 'Online Shopping'],
                'flipkart': ['🛍️ Shopping', 'Online Shopping'],
                'movie': ['🎬 Entertainment', 'Movies'],
                'netflix': ['🎬 Entertainment', 'Subscriptions'],
                'spotify': ['🎬 Entertainment', 'Subscriptions'],
                'hospital': ['💊 Health & Fitness', 'Medical'],
                'pharmacy': ['💊 Health & Fitness', 'Medical'],
                'gym': ['💊 Health & Fitness', 'Gym'],
                'wifi': ['🧾 Bills & Utilities', 'Internet'],
                'recharge': ['🧾 Bills & Utilities', 'Mobile Recharge']
            };

            for(const [keyword, [main, sub]] of Object.entries(keywordMap)) {
                if(val.includes(keyword)) {
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
                    if(subExists && subSelect.value !== matchedSub) {
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
