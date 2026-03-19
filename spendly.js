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
        Education: ['📚 Books', '🖊️ Stationary', '🏫 College Fees', '📝 Exam Fees', '💻 Online Course', '🧑‍🏫 Coaching Classes', 'All'],
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

        // Toggle buttons visual
        const incomeBtn = document.querySelector('button[onclick="switchType(\'income\')"]');
        const expenseBtn = document.querySelector('button[onclick="switchType(\'expense\')"]');
        
        if (type === 'income') {
            incomeBtn.className = "px-6 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white shadow-md transition-transform active:scale-95";
            expenseBtn.className = "px-6 py-2 rounded-xl text-sm font-bold bg-transparent text-muted hover:bg-glass-hover transition-colors";
        } else {
            expenseBtn.className = "px-6 py-2 rounded-xl text-sm font-bold bg-red-500 text-white shadow-md transition-transform active:scale-95";
            incomeBtn.className = "px-6 py-2 rounded-xl text-sm font-bold bg-transparent text-muted hover:bg-glass-hover transition-colors";
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
        showSnackbar('Income added successfully! 💰');
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
        showSnackbar('Expense added successfully! 💸');
    });

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
