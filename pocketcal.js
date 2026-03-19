/* ========================================================================
   MONEYFLOW - POCKETCAL.JS
   Calendar Generation, Sync with `fin_pocketcal`, PDF Passbook Extractor
======================================================================== */

(function() {
    'use strict';

    let data = loadData('fin_pocketcal') || [];
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
        
        document.getElementById('pcDelete').style.display = entry ? 'block' : 'none';
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
    document.getElementById('pcForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const date = document.getElementById('pcDate').value;
        const amount = Number(document.getElementById('pcAmount').value);
        const notes = document.getElementById('pcNotes').value;
        const category = document.getElementById('pcCategory').value;
        
        // Remove old from pocketcal
        let existing = data.find(d => d.date === date);
        data = data.filter(d => d.date !== date);
        
        const newEntry = {
            id: existing ? existing.id : Date.now().toString(),
            date: date,
            amount: amount,
            category: category,
            notes: notes,
            source: 'pocketcal'
        };
        data.push(newEntry);
        saveData('fin_pocketcal', data);

        // 2-WAY SYNC TO SPENDLY
        syncPocketToSpendly(newEntry, existing);

        renderCalendar();
        closeEntryModal();
        showSnackbar('Entry saved! 💾');
    });

    document.getElementById('pcDelete').addEventListener('click', () => {
        if(!confirm('Delete this entry?')) return;
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
                        label: 'Cumulative Savings',
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
                    }
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

    window.exportPDF = function(period) {
        if (!window.jspdf) { showSnackbar('PDF library not ready', 'error'); return; }
        
        let filteredData = [];
        const now = new Date();
        let periodLabel = '';

        if (period === 'month') {
            const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            filteredData = data.filter(d => d.date.startsWith(monthStr));
            periodLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        } else if (period === 'year') {
            const yearStr = now.getFullYear().toString();
            filteredData = data.filter(d => d.date.startsWith(yearStr));
            periodLabel = yearStr;
        } else {
            filteredData = [...data];
            periodLabel = 'All Time History';
        }

        // Passbook Calculation
        const sortedAsc = [...data].sort((a,b)=> new Date(a.date) - new Date(b.date));
        let runningBal = 0;
        const passbookData = sortedAsc.map(d => {
            runningBal += Number(d.amount); // PocketCal only tracks Income
            return {
                date: d.date,
                desc: d.category + (d.notes ? `\n${d.notes}` : ''),
                dr: '-', // No expenses in PocketCal natively
                cr: d.amount,
                bal: runningBal
            };
        });

        let exportRows = passbookData;
        if(period === 'month') {
            const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            exportRows = passbookData.filter(d => d.date.startsWith(monthStr));
        } else if (period === 'year') {
            const yearStr = now.getFullYear().toString();
            exportRows = passbookData.filter(d => d.date.startsWith(yearStr));
        }

        if (exportRows.length === 0) {
            showSnackbar('No data found for this period', 'warning');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, pageWidth, 5000, 'F');
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageWidth, 120, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.text("PocketCal Passbook", pageWidth / 2, 60, { align: "center" });
        doc.setFontSize(14);
        doc.text(`Period: ${periodLabel}`, pageWidth / 2, 85, { align: "center" });

        const tableRows = exportRows.map(r => [
            r.date, r.desc, r.dr, r.cr, r.bal.toFixed(2)
        ]);

        doc.autoTable({
            startY: 140,
            head: [['Date', 'Description', 'Debit (Dr)', 'Credit (Cr)', 'Balance (₹)']],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] },
            styles: { font: 'helvetica', fontSize: 10 },
            didParseCell: function(data) {
                if (data.section === 'body') {
                    if (data.column.index === 3 && data.cell.raw !== '-') data.cell.styles.textColor = [16, 185, 129];
                    if (data.column.index === 4) data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        doc.save(`PocketCal_${periodLabel.replace(' ','_')}.pdf`);
        closeModal('#pdfModal');
        showSnackbar('Calendar Report Downloaded! 🗓️');
    };

    // ----------------------------------------------------
    // INIT
    // ----------------------------------------------------
    window.addEventListener('DOMContentLoaded', () => {
        renderCalendar();
        document.addEventListener('themeChanged', renderCharts);
    });

})();
