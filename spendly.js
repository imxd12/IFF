/* ========================================================================
   MONEYFLOW - SPENDLY.JS
   Analytics Logic, Sync, PDF generation. Fully retained functional math.
======================================================================== */

(function () {
    'use strict';

    // Categories
    const categoryMap = {
        Travel: ['🛺 Rickshaw', '🚍 BEST Bus', '🚌 Luxury Bus', '🚗 Taxi', '🚖 Local Transport', '🚇 Metro', '🚆 Train', '🚕 Ola/Uber', '🛵 Bike Petrol', '⛽ Fuel', '🅿️ Parking', '🛤️ Toll', '🎫 Monthly Pass', '🚶 Walking', '🚲 Bicycle', 'All'],
        Food: ['🍳 Breakfast', '🥪 Lunch', '🍛 Dinner', '🍿 Snacks', '☕ Tea/Chai', '🥤 Cold Drinks', '🥤 Juice', '🍲 Home Food', '🍔 Outside Food', '🥙 Street Food', '🛒 Groceries', '🥬 Vegetables', '🍎 Fruits', 'All'],
        Rent: ['🏠 House Rent', '🏡 PG/Hostel', '🏢 Room Rent', '💡 Electricity Bill', '💧 Water Bill', '🔥 Gas Cylinder', '🌐 Internet/WiFi', '📱 Mobile Recharge', 'All'],
        Shopping: ['👕 Clothes', '👟 Shoes', '🧢 Daily Wear', '🧴 Personal Care', '📱 Mobile', '💻 Laptop', '🛍️ Online Shopping', 'All'],
        Bills: ['📱 Mobile Recharge', '💡 Electricity', '📶 Data Pack', '🏦 Bank Charges', '🌊 Water', '🌐 WiFi', '🎬 Netflix/Prime', '💳 Credit Card Bill', 'All'],
        Health: ['💊 Medicines', '🧴 Skin Care', '🩺 Doctor Visit', '🧠 Mental Therapy', '🏥 Hospital', '🦷 Dental', '🧘 Yoga', '🏋️ Gym', 'All'],
        Entertainment: ['🎬 Movies', '🎮 Games', '🎵 Music', '🎥 YouTube Premium', '🍿 Outing', '🎡 Fun Activities', '🎂 Party', 'All'],
        Education: ['📚 Books', '🖊️ Stationary', '🏫 College Fees', '📘 College Manual Fees', '📝 Exam Fees', '💻 Online Course', '🧑‍🏫 Coaching Classes', '🎓 Tuition Fees', '📑 Admission Fees', '🧾 Library Fees', '🧪 Lab Fees', '🚌 Transportation Fees', '🏠 Hostel Fees', '📖 Study Materials', 'All'],
        Savings: ['🏦 Bank Saving', '💰 Cash Saving', '📈 Mutual Funds', '📊 Stocks', '💳 SIP', '🏅 Gold', '🚨 Emergency Fund', 'All'],
        Family: ['🍛 Family Food', '🎁 Gifts', '🎉 Festivals', '👶 Kids', '👵 Medical Care', '🏠 Home Needs', 'All'],
        Other: ['💇 Haircut', '💅 Salon', '📦 Courier', '🚗 Vehicle Service', '💵 Charity', '🚬 Smoking', '🍺 Alcohol', 'All']
    };

    let data = loadData('fin_spendly') || [];
    let showLimit = 6;
    let showAll = false;
    let charts = {};

    const today = new Date().toISOString().split('T')[0];
    
    // Elements
    const expenseCategoryEl = document.getElementById('expenseCategory');
    const expenseSubEl = document.getElementById('expenseSub');

    // Init Categories
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
        if(!confirm("Delete transaction permanently?")) return;
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
    // PDF BANK PASSBOOK EXPORT (USING JSPDF + AUTOTABLE)
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

    window.generatePDF = function() {
        try {
            if(!window.jspdf) {
                showSnackbar('PDF generator loading... please try again.', 'error');
                return;
            }

            const doc = new window.jspdf.jsPDF();

            const range = document.querySelector('input[name="pdfRange"]:checked').value;
            let filteredData = [...data];
            const nToday = new Date();
            // Timezones can shift, lets pad it to locale just in case, or use naive ISO split
            const tzoffset = nToday.getTimezoneOffset() * 60000;
            const todayStr = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

            if (range === 'today') {
                filteredData = filteredData.filter(d => d.date === todayStr);
            } else if (range === 'week') {
                const lastWeek = new Date(nToday);
                lastWeek.setDate(lastWeek.getDate() - 7);
                const lwStr = (new Date(lastWeek.getTime() - tzoffset)).toISOString().split('T')[0];
                filteredData = filteredData.filter(d => d.date >= lwStr && d.date <= todayStr);
            } else if (range === 'month') {
                const currentMonth = todayStr.slice(0,7);
                filteredData = filteredData.filter(d => d.date.startsWith(currentMonth));
            } else if (range === 'year') {
                const currentYear = todayStr.slice(0,4);
                filteredData = filteredData.filter(d => d.date.startsWith(currentYear));
            } else if (range === 'custom') {
                const sDate = document.getElementById('pdfStartDate').value;
                const eDate = document.getElementById('pdfEndDate').value;
                if(!sDate || !eDate) {
                    showSnackbar('Please select both start and end dates', 'error');
                    return;
                }
                filteredData = filteredData.filter(d => d.date >= sDate && d.date <= eDate);
            }
            
            if(filteredData.length === 0) {
                showSnackbar('No transactions found in this range', 'info');
                return;
            }

            // Passbook: Date | Description | Dr/Cr | Balance
            const sortedAsc = filteredData.sort((a,b)=> new Date(a.date) - new Date(b.date));
            let runningBal = 0;
            const passbookData = sortedAsc.map(d => {
                const isInc = d.type === 'income';
                runningBal += (isInc ? Number(d.amount) : -Number(d.amount));
                
                return {
                    date: d.date,
                    desc: d.category + (d.sub ? ` - ${d.sub}` : '') + (d.notes ? `\n${d.notes}` : ''),
                    dr: !isInc ? d.amount : '-', // Debit
                    cr: isInc ? d.amount : '-',  // Credit
                    bal: runningBal
                };
            });

            let exportRows = passbookData;
            
            if(exportRows.length === 0){
                showSnackbar('No data to export for this range.');
                return;
            }

            // Write Header info to PDF
            doc.setFontSize(20);
            doc.setTextColor(16, 185, 129);
            doc.text('MoneyFlow Analytics', 14, 22);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Report Range: ${range.toUpperCase()}`, 14, 30);
            doc.text(`Generated on: ${todayStr}`, 14, 35);
            doc.text(`Total Transactions: ${passbookData.length}`, 14, 40);

            const tableRows = exportRows.map(r => [
                r.date, r.desc, r.dr, r.cr, r.bal.toFixed(2)
            ]);

            // AutoTable
            doc.autoTable({
                startY: 50,
                head: [['Date', 'Description', 'Debit (Dr)', 'Credit (Cr)', 'Balance (₹)']],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] },
                styles: { font: 'helvetica', fontSize: 10 },
                didParseCell: function(data) {
                    if (data.section === 'body') {
                        if (data.column.index === 2 && data.cell.raw !== '-') data.cell.styles.textColor = [239, 68, 68];
                        if (data.column.index === 3 && data.cell.raw !== '-') data.cell.styles.textColor = [16, 185, 129];
                        if (data.column.index === 4) data.cell.styles.fontStyle = 'bold';
                    }
                }
            });

            doc.save(`MoneyFlow_Passbook_${todayStr}.pdf`);
            closeModal('#pdfModal');
            showSnackbar('Passbook PDF Exported Successfully! 🎉');

        } catch (e) {
            console.error(e);
            showSnackbar('PDF Generation Failed.', 'error');
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

    window.addEventListener('DOMContentLoaded', () => {
        updateUI();
        // Redraw charts on theme change
        document.addEventListener('themeChanged', renderCharts);
    });

})();
