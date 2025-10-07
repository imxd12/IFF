/* =========================
   POCKETCAL - CALENDAR MONEY TRACKER
   WITH ADVANCED ANALYTICS
========================= */

startClock('#timeNow');
attachBottomNav('nav-pocket');

(function() {
  'use strict';

  // Data storage
  let data = loadData('fin_pocketcal') || [];
  let current = new Date();
  current.setDate(1);
  let selectedDate = null;
  
  // Chart instances
  let dailyChart, categoryChart, weeklyChart, trendChart;

  // Render calendar
  function renderCalendar() {
    const grid = $('#calendarGrid');
    grid.innerHTML = '';
    
    const year = current.getFullYear();
    const month = current.getMonth();
    const today = new Date().toISOString().split('T')[0];
    
    $('#calMonth').textContent = current.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
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
  }

  // Update summary statistics
  function updateSummary() {
    const currentMonthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    
    // All-time total
    const allTotal = data.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    $('#pcAll').textContent = fmt(allTotal);
    
    // This month
    const monthEntries = data.filter(d => d.date.startsWith(currentMonthStr));
    const monthTotal = monthEntries.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    $('#pcMonth').textContent = fmt(monthTotal);
    
    // Highest day
    if (monthEntries.length > 0) {
      const maxAmount = Math.max(...monthEntries.map(e => e.amount));
      $('#pcHigh').textContent = fmt(maxAmount);
      
      // Average per day
      const avgAmount = monthTotal / monthEntries.length;
      $('#pcAvg').textContent = fmt(avgAmount);
    } else {
      $('#pcHigh').textContent = '₹0';
      $('#pcAvg').textContent = '₹0';
    }
    
    // Additional stats
    $('#daysTracked').textContent = data.length;
    $('#totalDays').textContent = data.length;
    
    // This week
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    const weekTotal = data
      .filter(d => d.date >= weekStartStr)
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);
    $('#weekTotal').textContent = fmt(weekTotal);
    
    // Best month
    const monthlyTotals = {};
    data.forEach(d => {
      const monthKey = d.date.substring(0, 7);
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(d.amount || 0);
    });
    
    const bestMonthAmount = Math.max(...Object.values(monthlyTotals), 0);
    $('#bestMonth').textContent = fmt(bestMonthAmount);
  }

  // Update all charts
  function updateCharts() {
    updateDailyChart();
    updateCategoryChart();
    updateWeeklyChart();
    updateTrendChart();
  }

  // Daily chart for current month
  function updateDailyChart() {
    const canvas = $('#pcChart');
    if (!canvas) return;
    
    if (dailyChart) dailyChart.destroy();
    
    const year = current.getFullYear();
    const month = current.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const labels = [];
    const values = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const entry = data.find(d => d.date === dateStr);
      labels.push(i);
      values.push(entry ? entry.amount : 0);
    }
    
    dailyChart = new Chart(canvas, {
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
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => '₹' + value
            }
          }
        }
      }
    });
  }

  // Category distribution pie chart
  function updateCategoryChart() {
    const canvas = $('#categoryChart');
    if (!canvas) return;
    
    if (categoryChart) categoryChart.destroy();
    
    const categoryData = {};
    data.forEach(d => {
      const cat = d.category || '🎯 Other';
      categoryData[cat] = (categoryData[cat] || 0) + Number(d.amount || 0);
    });
    
    const labels = Object.keys(categoryData);
    const values = Object.values(categoryData);
    
    if (labels.length === 0) return;
    
    categoryChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: [
            '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
            '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  // Weekly comparison bar chart (last 4 weeks)
  function updateWeeklyChart() {
    const canvas = $('#weeklyChart');
    if (!canvas) return;
    
    if (weeklyChart) weeklyChart.destroy();
    
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
    
    weeklyChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: weeks,
        datasets: [{
          label: 'Weekly Total',
          data: weekTotals,
          backgroundColor: '#3b82f6',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => '₹' + value
            }
          }
        }
      }
    });
  }

  // 6-month trend line chart
  function updateTrendChart() {
    const canvas = $('#trendChart');
    if (!canvas) return;
    
    if (trendChart) trendChart.destroy();
    
    const months = [];
    const monthTotals = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      
      const monthTotal = data
        .filter(entry => entry.date.startsWith(monthStr))
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      
      months.push(monthLabel);
      monthTotals.push(monthTotal);
    }
    
    trendChart = new Chart(canvas, {
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
          pointBackgroundColor: '#f59e0b'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => '₹' + value
            }
          }
        }
      }
    });
  }

  // Open entry modal
  function openEntryModal(dateStr, entry) {
    selectedDate = dateStr;
    $('#pcDate').value = dateStr;
    $('#pcAmount').value = entry ? entry.amount : '';
    $('#pcCategory').value = entry ? (entry.category || '💵 Pocket Money') : '💵 Pocket Money';
    $('#pcNotes').value = entry ? (entry.notes || '') : '';
    $('#pcDelete').style.display = entry ? 'block' : 'none';
    $('#modalTitle').textContent = entry ? 'Edit Entry' : 'Add Entry';
    openModal('#entryModal');
  }

  // Close modal
  window.closeEntryModal = function() {
    closeModal('#entryModal');
    selectedDate = null;
  };

  // Quick add today
  window.quickAddToday = function() {
    const today = new Date().toISOString().split('T')[0];
    const entry = data.find(d => d.date === today);
    openEntryModal(today, entry);
  };

  // Form submission
  $('#pcForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
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
  });

  // Delete entry
  $('#pcDelete').addEventListener('click', () => {
    if (!selectedDate) return;
    
    if (!confirm('Delete this entry?')) return;
    
    data = data.filter(d => d.date !== selectedDate);
    saveData('fin_pocketcal', data);
    renderCalendar();
    closeEntryModal();
    showSnackbar('Entry deleted! 🗑️');
  });

  // Navigation buttons
  $('#prevMonth').addEventListener('click', () => {
    current.setMonth(current.getMonth() - 1);
    renderCalendar();
  });

  $('#nextMonth').addEventListener('click', () => {
    current.setMonth(current.getMonth() + 1);
    renderCalendar();
  });

  // Date search
  $('#pcSearch').addEventListener('change', (e) => {
    const dateStr = e.target.value;
    if (!dateStr) return;
    
    // Navigate to that month
    const selectedDate = new Date(dateStr);
    current = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    renderCalendar();
    
    // Open modal for that date
    const entry = data.find(d => d.date === dateStr);
    openEntryModal(dateStr, entry);
  });

  // Add today button
  $('#btnAddToday').addEventListener('click', quickAddToday);

  // Export data
  window.exportData = function() {
    const headers = ['date', 'amount', 'category', 'notes'];
    exportCSV(data, 'pocketcal-data.csv', headers);
  };

  // Initialize
  renderCalendar();

})();
