/* ========================================================================
   MONEYFLOW - POCKETCAL.JS
   Calendar Generation, Sync with `fin_pocketcal`, PDF Passbook Extractor
======================================================================== */

(function() {
    'use strict';

    let data = loadData('fin_pocketcal') || [];
    let requests = loadData('fin_pocketcal_requests') || [];
    let current = new Date();
    current.setDate(1);
    let selectedDate = null;
    let charts = {};

    // ----------------------------------------------------
    // RENDER CALENDAR
    // ----------------------------------------------------
    function renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        const year = current.getFullYear();
        const month = current.getMonth();
        const today = new Date().toISOString().split('T')[0];
        
        document.getElementById('calMonth').textContent = current.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Blank cells
        for (let i = 0; i < firstDay; i++) {
            const blank = document.createElement('div');
            blank.className = 'day blank';
            grid.appendChild(blank);
        }
        
        // Actual days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const entry = data.find(d => d.date === dateStr);
            
            const dayEl = document.createElement('div');
            dayEl.className = 'day';
            if (entry) dayEl.classList.add('has-entry');
            if (dateStr === today) dayEl.classList.add('today');
            
            dayEl.innerHTML = `
                <div class="date-num">${i}</div>
                ${entry ? `<div class="date-amount">${fmt(entry.amount)}</div>` : ''}
            `;
            
            dayEl.onclick = () => openEntryModal(dateStr, entry);
            grid.appendChild(dayEl);
        }
        
        updateSummary();
        renderCharts();
        if(typeof populatePocketMonthFilter === 'function') populatePocketMonthFilter();
        if(typeof checkPcStreaks === 'function') checkPcStreaks();
        if(typeof updateForecast === 'function') updateForecast();
        if(typeof renderRequests === 'function') renderRequests();
    }

    // ----------------------------------------------------
    // STATS SUMMARY
    // ----------------------------------------------------
    function updateSummary() {
        const currentMonthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        
        const allTotal = data.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        document.getElementById('pcAll').textContent = fmt(allTotal);
        
        const monthEntries = data.filter(d => d.date && d.date.startsWith(currentMonthStr));
        const monthTotal = monthEntries.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        document.getElementById('pcMonth').textContent = fmt(monthTotal);
        
        let avg = 0;
        if (monthEntries.length > 0) {
            const max = Math.max(...monthEntries.map(e => Number(e.amount || 0)));
            document.getElementById('pcHigh').textContent = fmt(max);
            avg = monthTotal / monthEntries.length;
            document.getElementById('pcAvg').textContent = fmt(avg);
        } else {
            document.getElementById('pcHigh').textContent = '₹0';
            document.getElementById('pcAvg').textContent = '₹0';
        }

    }

    // ----------------------------------------------------
    // MODAL HANDLING
    // ----------------------------------------------------
    window.openTodayEntry = function() {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
        window.openEntryModal(localISOTime);
    };

    window.openEntryModal = function(dateStr, entry) {
        selectedDate = dateStr;
        document.getElementById('pcDate').value = dateStr;
        document.getElementById('pcAmount').value = entry ? entry.amount : '';
        document.getElementById('pcNotes').value = entry ? (entry.notes || '') : '';
        
        document.getElementById('pcDelete').style.display = entry ? 'flex' : 'none';
        document.getElementById('modalTitle').textContent = entry ? 'Edit Entry' : 'Add Entry';
        
        document.getElementById('entryModal').classList.add('active');
    };

    window.closeEntryModal = function() {
        document.getElementById('entryModal').classList.remove('active');
        selectedDate = null;
    };

    // ----------------------------------------------------
    // FORM SUBMISSION AND 2 WAY SYNC LOGIC
    // ----------------------------------------------------

    window.pendingPcAnomalyEntry = null;

    window.confirmPcAnomaly = function() {
        if(window.pendingPcAnomalyEntry) {
            let existing = data.find(d => d.date === window.pendingPcAnomalyEntry.date);
            data = data.filter(d => d.date !== window.pendingPcAnomalyEntry.date);
            data.push(window.pendingPcAnomalyEntry);
            saveData('fin_pocketcal', data);
            syncPocketToSpendly(window.pendingPcAnomalyEntry, existing);
            renderCalendar();
            closeEntryModal();
            showSnackbar('Entry saved! 💾');
            
            window.pendingPcAnomalyEntry = null;
            document.getElementById('pcAnomalyModal').classList.remove('active');
        }
    };

    window.cancelPcAnomaly = function() {
        window.pendingPcAnomalyEntry = null;
        document.getElementById('pcAnomalyModal').classList.remove('active');
    };

    function checkForPcAnomaly(amount, date) {
        // Look for exact same amount in the last 5 days
        const recent = data.find(d => {
            if(d.date === date) return false;
            let d1 = new Date(d.date);
            let d2 = new Date(date);
            let diff = Math.abs(d2 - d1) / (1000*60*60*24);
            return diff <= 5 && Number(d.amount) === Number(amount);
        });
        return recent != null;
    }


    document.getElementById('pcForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const date = document.getElementById('pcDate').value;
        const amount = Number(document.getElementById('pcAmount').value);
        const notes = document.getElementById('pcNotes').value;
        const category = document.getElementById('pcCategory').value;
        
        const newEntry = {
            id: Date.now().toString(),
            date: date,
            amount: amount,
            category: category,
            notes: notes,
            source: 'pocketcal'
        };

        if(checkForPcAnomaly(amount, date)) {
            window.pendingPcAnomalyEntry = newEntry;
            document.getElementById('pcAnomalyModal').classList.add('active');
            return;
        }
        
        let existing = data.find(d => d.date === date);
        data = data.filter(d => d.date !== date);
        data.push(newEntry);
        saveData('fin_pocketcal', data);

        // 2-WAY SYNC TO SPENDLY
        syncPocketToSpendly(newEntry, existing);

        renderCalendar();
        closeEntryModal();
        showSnackbar('Entry saved! 💾');
    });

    document.getElementById('pcDelete').addEventListener('click', () => {
        window.showConfirmModal(
            'Delete Entry?', 
            'This pocketcal entry will be permanently deleted.', 
            'Delete', 
            () => {
                const existing = data.find(d => d.date === selectedDate);
                
                data = data.filter(d => d.date !== selectedDate);
                saveData('fin_pocketcal', data);

                // SYNC DELETION TO SPENDLY
                if(existing) {
                    deleteSpendlyForPocketCal(existing.id);
                }

                renderCalendar();
                closeEntryModal();
                showSnackbar('Entry deleted! 🗑️');
            }
        );
    });

    function syncPocketToSpendly(newEntry, oldEntry) {
        let spendData = loadData('fin_spendly') || [];
        
        // Remove old entry if this was edited
        if (oldEntry) {
            spendData = spendData.filter(d => d.id.toString() !== oldEntry.id.toString());
        }

        // Add new income entry in Spendly
        spendData.push({
            id: Number(newEntry.id),
            type: 'income',
            date: newEntry.date,
            amount: newEntry.amount,
            category: newEntry.category,
            sub: '',
            notes: newEntry.notes || '(From PocketCal)'
        });

        saveData('fin_spendly', spendData);
    }

    function deleteSpendlyForPocketCal(idstr) {
        let spendData = loadData('fin_spendly') || [];
        const beforeLen = spendData.length;
        spendData = spendData.filter(d => d.id.toString() !== idstr);
        if (spendData.length !== beforeLen) saveData('fin_spendly', spendData);
    }

    // ----------------------------------------------------
    // AI SMART FEATURES (POCKETCAL)
    // ----------------------------------------------------

    window.checkPcStreaks = function() {
        const streakBanner = document.getElementById('pcStreakBanner');
        if (!streakBanner) return;
        
        let loggingStreak = 0;
        const todayObj = new Date();
        
        for(let i=0; i<30; i++) {
            let d = new Date(todayObj);
            d.setDate(d.getDate() - i);
            let ds = d.toISOString().split('T')[0];
            
            let hasEntry = data.find(tx => tx.date === ds && Number(tx.amount) > 0);
            if(hasEntry) loggingStreak++;
            else if(i !== 0) break; // if missed yesterday or earlier, break streak
        }

        if(loggingStreak >= 3) {
            streakBanner.classList.remove('hidden');
            document.getElementById('pcStreakTitle').textContent = `🔥 ${loggingStreak}-Day Allowance Streak!`;
            document.getElementById('pcStreakDesc').textContent = "Consistent tracking makes sure you are always on budget.";
        } else {
            streakBanner.classList.add('hidden');
        }
    };

    window.processPcSmartEntry = function() {
        const input = document.getElementById('pcSmartEntryInput').value.toLowerCase();
        if(!input) return;
        
        const amountMatch = input.match(/\d+(\.\d{1,2})?/);
        if(!amountMatch) {
            showSnackbar('Could not find an amount. Try "Got 200 today"');
            return;
        }
        const amount = Number(amountMatch[0]);

        // Smart Date Parsing
        let dateStr = new Date().toISOString().split('T')[0];
        if (input.includes('yesterday')) {
            let d = new Date(); d.setDate(d.getDate() - 1);
            dateStr = d.toISOString().split('T')[0];
        } else if (input.match(/(\d+) days ago/)) {
            let days = Number(input.match(/(\d+) days ago/)[1]);
            let d = new Date(); d.setDate(d.getDate() - days);
            dateStr = d.toISOString().split('T')[0];
        }
        
        const newEntry = {
            id: Date.now().toString(),
            date: dateStr,
            amount: amount,
            category: '💵 Pocket Money',
            notes: input,
            source: 'pocketcal'
        };

        if(checkForPcAnomaly(amount, dateStr)) {
            window.pendingPcAnomalyEntry = newEntry;
            document.getElementById('pcAnomalyModal').classList.add('active');
            return;
        }

        let existing = data.find(d => d.date === dateStr);
        data = data.filter(d => d.date !== dateStr);
        data.push(newEntry);
        saveData('fin_pocketcal', data);

        syncPocketToSpendly(newEntry, existing);

        document.getElementById('pcSmartEntryInput').value = '';
        renderCalendar();
        showSnackbar(`Smart logged ₹${amount} for ${dateStr}! ⚡`);
    };

    window.generatePcAIReport = function() {
        const container = document.getElementById('pcAiReportContainer');
        const textEl = document.getElementById('pcAiReportText');
        
        container.classList.remove('hidden');
        textEl.innerHTML = '<i class="lucide lucide-loader animate-spin w-5 h-5 inline-block mr-2"></i> Generating insights...';
        
        setTimeout(() => {
            const currentM = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
            const prevM = `${current.getMonth()===0?current.getFullYear()-1:current.getFullYear()}-${String(current.getMonth()===0?12:current.getMonth()).padStart(2, '0')}`;
            
            const curTotal = data.filter(d => d.date && d.date.startsWith(currentM)).reduce((s, d) => s + Number(d.amount), 0);
            const prevTotal = data.filter(d => d.date && d.date.startsWith(prevM)).reduce((s, d) => s + Number(d.amount), 0);
            
            let message = "";
            if(curTotal === 0 && prevTotal === 0) {
                message = "You don't have enough allowance data for an insight yet. Keep tracking handouts from parents!";
            } else if(curTotal > prevTotal && prevTotal > 0) {
                const diff = ((curTotal - prevTotal)/prevTotal*100).toFixed(0);
                message = `<strong>Allowance increased!</strong> You took ₹${curTotal} from parents this month, which is ${diff}% higher than last month's ₹${prevTotal}. Spend responsibly!`;
            } else if(curTotal < prevTotal && prevTotal > 0) {
                const diff = ((prevTotal - curTotal)/prevTotal*100).toFixed(0);
                message = `Your allowance took this month is ₹${curTotal}, which is ${diff}% lower than last month's ₹${prevTotal}. Excellent! You're depending less on handouts.`;
            } else {
                message = `You've taken ₹${curTotal} this month in allowance. Try to budget it wisely.`;
            }
            
            textEl.innerHTML = message;
        }, 1200);
    };

    // ----------------------------------------------------
    // CONTROLS
    // ----------------------------------------------------
    document.getElementById('prevMonth').addEventListener('click', () => {
        current.setMonth(current.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        current.setMonth(current.getMonth() + 1);
        renderCalendar();
    });

    document.getElementById('pcMonthFilter')?.addEventListener('change', (e) => {
        const val = e.target.value;
        if (!val) return;
        const [y, m] = val.split('-');
        current = new Date(Number(y), Number(m) - 1, 1);
        renderCalendar();
    });

    function populatePocketMonthFilter() {
        const sel = document.getElementById('pcMonthFilter');
        if(!sel) return;
        const currentVal = sel.value;
        const months = new Set();
        data.forEach(d => months.add(d.date.slice(0, 7)));
        const now = new Date();
        months.add(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
        
        let html = '<option value="">Jump to Month...</option>';
        [...months].sort().reverse().forEach(m => {
            html += `<option value="${m}">${m}</option>`;
        });
        sel.innerHTML = html;
        if([...months].includes(currentVal)) sel.value = currentVal;
    }

    document.getElementById('btnAddToday').addEventListener('click', () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const entry = data.find(d => d.date === todayStr);
        openEntryModal(todayStr, entry);
    });

    // ----------------------------------------------------
    // CHARTS
    // ----------------------------------------------------
    function renderCharts() {
        if (!window.Chart) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#f8fafc' : '#0f172a';
        
        Object.values(charts).forEach(c => c && c.destroy && c.destroy());
        charts = {};
        Chart.defaults.color = textColor;
        Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
        Chart.defaults.animation = {
            duration: 2000,
            easing: 'easeOutQuart'
        };

        const year = current.getFullYear();
        const month = current.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const labels = [], values = [];

        for (let i = 1; i <= daysInMonth; i++) {
            const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const entry = data.find(d => d.date === ds);
            labels.push(i);
            values.push(entry ? Number(entry.amount) : 0);
        }

        const ctx1 = document.getElementById('pcChart');
        if (ctx1) {
            charts.daily = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Daily Amount',
                        data: values,
                        backgroundColor: '#10b981',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { display: false },
                        x: { display: false }
                    }
                }
            });
        }

        const ctxT = document.getElementById('trendChart');
        if (ctxT) {
            const months = [], monthTotals = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                
                const monthTotal = data.filter(entry => entry.date && entry.date.startsWith(monthStr))
                    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
                
                months.push(d.toLocaleString('en-US', { month: 'short' }));
                monthTotals.push(monthTotal);
            }

            charts.trend = new Chart(ctxT, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Trend',
                        data: monthTotals,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { display: false },
                        x: { display: true, grid: { display: false } }
                    }
                }
            });
        }

        const ctxW = document.getElementById('weekdayChart');
        if (ctxW) {
            const weekdayTotals = [0,0,0,0,0,0,0]; // Sun..Sat
            data.forEach(d => {
                if(d.date && Number(d.amount) > 0) {
                    let dateObj = new Date(d.date);
                    weekdayTotals[dateObj.getDay()] += Number(d.amount);
                }
            });

            charts.weekday = new Chart(ctxW, {
                type: 'polarArea',
                data: {
                    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    datasets: [{
                        label: 'Weekday Amount',
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
                        r: {
                            ticks: { display: false },
                            grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                        }
                    }
                }
            });
        }

        const ctxC = document.getElementById('comparisonChart');
        if (ctxC) {
            const thisMonth = [], prevMonth = [];
            const prevMonthDate = new Date(year, month - 1, 1);
            const prevYear = prevMonthDate.getFullYear();
            const prevM = prevMonthDate.getMonth();
            const daysInPrevMonth = new Date(prevYear, prevM + 1, 0).getDate();
            
            const maxDays = Math.max(daysInMonth, daysInPrevMonth);
            const compLabels = [];
            
            for (let i = 1; i <= maxDays; i++) {
                compLabels.push(i);
                
                // Current Month
                if (i <= daysInMonth) {
                    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                    const entry = data.find(d => d.date === ds);
                    thisMonth.push(entry ? Number(entry.amount) : 0);
                } else {
                    thisMonth.push(0);
                }
                
                // Previous Month
                if (i <= daysInPrevMonth) {
                    const dsPrev = `${prevYear}-${String(prevM + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                    const entryPrev = data.find(d => d.date === dsPrev);
                    prevMonth.push(entryPrev ? Number(entryPrev.amount) : 0);
                } else {
                    prevMonth.push(0);
                }
            }

            charts.comp = new Chart(ctxC, {
                type: 'bar',
                data: {
                    labels: compLabels,
                    datasets: [
                        {
                            label: 'This Month',
                            data: thisMonth,
                            backgroundColor: '#10b981',
                            borderRadius: 4
                        },
                        {
                            label: 'Last Month',
                            data: prevMonth,
                            backgroundColor: isDark ? '#334155' : '#cbd5e1',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: true, labels: { color: textColor } } },
                    scales: {
                        y: { display: false },
                        x: { display: true, grid: { display: false } }
                    }
                }
            });
        }

        const ctxCum = document.getElementById('cumulativeChart');
        if (ctxCum) {
            const cumLabels = [], cumValues = [];
            let runningTotal = 0;
            
            for (let i = 1; i <= daysInMonth; i++) {
                cumLabels.push(i);
                const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                const entry = data.find(d => d.date === ds);
                if (entry) runningTotal += Number(entry.amount);
                cumValues.push(runningTotal);
            }

            charts.cumulative = new Chart(ctxCum, {
                type: 'line',
                data: {
                    labels: cumLabels,
                    datasets: [{
                        label: 'Cumulative Allowance',
                        data: cumValues,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
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
                    },
                    animation: { delay: 400 }
                }
            });
        }

        const ctxSource = document.getElementById('sourceChart');
        if (ctxSource) {
            const sourceTotals = { Dad: 0, Mom: 0, Other: 0 };
            data.forEach(d => {
                if (d.category) {
                    if (d.category.includes('Dad')) {
                        sourceTotals.Dad += Number(d.amount || 0);
                    } else if (d.category.includes('Mom')) {
                        sourceTotals.Mom += Number(d.amount || 0);
                    } else {
                        sourceTotals.Other += Number(d.amount || 0);
                    }
                }
            });

            charts.sourceShare = new Chart(ctxSource, {
                type: 'doughnut',
                data: {
                    labels: ['Dad', 'Mom', 'Other'],
                    datasets: [{
                        data: [sourceTotals.Dad, sourceTotals.Mom, sourceTotals.Other],
                        backgroundColor: ['#3b82f6', '#ec4899', '#8b5cf6'],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'bottom', labels: { color: textColor } } },
                    cutout: '70%',
                    animation: { delay: 600 }
                }
            });
        }

        const ctxAllowVsSpend = document.getElementById('allowanceVsSpendChart');
        if (ctxAllowVsSpend) {
            const months = [], allowanceTotals = [], spendingTotals = [];
            const spendlyData = loadData('fin_spendly') || [];
            
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                
                const mAllowance = data.filter(entry => entry.date && entry.date.startsWith(monthStr))
                    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
                
                const mSpend = spendlyData.filter(entry => entry.type === 'expense' && entry.date && entry.date.startsWith(monthStr))
                    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
                
                months.push(d.toLocaleString('en-US', { month: 'short' }));
                allowanceTotals.push(mAllowance);
                spendingTotals.push(mSpend);
            }

            charts.allowVsSpend = new Chart(ctxAllowVsSpend, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [
                        {
                            label: 'Allowance Taken',
                            data: allowanceTotals,
                            backgroundColor: '#3b82f6',
                            borderRadius: 4
                        },
                        {
                            label: 'Spendly Expenses',
                            data: spendingTotals,
                            backgroundColor: '#ef4444',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: true, labels: { color: textColor } } },
                    scales: {
                        y: { display: false },
                        x: { display: true, grid: { display: false } }
                    },
                    animation: { delay: 800 }
                }
            });
        }
    }

    // ----------------------------------------------------
    // PDF MODAL EXPORT
    // ----------------------------------------------------
    window.openPDFModal = function() {
        document.getElementById('pdfModal').classList.add('active');
    };
    
    window.closeModal = function(id) {
        document.querySelector(id).classList.remove('active');
    };

    // Strip leading emoji from strings for PDF (Helvetica doesn't render Unicode emoji)
    function pcEmojiStrip(str) {
        if (!str) return '';
        return str.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/u, '').trim();
    }

    window.exportPDF = function(period) {
        if (!window.jspdf) { showSnackbar('PDF library not ready', 'error'); return; }

        try {
            const now = new Date();
            const tzOff = now.getTimezoneOffset() * 60000;
            const todayStr = (new Date(Date.now() - tzOff)).toISOString().split('T')[0];
            const printDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

            // Determine period label & filter rows from full running-balance calculation
            let periodLabel = '';
            const sortedAll = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
            let runBal = 0;
            let totalCr = 0;

            const allPassbook = sortedAll.map((d, idx) => {
                const amt = Number(d.amount || 0);
                runBal  += amt;
                totalCr += amt;
                // Strip emoji for PDF-safe text, preserve notes on new line
                const catClean  = pcEmojiStrip(d.category || '\uD83D\uDCB5 Pocket Money');
                const noteClean = d.notes && d.notes.trim() ? d.notes.trim() : '';
                const rawDesc   = noteClean ? catClean + '\n' + noteClean : catClean;
                return {
                    globalIdx: idx,
                    date: d.date,
                    desc: rawDesc,
                    cr:   amt.toFixed(2),
                    bal:  runBal.toFixed(2)
                };
            });

            let exportRows;
            if (period === 'month') {
                const ms = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                exportRows  = allPassbook.filter(r => r.date.startsWith(ms));
                periodLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
                // recalc totals for filtered period
                totalCr = exportRows.reduce((s, r) => s + Number(r.cr), 0);
                runBal  = exportRows.length ? Number(exportRows[exportRows.length - 1].bal) : 0;
            } else if (period === 'year') {
                const ys = now.getFullYear().toString();
                exportRows  = allPassbook.filter(r => r.date.startsWith(ys));
                periodLabel = ys;
                totalCr = exportRows.reduce((s, r) => s + Number(r.cr), 0);
                runBal  = exportRows.length ? Number(exportRows[exportRows.length - 1].bal) : 0;
            } else {
                exportRows  = allPassbook;
                periodLabel = 'All Time History';
            }

            if (exportRows.length === 0) {
                showSnackbar('No data found for this period', 'warning');
                return;
            }

            // Re-index serial numbers for the visible slice
            const passbookRows = exportRows.map((r, i) => ({ ...r, sno: String(i + 1) }));

            // ── PDF setup ────────────────────────────────────────────────
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'pt', 'a4');
            const PW  = doc.internal.pageSize.getWidth();
            const PH  = doc.internal.pageSize.getHeight();

            // Colour palette — HDFC-style
            const NAVY  = [0,   44,  95];
            const GOLD  = [201, 153,  49];
            const WHITE = [255, 255, 255];
            const LGREY = [245, 246, 248];
            const DGREY = [80,  80,  80];
            const GREEN = [0,  130,  80];
            const RED   = [200, 30,   30];

            const fillRect = (x, y, w, h, rgb) => {
                doc.setFillColor(...rgb);
                doc.rect(x, y, w, h, 'F');
            };
            const txt = (text, x, y, opts = {}) => {
                doc.setFont(opts.font || 'helvetica', opts.style || 'normal');
                doc.setFontSize(opts.size || 10);
                doc.setTextColor(...(opts.color || DGREY));
                doc.text(String(text), x, y, { align: opts.align || 'left', maxWidth: opts.maxW });
            };

            // ── Header band ──────────────────────────────────────────────
            fillRect(0, 0, PW, 110, NAVY);
            txt('MoneyFlow', 36, 44, { style: 'bold', size: 22, color: WHITE });
            txt('PocketCal — Daily Pocket Money Tracker', 36, 62, { size: 9.5, color: GOLD });
            txt('POCKET MONEY PASSBOOK', PW - 36, 44, { style: 'bold', size: 13, color: WHITE, align: 'right' });
            txt('Statement of Account', PW - 36, 62, { size: 9, color: GOLD, align: 'right' });
            fillRect(0, 110, PW, 4, GOLD);

            // ── Account info box ─────────────────────────────────────────
            fillRect(36, 126, PW - 72, 90, LGREY);
            doc.setDrawColor(...GOLD);
            doc.setLineWidth(0.8);
            doc.rect(36, 126, PW - 72, 90);

            const userName   = localStorage.getItem('fin_userName') || 'Account Holder';
            const userGender = localStorage.getItem('userGender')   || '';
            const userLoc    = localStorage.getItem('userLocation')  || 'India';
            // Stable account number from username hash
            const acSeed     = [...userName].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
            const acNo       = 'PC-' + String(Math.abs(acSeed) % 100000000).padStart(8, '0');

            txt('Account Holder :',  48, 148, { style: 'bold', size: 9, color: NAVY });
            txt(userName,            170, 148, { style: 'bold', size: 9, color: [20,20,20] });
            txt('Account No. :',     48, 165, { style: 'bold', size: 9, color: NAVY });
            txt(acNo,                170, 165, { size: 9, color: [20,20,20] });
            txt('Location :',        48, 182, { style: 'bold', size: 9, color: NAVY });
            txt(userLoc + (userGender ? '  |  ' + userGender : ''), 170, 182, { size: 9, color: [20,20,20] });

            txt('Statement Period :', PW / 2 + 10, 148, { style: 'bold', size: 9, color: NAVY });
            txt(periodLabel,          PW / 2 + 130, 148, { size: 9, color: [20,20,20] });
            txt('Print Date :',       PW / 2 + 10, 165, { style: 'bold', size: 9, color: NAVY });
            txt(printDate,            PW / 2 + 130, 165, { size: 9, color: [20,20,20] });
            txt('Total Entries :',    PW / 2 + 10, 182, { style: 'bold', size: 9, color: NAVY });
            txt(String(passbookRows.length), PW / 2 + 130, 182, { size: 9, color: [20,20,20] });

            // ── Passbook table ───────────────────────────────────────────
            const tableBody = passbookRows.map(r => [
                r.sno,
                r.date,
                r.desc,
                '',   // No Debit in PocketCal
                '₹ ' + Number(r.cr).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                '₹ ' + Number(r.bal).toLocaleString('en-IN', { minimumFractionDigits: 2 })
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
                    cellPadding: { top: 6, bottom: 6, left: 5, right: 5 },
                    lineColor: GOLD,
                    lineWidth: 0.4
                },
                bodyStyles: {
                    fontSize: 8,
                    cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
                    lineColor: [210, 215, 220],
                    lineWidth: 0.3,
                    valign: 'middle'
                },
                alternateRowStyles: { fillColor: [250, 251, 253] },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 22, textColor: DGREY },
                    1: { halign: 'center', cellWidth: 62, textColor: [40,40,40] },
                    2: { halign: 'left',   cellWidth: 'auto', textColor: [30,30,30] },
                    3: { halign: 'right',  cellWidth: 65, textColor: [180,180,180] },
                    4: { halign: 'right',  cellWidth: 70 },
                    5: { halign: 'right',  cellWidth: 78, fontStyle: 'bold' }
                },
                didParseCell: function(hookData) {
                    if (hookData.section !== 'body') return;
                    // Credit — green
                    if (hookData.column.index === 4) hookData.cell.styles.textColor = GREEN;
                    // Balance — navy
                    if (hookData.column.index === 5) {
                        hookData.cell.styles.textColor = NAVY;
                        hookData.cell.styles.fontStyle = 'bold';
                    }
                },
                willDrawCell: function(hookData) {
                    if (hookData.section === 'body' && hookData.column.index === 0) {
                        // Green left accent stripe (all credits in PocketCal)
                        doc.setFillColor(...GREEN);
                        doc.rect(hookData.cell.x, hookData.cell.y, 2.5, hookData.cell.height, 'F');
                    }
                }
            });

            // ── Summary band ─────────────────────────────────────────────
            const finalY = doc.lastAutoTable.finalY + 18;
            if (finalY + 70 < PH - 40) {
                fillRect(36, finalY, PW - 72, 58, [240, 244, 250]);
                doc.setDrawColor(...NAVY);
                doc.setLineWidth(0.5);
                doc.rect(36, finalY, PW - 72, 58);

                txt('STATEMENT SUMMARY', 48, finalY + 16, { style: 'bold', size: 8.5, color: NAVY });

                const col2 = PW / 3;
                const col3 = (PW / 3) * 2;

                txt('Total Pocket Money',   48,   finalY + 33, { size: 8, color: DGREY });
                txt('Total Debit',          col2, finalY + 33, { size: 8, color: DGREY });
                txt('Closing Balance',      col3, finalY + 33, { size: 8, color: DGREY });

                txt('₹ ' + totalCr.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    48,   finalY + 49, { style: 'bold', size: 9.5, color: GREEN });
                txt('₹ 0.00', col2, finalY + 49, { style: 'bold', size: 9.5, color: DGREY });
                txt('₹ ' + Math.abs(runBal).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    col3, finalY + 49, { style: 'bold', size: 9.5, color: NAVY });
            }

            // ── Page footer ──────────────────────────────────────────────
            const totalPages = doc.internal.getNumberOfPages();
            for (let pg = 1; pg <= totalPages; pg++) {
                doc.setPage(pg);
                fillRect(0, PH - 28, PW, 28, NAVY);
                txt('MoneyFlow PocketCal  •  This is a computer-generated statement.',
                    PW / 2, PH - 14, { size: 7.5, color: [180, 200, 220], align: 'center' });
                txt(`Page ${pg} of ${totalPages}`,
                    PW - 36, PH - 14, { size: 7.5, color: GOLD, align: 'right' });
            }

            // ── Save ─────────────────────────────────────────────────────
            const safeLabel = periodLabel.replace(/\s+/g, '_');
            doc.save(`PocketCal_Passbook_${safeLabel}_${todayStr}.pdf`);
            closeModal('#pdfModal');
            showSnackbar('Calendar Report Downloaded! 🗓️');

        } catch (err) {
            console.error('PocketCal PDF error:', err);
            showSnackbar('PDF Generation Failed: ' + err.message, 'error');
        }
    };

    // ----------------------------------------------------
    // ALLOWANCE RUNOUT FORECAST
    // ----------------------------------------------------
    function updateForecast() {
        const currentMonthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const curMonthAllowance = data.filter(d => d.date && d.date.startsWith(currentMonthStr))
                                      .reduce((sum, d) => sum + Number(d.amount || 0), 0);
        
        const spendlyData = loadData('fin_spendly') || [];
        const curMonthExpenses = spendlyData.filter(d => d.type === 'expense' && d.date && d.date.startsWith(currentMonthStr))
                                           .reduce((sum, d) => sum + Number(d.amount || 0), 0);
        
        const today = new Date();
        let daysPassed = today.getDate();
        const isCurrentMonth = (current.getFullYear() === today.getFullYear() && current.getMonth() === today.getMonth());
        
        if (!isCurrentMonth) {
            daysPassed = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
        }
        
        const burnRate = curMonthExpenses / (daysPassed || 1);
        const remaining = curMonthAllowance - curMonthExpenses;
        
        const burnRateEl = document.getElementById('pcForecastBurnRate');
        const remainingEl = document.getElementById('pcForecastRemaining');
        const daysEl = document.getElementById('pcForecastDays');
        const badgeEl = document.getElementById('pcForecastAlertBadge');
        const askDateEl = document.getElementById('pcForecastAskDate');
        
        if (burnRateEl) burnRateEl.textContent = `₹${burnRate.toFixed(0)}/day`;
        if (remainingEl) {
            remainingEl.textContent = `₹${remaining.toFixed(0)}`;
            remainingEl.className = remaining >= 0 ? 'font-bold text-emerald-400' : 'font-bold text-red-500';
        }
        
        let daysRemaining = Infinity;
        if (burnRate > 0) {
            daysRemaining = remaining / burnRate;
        }
        
        if (daysEl) {
            if (remaining <= 0) {
                daysEl.textContent = '0';
                daysEl.className = 'text-4xl font-extrabold text-red-500 tracking-tight';
            } else if (daysRemaining === Infinity) {
                daysEl.textContent = '∞';
                daysEl.className = 'text-4xl font-extrabold text-emerald-400 tracking-tight';
            } else {
                daysEl.textContent = Math.max(0, Math.floor(daysRemaining));
                daysEl.className = daysRemaining < 5 ? 'text-4xl font-extrabold text-amber-500 tracking-tight' : 'text-4xl font-extrabold text-blue-400 tracking-tight';
            }
        }
        
        if (badgeEl && askDateEl) {
            if (remaining <= 0) {
                badgeEl.textContent = 'RUN OUT 🚨';
                badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 bg-red-500/20 text-red-400 border border-red-500/30';
                askDateEl.textContent = 'Ask Dad Today!';
            } else if (burnRate === 0) {
                badgeEl.textContent = 'STABLE 🛡️';
                badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                askDateEl.textContent = 'No expenses logged';
            } else {
                const predictAsk = new Date();
                predictAsk.setDate(today.getDate() + Math.max(0, Math.floor(daysRemaining)));
                const opt = { day: '2-digit', month: 'short', year: 'numeric' };
                askDateEl.textContent = predictAsk.toLocaleDateString('en-IN', opt);
                
                if (daysRemaining < 5) {
                    badgeEl.textContent = 'WARN ⚠️';
                    badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 bg-amber-500/20 text-amber-400 border border-amber-500/30';
                } else {
                    badgeEl.textContent = 'GOOD ✅';
                    badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                }
            }
        }
        
        updateLimitUI(curMonthAllowance);
    }

    function updateLimitUI(currentAllowance) {
        const limitVal = Number(localStorage.getItem('fin_pocketcal_limit') || 5000);
        const limitTargetEl = document.getElementById('pcLimitTarget');
        const limitCurrentEl = document.getElementById('pcLimitCurrent');
        const limitProgressEl = document.getElementById('pcLimitProgress');
        const limitMsgEl = document.getElementById('pcLimitStatusMsg');
        
        if (limitTargetEl) limitTargetEl.textContent = `₹${limitVal.toLocaleString('en-IN')}`;
        if (limitCurrentEl) limitCurrentEl.textContent = `₹${currentAllowance.toLocaleString('en-IN')}`;
        
        if (limitProgressEl) {
            const pct = Math.min(100, (currentAllowance / (limitVal || 1)) * 100);
            limitProgressEl.style.width = `${pct}%`;
            if (pct >= 100) {
                limitProgressEl.className = 'bg-gradient-to-r from-red-500 to-orange-600 h-full rounded-full transition-all duration-1000';
            } else if (pct >= 80) {
                limitProgressEl.className = 'bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-1000';
            } else {
                limitProgressEl.className = 'bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000';
            }
        }
        
        if (limitMsgEl) {
            if (currentAllowance > limitVal) {
                limitMsgEl.textContent = '🚨 Exceeded monthly limit! Cut back on requests.';
                limitMsgEl.className = 'text-[11px] text-red-400 font-semibold leading-tight';
            } else {
                const diff = limitVal - currentAllowance;
                limitMsgEl.textContent = `₹${diff.toLocaleString('en-IN')} remaining before limit cap.`;
                limitMsgEl.className = 'text-[11px] text-muted leading-tight';
            }
        }
    }

    window.setPcAllowanceLimit = function() {
        const limitVal = localStorage.getItem('fin_pocketcal_limit') || 5000;
        document.getElementById('pcLimitInput').value = limitVal;
        document.getElementById('limitModal').classList.add('active');
    };

    window.closeLimitModal = function() {
        document.getElementById('limitModal').classList.remove('active');
    };

    document.getElementById('pcLimitForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const newLimit = Number(document.getElementById('pcLimitInput').value);
        localStorage.setItem('fin_pocketcal_limit', newLimit);
        closeLimitModal();
        renderCalendar();
        showSnackbar('Monthly allowance limit updated! ⚙️');
    });

    // ----------------------------------------------------
    // ASK DAD REQUEST TRACKER
    // ----------------------------------------------------
    window.openRequestModal = function() {
        document.getElementById('pcReqAmount').value = '';
        document.getElementById('pcReqNotes').value = '';
        document.getElementById('pcReqSource').value = 'Dad';
        document.getElementById('requestModal').classList.add('active');
    };

    window.closeRequestModal = function() {
        document.getElementById('requestModal').classList.remove('active');
    };

    document.getElementById('pcRequestForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const amt = Number(document.getElementById('pcReqAmount').value);
        const src = document.getElementById('pcReqSource').value;
        const notes = document.getElementById('pcReqNotes').value;
        
        const newReq = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            amount: amt,
            source: src,
            notes: notes,
            status: 'Pending'
        };
        
        requests.push(newReq);
        saveData('fin_pocketcal_requests', requests);
        renderRequests();
        closeRequestModal();
        showSnackbar('Allowance request logged! 💸');
    });

    window.markRequestReceived = function(id) {
        const req = requests.find(r => r.id === id);
        if (!req) return;
        
        req.status = 'Received';
        saveData('fin_pocketcal_requests', requests);
        
        const emojiSource = req.source === 'Dad' ? '👨 Taken from Dad' : (req.source === 'Mom' ? '👩 Taken from Mom' : '🎁 Gift / Cash Gift');
        const newEntry = {
            id: req.id,
            date: new Date().toISOString().split('T')[0],
            amount: req.amount,
            category: emojiSource,
            notes: req.notes ? `Request: ${req.notes}` : `Allowance from ${req.source}`,
            source: 'pocketcal'
        };
        
        data.push(newEntry);
        saveData('fin_pocketcal', data);
        
        syncPocketToSpendly(newEntry, null);
        
        renderCalendar();
        renderRequests();
        showSnackbar('Allowance received & logged! 💳');
    };

    window.markRequestRejected = function(id) {
        const req = requests.find(r => r.id === id);
        if (!req) return;
        
        req.status = 'Rejected';
        saveData('fin_pocketcal_requests', requests);
        renderRequests();
        showSnackbar('Request marked as rejected 🛑');
    };

    window.deleteRequest = function(id) {
        window.showConfirmModal(
            'Delete Request?',
            'Are you sure you want to delete this request from history?',
            'Delete',
            () => {
                requests = requests.filter(r => r.id !== id);
                saveData('fin_pocketcal_requests', requests);
                renderRequests();
                showSnackbar('Request deleted! 🗑️');
            }
        );
    };

    window.renderRequests = function() {
        const pendingList = document.getElementById('pcPendingRequestsList');
        const historyList = document.getElementById('pcRequestHistoryList');
        const pendingCount = document.getElementById('pcPendingRequestsCount');
        
        if (!pendingList || !historyList) return;
        pendingList.innerHTML = '';
        historyList.innerHTML = '';
        
        const pendings = requests.filter(r => r.status === 'Pending').sort((a,b) => new Date(b.date) - new Date(a.date));
        const histories = requests.filter(r => r.status !== 'Pending').sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
        
        if (pendingCount) pendingCount.textContent = pendings.length;
        
        if (pendings.length === 0) {
            pendingList.innerHTML = '<div class="text-xs text-muted text-center py-8">No pending requests. Ask away!</div>';
        } else {
            pendings.forEach(r => {
                const card = document.createElement('div');
                card.className = 'glass-panel p-4 flex items-center justify-between border-white/5 bg-white/5 relative overflow-hidden group';
                card.innerHTML = `
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">Ask ${r.source}</span>
                            <span class="text-[10px] text-muted">${r.date}</span>
                        </div>
                        <h4 class="text-lg font-black text-white">₹${r.amount.toLocaleString('en-IN')}</h4>
                        <p class="text-xs text-slate-300 mt-1">${r.notes || 'No description'}</p>
                    </div>
                    <div class="flex items-center gap-2 relative z-10">
                        <button onclick="markRequestReceived('${r.id}')" class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition active:scale-90" title="Mark Received">
                            <i class="lucide lucide-check w-4 h-4"></i>
                        </button>
                        <button onclick="markRequestRejected('${r.id}')" class="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition active:scale-90" title="Mark Rejected">
                            <i class="lucide lucide-x w-4 h-4"></i>
                        </button>
                    </div>
                `;
                pendingList.appendChild(card);
            });
        }
        
        if (histories.length === 0) {
            historyList.innerHTML = '<div class="text-xs text-muted text-center py-8">No past request history.</div>';
        } else {
            histories.forEach(r => {
                const isRec = r.status === 'Received';
                const statusBadge = isRec 
                    ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Received</span>`
                    : `<span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>`;
                
                const card = document.createElement('div');
                card.className = 'glass-panel p-3 flex items-center justify-between border-white/5 bg-white/5 opacity-70 hover:opacity-100 transition';
                card.innerHTML = `
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-[10px] text-muted">${r.date} • ${r.source}</span>
                            ${statusBadge}
                        </div>
                        <h4 class="text-md font-bold text-white">₹${r.amount.toLocaleString('en-IN')}</h4>
                        <p class="text-xs text-slate-400">${r.notes || ''}</p>
                    </div>
                    <button onclick="deleteRequest('${r.id}')" class="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-muted hover:text-red-500 flex items-center justify-center transition" title="Delete History">
                        <i class="lucide lucide-trash-2 w-3.5 h-3.5"></i>
                    </button>
                `;
                historyList.appendChild(card);
            });
        }
        if (window.lucide) lucide.createIcons();
    };

    // ----------------------------------------------------
    // JSON & CSV PORTING
    // ----------------------------------------------------
    window.exportPcBackup = function() {
        const fullBackup = {
            pocketcal: loadData('fin_pocketcal') || [],
            requests: loadData('fin_pocketcal_requests') || [],
            limit: localStorage.getItem('fin_pocketcal_limit') || '5000'
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", `MoneyFlow_PocketCal_Backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        showSnackbar('JSON Backup Downloaded! 📁');
    };

    window.importPcBackup = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const parsed = JSON.parse(e.target.result);
                if (parsed.pocketcal && Array.isArray(parsed.pocketcal)) {
                    saveData('fin_pocketcal', parsed.pocketcal);
                    data = parsed.pocketcal;
                }
                if (parsed.requests && Array.isArray(parsed.requests)) {
                    saveData('fin_pocketcal_requests', parsed.requests);
                    requests = parsed.requests;
                }
                if (parsed.limit) {
                    localStorage.setItem('fin_pocketcal_limit', parsed.limit);
                }
                renderCalendar();
                renderRequests();
                showSnackbar('Data restored successfully! 🔄');
            } catch (err) {
                showSnackbar('Failed to parse file. Invalid JSON.', 'error');
            }
        };
        reader.readAsText(file);
    };

    window.exportPcCSV = function() {
        const sorted = [...data].sort((a,b) => new Date(a.date) - new Date(b.date));
        let csvContent = "data:text/csv;charset=utf-8,ID,Date,Amount,Source,Notes\n";
        sorted.forEach(row => {
            const notesEscaped = (row.notes || '').replace(/"/g, '""');
            csvContent += `"${row.id}","${row.date}",${row.amount},"${row.category}","${notesEscaped}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `PocketCal_Allowance_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showSnackbar('CSV Exporter success! 📊');
    };

    // ----------------------------------------------------
    // INIT
    // ----------------------------------------------------
    window.addEventListener('DOMContentLoaded', () => {
        renderCalendar();
        renderRequests();
        document.addEventListener('themeChanged', renderCharts);

        // Load Custom Categories
        const pcCatSelect = document.getElementById('pcCategory');
        if (pcCatSelect) {
            const fullCategoryMap = window.loadData('fin_full_category_map');
            const existingVals = Array.from(pcCatSelect.options).map(o => o.value);
            if (fullCategoryMap && fullCategoryMap.incomeList && fullCategoryMap.incomeList.length > 0) {
                fullCategoryMap.incomeList.forEach(cat => {
                    if (!existingVals.includes(cat)) {
                        const opt = document.createElement('option');
                        opt.value = cat;
                        opt.textContent = cat;
                        pcCatSelect.appendChild(opt);
                    }
                });
            }
        }
    });

})();
