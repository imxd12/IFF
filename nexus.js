/* =========================
   NEXUS - WORK & EARNINGS TRACKER
   WITH ADVANCED ANALYTICS
========================= */

startClock('#timeNow');
attachBottomNav('nav-nexus');

(function() {
  'use strict';

  // Data storage
  let data = loadData('fin_nexus') || [];
  let editingId = null;
  let showAll = false;
  
  // Chart instances
  let trendChart, categoryChart, itemsHoursChart, bonusPenaltyChart;

  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  $('#nxDate').value = today;

  // Auto-calculate payout
  function autoCalculatePayout() {
    const items = Number($('#nxItems').value) || 0;
    const hours = Number($('#nxHours').value) || 0;
    const bonus = Number($('#nxBonus').value) || 0;
    const penalty = Number($('#nxPenalty').value) || 0;
    
    // Example calculation: items * 10 + hours * 50 + bonus - penalty
    // Modify this formula based on your needs
    const calculated = (items * 10) + (hours * 50) + bonus - penalty;
    $('#nxPayout').value = Math.max(0, calculated).toFixed(2);
  }

  // Attach auto-calculate listeners
  ['#nxItems', '#nxHours', '#nxBonus', '#nxPenalty'].forEach(id => {
    $(id).addEventListener('input', autoCalculatePayout);
  });

  // Calculate summary statistics
  function calcSummary() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Today's payout
    const todayPayout = data
      .filter(d => d.date === today)
      .reduce((sum, d) => sum + Number(d.payout || 0), 0);
    
    // This month payout
    const monthPayout = data
      .filter(d => d.date.startsWith(currentMonth))
      .reduce((sum, d) => sum + Number(d.payout || 0), 0);
    
    // All-time total
    const totalPayout = data.reduce((sum, d) => sum + Number(d.payout || 0), 0);
    
    // Average daily payout
    const uniqueDays = [...new Set(data.map(d => d.date))].length;
    const avgPayout = uniqueDays > 0 ? totalPayout / uniqueDays : 0;
    
    // Total metrics
    const totalItems = data.reduce((sum, d) => sum + Number(d.items || 0), 0);
    const totalHours = data.reduce((sum, d) => sum + Number(d.hours || 0), 0);
    const totalBonus = data.reduce((sum, d) => sum + Number(d.bonus || 0), 0);
    const totalPenalty = data.reduce((sum, d) => sum + Number(d.penalty || 0), 0);
    
    // Update UI
    $('#todayPayout').textContent = fmt(todayPayout);
    $('#monthPayout').textContent = fmt(monthPayout);
    $('#totalPayout').textContent = fmt(totalPayout);
    $('#avgPayout').textContent = fmt(avgPayout);
    
    $('#totalItems').textContent = totalItems.toLocaleString();
    $('#totalHours').textContent = totalHours.toFixed(1) + 'h';
    $('#totalBonus').textContent = fmt(totalBonus);
    $('#totalPenalty').textContent = fmt(totalPenalty);
  }

  // Render charts
  function renderCharts() {
    renderTrendChart();
    renderCategoryChart();
    renderItemsHoursChart();
    renderBonusPenaltyChart();
  }

  // Daily Earnings Trend Chart (Last 14 Days)
  function renderTrendChart() {
    const canvas = $('#trendChart');
    if (!canvas) return;
    
    if (trendChart) trendChart.destroy();
    
    // Get last 14 days
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last14Days.push(d.toISOString().split('T')[0]);
    }
    
    // Calculate daily totals
    const dailyTotals = last14Days.map(date => {
      return data
        .filter(d => d.date === date)
        .reduce((sum, d) => sum + Number(d.payout || 0), 0);
    });
    
    const labels = last14Days.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Earnings',
          data: dailyTotals,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#10b981'
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

  // Category Distribution Pie Chart
  function renderCategoryChart() {
    const canvas = $('#categoryChart');
    if (!canvas) return;
    
    if (categoryChart) categoryChart.destroy();
    
    // Group by category
    const categoryData = {};
    data.forEach(d => {
      const cat = d.category || 'Other';
      categoryData[cat] = (categoryData[cat] || 0) + Number(d.payout || 0);
    });
    
    const labels = Object.keys(categoryData);
    const values = Object.values(categoryData);
    
    if (labels.length === 0) {
      return; // No data to show
    }
    
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

  // Items vs Hours Bar Chart
  function renderItemsHoursChart() {
    const canvas = $('#itemsHoursChart');
    if (!canvas) return;
    
    if (itemsHoursChart) itemsHoursChart.destroy();
    
    // Last 7 entries
    const last7 = data.slice(-7).reverse();
    const labels = last7.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const items = last7.map(d => Number(d.items || 0));
    const hours = last7.map(d => Number(d.hours || 0));
    
    itemsHoursChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Items',
            data: items,
            backgroundColor: '#3b82f6',
            borderRadius: 6
          },
          {
            label: 'Hours',
            data: hours,
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // Bonus vs Penalty Chart
  function renderBonusPenaltyChart() {
    const canvas = $('#bonusPenaltyChart');
    if (!canvas) return;
    
    if (bonusPenaltyChart) bonusPenaltyChart.destroy();
    
    // Last 7 entries
    const last7 = data.slice(-7).reverse();
    const labels = last7.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const bonus = last7.map(d => Number(d.bonus || 0));
    const penalty = last7.map(d => Number(d.penalty || 0));
    
    bonusPenaltyChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Bonus',
            data: bonus,
            backgroundColor: '#10b981',
            borderRadius: 6
          },
          {
            label: 'Penalty',
            data: penalty,
            backgroundColor: '#ef4444',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
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

  // Render list
  function renderList(filter = '') {
    const list = $('#listNexus');
    const emptyState = $('#emptyState');
    list.innerHTML = '';
    
    let items = data.slice().sort((a, b) => b.date.localeCompare(a.date));
    
    if (!showAll) {
      items = items.slice(0, 30);
    }
    
    if (filter) {
      const q = filter.toLowerCase();
      items = items.filter(it => 
        (it.date || '').includes(q) || 
        (it.notes || '').toLowerCase().includes(q) ||
        (it.category || '').toLowerCase().includes(q)
      );
    }
    
    if (items.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    
    emptyState.style.display = 'none';
    
    items.forEach(it => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.onclick = () => openEditModal(it.id);
      
      li.innerHTML = `
        <div class="list-header">
          <div class="item-category">${it.category || 'Work'}</div>
          <div class="item-date">📅 ${it.date}</div>
        </div>
        <div class="list-body">
          <div class="list-stat">
            <div class="stat-label">Items</div>
            <div class="stat-value">${it.items || 0}</div>
          </div>
          <div class="list-stat">
            <div class="stat-label">Hours</div>
            <div class="stat-value">${it.hours || 0}h</div>
          </div>
          <div class="list-stat">
            <div class="stat-label">Bonus</div>
            <div class="stat-value">${fmt(it.bonus || 0)}</div>
          </div>
          <div class="list-stat">
            <div class="stat-label">Penalty</div>
            <div class="stat-value">${fmt(it.penalty || 0)}</div>
          </div>
        </div>
        <div class="list-footer">
          <div class="item-payout">💰 ${fmt(it.payout)}</div>
          ${it.notes ? `<div class="item-notes">📝 ${it.notes}</div>` : ''}
        </div>
      `;
      
      list.appendChild(li);
    });
  }

  // Open add modal
  window.openAddModal = function() {
    editingId = null;
    $('#modalTitle').textContent = 'Add Nexus Entry';
    $('#nxForm').reset();
    $('#nxDate').value = today;
    $('#deleteBtn').style.display = 'none';
    openModal('#nxModal');
  };

  // Open edit modal
  function openEditModal(id) {
    const item = data.find(d => d.id === id);
    if (!item) return;
    
    editingId = id;
    $('#modalTitle').textContent = 'Edit Nexus Entry';
    $('#editId').value = id;
    $('#nxDate').value = item.date;
    $('#nxItems').value = item.items || 0;
    $('#nxHours').value = item.hours || 0;
    $('#nxBonus').value = item.bonus || 0;
    $('#nxPenalty').value = item.penalty || 0;
    $('#nxPayout').value = item.payout;
    $('#nxCategory').value = item.category;
    $('#nxNotes').value = item.notes || '';
    $('#deleteBtn').style.display = 'block';
    
    openModal('#nxModal');
  }

  // Form submission
  $('#nxForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const entry = {
      id: editingId || Date.now(),
      date: $('#nxDate').value,
      items: Number($('#nxItems').value) || 0,
      hours: Number($('#nxHours').value) || 0,
      bonus: Number($('#nxBonus').value) || 0,
      penalty: Number($('#nxPenalty').value) || 0,
      payout: Number($('#nxPayout').value),
      category: $('#nxCategory').value,
      notes: $('#nxNotes').value
    };
    
    if (editingId) {
      const idx = data.findIndex(d => d.id === editingId);
      if (idx !== -1) data[idx] = entry;
    } else {
      data.push(entry);
    }
    
    saveData('fin_nexus', data);
    calcSummary();
    renderList();
    renderCharts();
    closeModal('#nxModal');
    showSnackbar(editingId ? 'Entry updated! ✅' : 'Entry added! 💼');
  });

  // Delete entry
  window.deleteEntry = function() {
    if (!confirm('Delete this entry?')) return;
    
    data = data.filter(d => d.id !== editingId);
    saveData('fin_nexus', data);
    calcSummary();
    renderList();
    renderCharts();
    closeModal('#nxModal');
    showSnackbar('Entry deleted! 🗑️');
  };

  // Toggle show all
  window.toggleShowAll = function() {
    showAll = !showAll;
    $('#toggleText').textContent = showAll ? 'Show Less' : 'Show All';
    renderList($('#searchInput').value);
  };

  // Export functions
  window.exportToJSON = function() {
    exportJSON(data, 'nexus-entries.json');
  };

  window.exportToCSV = function() {
    const headers = ['date', 'category', 'items', 'hours', 'bonus', 'penalty', 'payout', 'notes'];
    exportCSV(data, 'nexus-entries.csv', headers);
  };

  window.importFromJSON = function() {
    importJSON((imported) => {
      if (Array.isArray(imported)) {
        data = [...data, ...imported];
        saveData('fin_nexus', data);
        calcSummary();
        renderList();
        renderCharts();
      }
    });
  };

  // Search functionality
  $('#searchInput').addEventListener('input', (e) => {
    renderList(e.target.value);
  });

  // Initialize
  calcSummary();
  renderList();
  renderCharts();

})();
