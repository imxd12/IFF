/* =========================
   POCKETCAL - COMPLETE LOGIC
   Calendar Money Tracker with Advanced Analytics & PDF Export
========================= */

// Initialize global functions
startClock('#timeNow');

(function() {
  'use strict';

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  let data = loadData('fin_pocketcal') || [];
  let current = new Date();
  current.setDate(1); // Set to first day of month
  let selectedDate = null;
  let charts = {};

  // ========================================
  // RENDER CALENDAR
  // ========================================
  function renderCalendar() {
    try {
      const grid = $('#calendarGrid');
      if (!grid) return;
      
      grid.innerHTML = '';
      
      const year = current.getFullYear();
      const month = current.getMonth();
      const today = new Date().toISOString().split('T')[0];
      
      // Update month label
      const calMonth = $('#calMonth');
      if (calMonth) {
        calMonth.textContent = current.toLocaleString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      }
      
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Blank cells for days before month starts
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
        
        if (entry) {
          dayEl.classList.add('has-entry');
        }
        
        if (dateStr === today) {
          dayEl.classList.add('today');
        }
        
        dayEl.innerHTML = `
          <div class="date-num">${i}</div>
          ${entry ? `<div class="date-amount">${fmt(entry.amount)}</div>` : ''}
        `;
        
        dayEl.onclick = () => openEntryModal(dateStr, entry);
        grid.appendChild(dayEl);
      }
      
      updateSummary();
      updateCharts();
    } catch (e) {
      console.error('Render calendar error:', e);
    }
  }

  // ========================================
  // UPDATE SUMMARY STATISTICS
  // ========================================
  function updateSummary() {
    try {
      const currentMonthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      
      // All-time total
      const allTotal = data.reduce((sum, d) => sum + Number(d.amount || 0), 0);
      const pcAll = $('#pcAll');
      if (pcAll) pcAll.textContent = fmt(allTotal);
      
      // This month
      const monthEntries = data.filter(d => d.date && d.date.startsWith(currentMonthStr));
      const monthTotal = monthEntries.reduce((sum, d) => sum + Number(d.amount || 0), 0);
      const pcMonth = $('#pcMonth');
      if (pcMonth) pcMonth.textContent = fmt(monthTotal);
      
      // Highest day & Average
      if (monthEntries.length > 0) {
        const maxAmount = Math.max(...monthEntries.map(e => Number(e.amount || 0)));
        const pcHigh = $('#pcHigh');
        if (pcHigh) pcHigh.textContent = fmt(maxAmount);
        
        const avgAmount = monthTotal / monthEntries.length;
        const pcAvg = $('#pcAvg');
        if (pcAvg) pcAvg.textContent = fmt(avgAmount);
      } else {
        const pcHigh = $('#pcHigh');
        const pcAvg = $('#pcAvg');
        if (pcHigh) pcHigh.textContent = '₹0';
        if (pcAvg) pcAvg.textContent = '₹0';
      }
      
      // Days tracked
      const daysTracked = $('#daysTracked');
      const totalDays = $('#totalDays');
      if (daysTracked) daysTracked.textContent = data.length;
      if (totalDays) totalDays.textContent = data.length;
      
      // This week
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      const weekTotal = data
        .filter(d => d.date >= weekStartStr)
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);
      const weekTotalEl = $('#weekTotal');
      if (weekTotalEl) weekTotalEl.textContent = fmt(weekTotal);
      
      // Best month
      const monthlyTotals = {};
      data.forEach(d => {
        if (d.date) {
          const monthKey = d.date.substring(0, 7);
          monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(d.amount || 0);
        }
      });
      
      const bestMonthAmount = Math.max(...Object.values(monthlyTotals), 0);
      const bestMonth = $('#bestMonth');
      if (bestMonth) bestMonth.textContent = fmt(bestMonthAmount);
      
      // Footer stats
      const footerEntries = $('#footerEntries');
      if (footerEntries) footerEntries.textContent = data.length;
    } catch (e) {
      console.error('Update summary error:', e);
    }
  }

  // ========================================
  // UPDATE ALL CHARTS
  // ========================================
  function updateCharts() {
    try {
      updateDailyChart();
      updateCategoryChart();
      updateWeeklyChart();
      updateTrendChart();
    } catch (e) {
      console.error('Update charts error:', e);
    }
  }

  // ========================================
  // DAILY CHART (CURRENT MONTH)
  // ========================================
  function updateDailyChart() {
    try {
      const canvas = $('#pcChart');
      if (!canvas) return;
      
      if (charts.daily) charts.daily.destroy();
      
      const year = current.getFullYear();
      const month = current.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const labels = [];
      const values = [];
      
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const entry = data.find(d => d.date === dateStr);
        labels.push(i);
        values.push(entry ? Number(entry.amount) : 0);
      }
      
      charts.daily = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Daily Amount',
            data: values,
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => '₹' + context.parsed.y.toFixed(2)
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => '₹' + value,
                color: 'var(--text-secondary)'
              },
              grid: { color: 'var(--glass-border)' }
            },
            x: {
              ticks: { color: 'var(--text-secondary)' },
              grid: { color: 'var(--glass-border)' }
            }
          }
        }
      });
    } catch (e) {
      console.error('Daily chart error:', e);
    }
  }

  // ========================================
  // CATEGORY DISTRIBUTION CHART
  // ========================================
  function updateCategoryChart() {
    try {
      const canvas = $('#categoryChart');
      if (!canvas) return;
      
      if (charts.category) charts.category.destroy();
      
      const categoryData = {};
      data.forEach(d => {
        const cat = d.category || '🎯 Other';
        categoryData[cat] = (categoryData[cat] || 0) + Number(d.amount || 0);
      });
      
      const labels = Object.keys(categoryData);
      const values = Object.values(categoryData);
      
      if (labels.length === 0) return;
      
      charts.category = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: [
              '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
              '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
            ],
            borderWidth: 2,
            borderColor: 'var(--bg)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: 'var(--text)',
                font: { size: 11 }
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = '₹' + context.parsed.toFixed(2);
                  return label + ': ' + value;
                }
              }
            }
          }
        }
      });
    } catch (e) {
      console.error('Category chart error:', e);
    }
  }

  // ========================================
  // WEEKLY COMPARISON CHART
  // ========================================
  function updateWeeklyChart() {
    try {
      const canvas = $('#weeklyChart');
      if (!canvas) return;
      
      if (charts.weekly) charts.weekly.destroy();
      
      const weeks = [];
      const weekTotals = [];
      
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);
        
        const weekLabel = `Week ${4 - i}`;
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        
        const weekTotal = data
          .filter(d => d.date >= weekStartStr && d.date <= weekEndStr)
          .reduce((sum, d) => sum + Number(d.amount || 0), 0);
        
        weeks.push(weekLabel);
        weekTotals.push(weekTotal);
      }
      
      charts.weekly = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: weeks,
          datasets: [{
            label: 'Weekly Total',
            data: weekTotals,
            backgroundColor: '#3b82f6',
            borderRadius: 8,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => '₹' + context.parsed.y.toFixed(2)
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => '₹' + value,
                color: 'var(--text-secondary)'
              },
              grid: { color: 'var(--glass-border)' }
            },
            x: {
              ticks: { color: 'var(--text-secondary)' },
              grid: { color: 'var(--glass-border)' }
            }
          }
        }
      });
    } catch (e) {
      console.error('Weekly chart error:', e);
    }
  }

  // ========================================
  // 6-MONTH TREND CHART
  // ========================================
  function updateTrendChart() {
    try {
      const canvas = $('#trendChart');
      if (!canvas) return;
      
      if (charts.trend) charts.trend.destroy();
      
      const months = [];
      const monthTotals = [];
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        
        const monthTotal = data
          .filter(entry => entry.date && entry.date.startsWith(monthStr))
          .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
        
        months.push(monthLabel);
        monthTotals.push(monthTotal);
      }
      
      charts.trend = new Chart(canvas, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Monthly Trend',
            data: monthTotals,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#f59e0b',
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => '₹' + context.parsed.y.toFixed(2)
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => '₹' + value,
                color: 'var(--text-secondary)'
              },
              grid: { color: 'var(--glass-border)' }
            },
            x: {
              ticks: { color: 'var(--text-secondary)' },
              grid: { color: 'var(--glass-border)' }
            }
          }
        }
      });
    } catch (e) {
      console.error('Trend chart error:', e);
    }
  }

  // ========================================
  // OPEN ENTRY MODAL
  // ========================================
  function openEntryModal(dateStr, entry) {
    try {
      selectedDate = dateStr;
      
      $('#pcDate').value = dateStr;
      $('#pcAmount').value = entry ? entry.amount : '';
      $('#pcCategory').value = entry ? (entry.category || '💵 Pocket Money') : '💵 Pocket Money';
      $('#pcNotes').value = entry ? (entry.notes || '') : '';
      
      const deleteBtn = $('#pcDelete');
      if (deleteBtn) {
        deleteBtn.style.display = entry ? 'block' : 'none';
      }
      
      const modalTitle = $('#modalTitle');
      if (modalTitle) {
        modalTitle.textContent = entry ? 'Edit Entry' : 'Add Entry';
      }
      
      openModal('#entryModal');
    } catch (e) {
      console.error('Open entry modal error:', e);
    }
  }

  // ========================================
  // CLOSE ENTRY MODAL
  // ========================================
  window.closeEntryModal = function() {
    try {
      closeModal('#entryModal');
      selectedDate = null;
    } catch (e) {
      console.error('Close entry modal error:', e);
    }
  };

  // ========================================
  // QUICK ADD TODAY
  // ========================================
  window.quickAddToday = function() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const entry = data.find(d => d.date === today);
      openEntryModal(today, entry);
    } catch (e) {
      console.error('Quick add today error:', e);
    }
  };

  // ========================================
  // FORM SUBMISSION
  // ========================================
  const pcForm = $('#pcForm');
  if (pcForm) {
    pcForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      try {
        const date = $('#pcDate').value;
        const amount = Number($('#pcAmount').value);
        const category = $('#pcCategory').value;
        const notes = $('#pcNotes').value;
        
        if (!date || !amount) {
          showSnackbar('Please fill required fields', 'error');
          return;
        }
        
        // Remove existing entry for this date
        data = data.filter(d => d.date !== date);
        
        // Add new entry
        data.push({
          id: Date.now().toString(),
          date: date,
          amount: amount,
          category: category,
          notes: notes
        });
        
        saveData('fin_pocketcal', data);
        renderCalendar();
        closeEntryModal();
        showSnackbar('Entry saved! 💾');
      } catch (e) {
        console.error('Form submission error:', e);
        showSnackbar('Failed to save entry', 'error');
      }
    });
  }

  // ========================================
  // DELETE ENTRY
  // ========================================
  window.deleteEntry = function() {
    if (!selectedDate) return;
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    
    try {
      data = data.filter(d => d.date !== selectedDate);
      saveData('fin_pocketcal', data);
      renderCalendar();
      closeEntryModal();
      showSnackbar('Entry deleted! 🗑️');
    } catch (e) {
      console.error('Delete entry error:', e);
      showSnackbar('Failed to delete', 'error');
    }
  };

  const pcDelete = $('#pcDelete');
  if (pcDelete) {
    pcDelete.addEventListener('click', deleteEntry);
  }

  // ========================================
  // NAVIGATION BUTTONS
  // ========================================
  const prevMonth = $('#prevMonth');
  if (prevMonth) {
    prevMonth.addEventListener('click', () => {
      current.setMonth(current.getMonth() - 1);
      renderCalendar();
    });
  }

  const nextMonth = $('#nextMonth');
  if (nextMonth) {
    nextMonth.addEventListener('click', () => {
      current.setMonth(current.getMonth() + 1);
      renderCalendar();
    });
  }

  // ========================================
  // DATE SEARCH/JUMP
  // ========================================
  const pcSearch = $('#pcSearch');
  if (pcSearch) {
    pcSearch.addEventListener('change', (e) => {
      const dateStr = e.target.value;
      if (!dateStr) return;
      
      try {
        // Navigate to that month
        const selectedDate = new Date(dateStr);
        current = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        renderCalendar();
        
        // Open modal for that date
        const entry = data.find(d => d.date === dateStr);
        openEntryModal(dateStr, entry);
      } catch (e) {
        console.error('Date search error:', e);
      }
    });
  }

  // ========================================
  // ADD TODAY BUTTON
  // ========================================
  const btnAddToday = $('#btnAddToday');
  if (btnAddToday) {
    btnAddToday.addEventListener('click', quickAddToday);
  }

  // ========================================
  // EXPORT FUNCTIONS
  // ========================================
  window.exportData = function() {
    try {
      if (data.length === 0) {
        showSnackbar('No data to export', 'error');
        return;
      }
      const headers = ['date', 'amount', 'category', 'notes'];
      const today = new Date().toISOString().split('T')[0];
      exportCSV(data, `pocketcal-data-${today}.csv`, headers);
    } catch (e) {
      console.error('Export CSV error:', e);
      showSnackbar('Failed to export', 'error');
    }
  };

  window.exportJSON = function() {
    try {
      if (data.length === 0) {
        showSnackbar('No data to export', 'error');
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      exportJSON(data, `pocketcal-data-${today}.json`);
    } catch (e) {
      console.error('Export JSON error:', e);
      showSnackbar('Failed to export', 'error');
    }
  };

  window.importJSON = function() {
    try {
      importJSON((imported) => {
        if (Array.isArray(imported)) {
          data = [...data, ...imported];
          saveData('fin_pocketcal', data);
          renderCalendar();
        } else {
          showSnackbar('Invalid data format', 'error');
        }
      });
    } catch (e) {
      console.error('Import JSON error:', e);
      showSnackbar('Failed to import', 'error');
    }
  };

  // ========================================
  // PDF MODAL FUNCTIONS
  // ========================================
  window.openPDFModal = function() {
    try {
      if (data.length === 0) {
        showSnackbar('No data to export', 'error');
        return;
      }
      openModal('#pdfModal');
      hideDateRangeForm();
    } catch (e) {
      console.error('Open PDF modal error:', e);
    }
  };

  window.closePDFModal = function() {
    try {
      closeModal('#pdfModal');
      hideDateRangeForm();
    } catch (e) {
      console.error('Close PDF modal error:', e);
    }
  };

  window.showDateRangeForm = function() {
    const form = $('#dateRangeForm');
    if (form) {
      form.style.display = 'block';
      
      // Set default dates
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      
      $('#pdfToDate').value = today.toISOString().split('T')[0];
      $('#pdfFromDate').value = lastMonth.toISOString().split('T')[0];
    }
  };

  window.hideDateRangeForm = function() {
    const form = $('#dateRangeForm');
    if (form) form.style.display = 'none';
  };

  // ========================================
  // PDF EXPORT FUNCTION
  // ========================================
  window.exportPDF = function(period) {
    try {
      // Check if jsPDF is loaded
      if (typeof window.jspdf === 'undefined') {
        showSnackbar('PDF library not loaded. Please refresh.', 'error');
        return;
      }

      const { jsPDF } = window.jspdf;
      
      // Filter data based on period
      let filteredData = [];
      let periodLabel = '';
      const now = new Date();
      
      switch(period) {
        case 'today':
          const today = now.toISOString().split('T')[0];
          filteredData = data.filter(d => d.date === today);
          periodLabel = 'Today';
          break;
          
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          const weekStartStr = weekStart.toISOString().split('T')[0];
          filteredData = data.filter(d => d.date >= weekStartStr);
          periodLabel = 'This Week';
          break;
          
        case 'month':
          const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          filteredData = data.filter(d => d.date && d.date.startsWith(monthStr));
          periodLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
          break;
          
        case 'year':
          const yearStr = now.getFullYear().toString();
          filteredData = data.filter(d => d.date && d.date.startsWith(yearStr));
          periodLabel = yearStr;
          break;
          
        case 'all':
          filteredData = [...data];
          periodLabel = 'All Time';
          break;
          
        default:
          filteredData = [...data];
          periodLabel = 'All Time';
      }
      
      if (filteredData.length === 0) {
        showSnackbar(`No entries found for ${periodLabel}`, 'error');
        return;
      }
      
      // Sort by date descending
      filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      generatePDF(filteredData, periodLabel);
      closePDFModal();
      showSnackbar('PDF exported successfully! 📄', 'success');
      
    } catch (e) {
      console.error('Export PDF error:', e);
      showSnackbar('Failed to export PDF', 'error');
    }
  };

  // ========================================
  // PDF DATE RANGE EXPORT
  // ========================================
  window.exportPDFDateRange = function() {
    try {
      const fromDate = $('#pdfFromDate').value;
      const toDate = $('#pdfToDate').value;
      
      if (!fromDate || !toDate) {
        showSnackbar('Please select both dates', 'error');
        return;
      }
      
      if (fromDate > toDate) {
        showSnackbar('From date must be before To date', 'error');
        return;
      }
      
      const filteredData = data.filter(d => d.date >= fromDate && d.date <= toDate);
      
      if (filteredData.length === 0) {
        showSnackbar('No entries found in selected range', 'error');
        return;
      }
      
      filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const periodLabel = `${new Date(fromDate).toLocaleDateString('en-IN')} to ${new Date(toDate).toLocaleDateString('en-IN')}`;
      
      generatePDF(filteredData, periodLabel);
      closePDFModal();
      showSnackbar('PDF exported successfully! 📄', 'success');
      
    } catch (e) {
      console.error('Export PDF date range error:', e);
      showSnackbar('Failed to export PDF', 'error');
    }
  };

  // ========================================
  // GENERATE PDF FUNCTION
  // ========================================
  function generatePDF(entries, periodLabel) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const now = new Date();
    const reportDate = now.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Colors
    const primaryColor = [16, 185, 129]; // #10b981
    const secondaryColor = [59, 130, 246]; // #3b82f6
    const accentColor = [245, 158, 11]; // #f59e0b
    const textColor = [55, 65, 81];
    
    let yPos = 20;
    
    // ===== HEADER WITH GRADIENT =====
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Add decorative circles
    doc.setFillColor(255, 255, 255);
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    doc.circle(180, 10, 15, 'F');
    doc.circle(200, 30, 20, 'F');
    doc.setGState(new doc.GState({ opacity: 1 }));
    
    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('💰 PocketCal Report', 15, 22);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${periodLabel}`, 15, 30);
    
    doc.setFontSize(9);
    doc.text(`Generated: ${reportDate}`, 15, 36);
    
    yPos = 50;
    
    // ===== SUMMARY STATISTICS BOX =====
    doc.setTextColor(...textColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Summary Statistics', 15, yPos);
    
    yPos += 5;
    
    // Calculate statistics
    const total = entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const highest = Math.max(...entries.map(e => Number(e.amount || 0)));
    const average = total / entries.length;
    const lowest = Math.min(...entries.map(e => Number(e.amount || 0)));
    
    // Statistics cards
    doc.autoTable({
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Total Amount', `₹${total.toFixed(2)}`],
        ['Number of Entries', entries.length.toString()],
        ['Highest Amount', `₹${highest.toFixed(2)}`],
        ['Lowest Amount', `₹${lowest.toFixed(2)}`],
        ['Average per Entry', `₹${average.toFixed(2)}`]
      ],
      headStyles: {
        fillColor: primaryColor,
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'left',
        textColor: [255, 255, 255]
      },
      bodyStyles: {
        fontSize: 10,
        textColor: textColor
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 90 },
        1: { halign: 'right', cellWidth: 'auto', textColor: primaryColor, fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 },
      theme: 'grid'
    });
    
    yPos = doc.lastAutoTable.finalY + 12;
    
    // ===== CATEGORY BREAKDOWN =====
    const categoryTotals = {};
    entries.forEach(e => {
      const cat = e.category || '💵 Pocket Money';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount || 0);
    });
    
    if (Object.keys(categoryTotals).length > 0) {
      // Check if we need new page
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textColor);
      doc.text('🗂️ Category Breakdown', 15, yPos);
      
      yPos += 5;
      
      const categoryData = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => {
          const percentage = ((amount / total) * 100).toFixed(1);
          return [category, `₹${amount.toFixed(2)}`, `${percentage}%`];
        });
      
      doc.autoTable({
        startY: yPos,
        head: [['Category', 'Amount', 'Percentage']],
        body: categoryData,
        headStyles: {
          fillColor: secondaryColor,
          fontSize: 11,
          fontStyle: 'bold',
          textColor: [255, 255, 255]
        },
        bodyStyles: {
          fontSize: 10,
          textColor: textColor
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        columnStyles: {
          0: { cellWidth: 75 },
          1: { halign: 'right', cellWidth: 55, textColor: secondaryColor, fontStyle: 'bold' },
          2: { halign: 'right', cellWidth: 'auto' }
        },
        margin: { left: 15, right: 15 },
        theme: 'grid'
      });
      
      yPos = doc.lastAutoTable.finalY + 12;
    }
    
    // ===== TRANSACTION DETAILS =====
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text('📅 Transaction Details', 15, yPos);
    
    yPos += 5;
    
    const transactionData = entries.map(e => {
      const formattedDate = new Date(e.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      return [
        formattedDate,
        e.category || '💵 Pocket Money',
        `₹${Number(e.amount).toFixed(2)}`,
        e.notes ? e.notes.substring(0, 35) + (e.notes.length > 35 ? '...' : '') : '-'
      ];
    });
    
    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Category', 'Amount', 'Notes']],
      body: transactionData,
      headStyles: {
        fillColor: accentColor,
        fontSize: 10,
        fontStyle: 'bold',
        textColor: [255, 255, 255]
      },
      bodyStyles: {
        fontSize: 9,
        textColor: textColor
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 45 },
        2: { halign: 'right', cellWidth: 30, textColor: accentColor, fontStyle: 'bold' },
        3: { cellWidth: 'auto' }
      },
      margin: { left: 15, right: 15 },
      theme: 'grid'
    });
    
    // ===== FOOTER ON ALL PAGES =====
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer gradient bar
      doc.setFillColor(...primaryColor);
      doc.rect(0, 282, 210, 15, 'F');
      
      // Footer text
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text('MoneyFlow PocketCal - Pocket Money Tracker', 15, 289);
      doc.text(`Page ${i} of ${pageCount}`, 195, 289, { align: 'right' });
      
      // Developer info
      doc.setFontSize(8);
      doc.text('Developed by Imad Khan (@imxd12) | imadak999@gmail.com', 105, 293, { align: 'center' });
    }
    
    // Save PDF
    const fileName = `PocketCal_${periodLabel.replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // ========================================
  // CLEAR ALL DATA
  // ========================================
  window.clearAllData = function() {
    if (!confirm('⚠️ This will delete ALL entries! Are you sure?')) return;
    if (!confirm('This action cannot be undone. Continue?')) return;
    
    try {
      data = [];
      saveData('fin_pocketcal', data);
      renderCalendar();
      showSnackbar('All data cleared! 🗑️');
    } catch (e) {
      console.error('Clear all data error:', e);
      showSnackbar('Failed to clear data', 'error');
    }
  };

  // ========================================
  // INITIALIZATION
  // ========================================
  function init() {
    try {
      renderCalendar();
      console.log('✅ PocketCal initialized successfully');
    } catch (e) {
      console.error('Initialization error:', e);
    }
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-render charts on theme change
  document.addEventListener('click', (e) => {
    if (e.target.closest('.theme-toggle')) {
      setTimeout(() => updateCharts(), 100);
    }
  });

})();
