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
    // INIT
    // ----------------------------------------------------
    window.addEventListener('DOMContentLoaded', () => {
        renderCalendar();
        document.addEventListener('themeChanged', renderCharts);
    });

})();
