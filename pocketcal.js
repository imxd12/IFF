/* =========================
   POCKETCAL - COMPLETE LOGIC
   Calendar Money Tracker with Advanced Analytics
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
