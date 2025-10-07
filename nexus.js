/* =========================
   NEXUS - COMPLETE LOGIC
   Work & Earnings Tracker with Advanced Analytics
========================= */

// Initialize global functions
startClock('#timeNow');

(function() {
  'use strict';

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  let data = loadData('fin_nexus') || [];
  let editingId = null;
  let showAll = false;
  let charts = {};

  // ========================================
  // SET TODAY'S DATE
  // ========================================
  const today = new Date().toISOString().split('T')[0];
  const dateEl = $('#nxDate');
  if (dateEl) dateEl.value = today;

  // ========================================
  // AUTO-CALCULATE PAYOUT
  // ========================================
  function autoCalculatePayout() {
    try {
      const items = Number($('#nxItems')?.value) || 0;
      const hours = Number($('#nxHours')?.value) || 0;
      const bonus = Number($('#nxBonus')?.value) || 0;
      const penalty = Number($('#nxPenalty')?.value) || 0;
      
      // Formula: items * 10 + hours * 50 + bonus - penalty
      // Customize this formula based on your needs
      const calculated = (items * 10) + (hours * 50) + bonus - penalty;
      
      const payoutEl = $('#nxPayout');
      if (payoutEl) {
        payoutEl.value = Math.max(0, calculated).toFixed(2);
      }
    } catch (e) {
      console.error('Auto-calculate error:', e);
    }
  }

  // Attach auto-calculate listeners
  ['#nxItems', '#nxHours', '#nxBonus', '#nxPenalty'].forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener('input', autoCalculatePayout);
    }
  });

  // ========================================
  // CALCULATE SUMMARY STATISTICS
  // ========================================
  function calcSummary() {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Today's payout
      const todayPayout = data
        .filter(d => d.date === today)
        .reduce((sum, d) => sum + Number(d.payout || 0), 0);
      
      // This month payout
      const monthPayout = data
        .filter(d => d.date && d.date.startsWith(currentMonth))
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
      const todayEl = $('#todayPayout');
      const monthEl = $('#monthPayout');
      const totalEl = $('#totalPayout');
      const avgEl = $('#avgPayout');
      const itemsEl = $('#totalItems');
      const hoursEl = $('#totalHours');
      const bonusEl = $('#totalBonus');
      const penaltyEl = $('#totalPenalty');
      
      if (todayEl) todayEl.textContent = fmt(todayPayout);
      if (monthEl) monthEl.textContent = fmt(monthPayout);
      if (totalEl) totalEl.textContent = fmt(totalPayout);
      if (avgEl) avgEl.textContent = fmt(avgPayout);
      if (itemsEl) itemsEl.textContent = totalItems.toLocaleString();
      if (hoursEl) hoursEl.textContent = totalHours.toFixed(1) + 'h';
      if (bonusEl) bonusEl.textContent = fmt(totalBonus);
      if (penaltyEl) penaltyEl.textContent = fmt(totalPenalty);
      
      // Update footer stats
      const footerEntries = $('#footerEntries');
      if (footerEntries) {
        footerEntries.textContent = data.length;
      }
    } catch (e) {
      console.error('Calculate summary error:', e);
    }
  }

  // ========================================
  // RENDER ALL CHARTS
  // ========================================
  function renderCharts() {
    try {
      renderTrendChart();
      renderCategoryChart();
      renderItemsHoursChart();
      renderBonusPenaltyChart();
    } catch (e) {
      console.error('Render charts error:', e);
    }
  }

  // ========================================
  // DAILY EARNINGS TREND CHART
  // ========================================
  function renderTrendChart() {
    try {
      const canvas = $('#trendChart');
      if (!canvas) return;
      
      if (charts.trend) charts.trend.destroy();
      
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
      
      charts.trend = new Chart(canvas, {
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
            pointBackgroundColor: '#10b981',
            pointHoverRadius: 6
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
  // CATEGORY DISTRIBUTION CHART
  // ========================================
  function renderCategoryChart() {
    try {
      const canvas = $('#categoryChart');
      if (!canvas) return;
      
      if (charts.category) charts.category.destroy();
      
      // Group by category
      const categoryData = {};
      data.forEach(d => {
        const cat = d.category || '🎯 Other';
        categoryData[cat] = (categoryData[cat] || 0) + Number(d.payout || 0);
      });
      
      const labels = Object.keys(categoryData);
      const values = Object.values(categoryData);
      
      if (labels.length === 0) {
        return; // No data to show
      }
      
      charts.category = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: [
              '#10b981', '#3b82f6', '#f59e0b', '#ef4444', 
              '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
              '#14b8a6', '#f43f5e', '#84cc16', '#6366f1'
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
  // ITEMS VS HOURS CHART
  // ========================================
  function renderItemsHoursChart() {
    try {
      const canvas = $('#itemsHoursChart');
      if (!canvas) return;
      
      if (charts.itemsHours) charts.itemsHours.destroy();
      
      // Last 7 entries
      const last7 = data.slice(-7).reverse();
      const labels = last7.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      const items = last7.map(d => Number(d.items || 0));
      const hours = last7.map(d => Number(d.hours || 0));
      
      charts.itemsHours = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Items',
              data: items,
              backgroundColor: '#3b82f6',
              borderRadius: 6,
              borderWidth: 0
            },
            {
              label: 'Hours',
              data: hours,
              backgroundColor: '#10b981',
              borderRadius: 6,
              borderWidth: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: 'var(--text)',
                font: { size: 12 }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: 'var(--text-secondary)' },
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
      console.error('Items/Hours chart error:', e);
    }
  }

  // ========================================
  // BONUS VS PENALTY CHART
  // ========================================
  function renderBonusPenaltyChart() {
    try {
      const canvas = $('#bonusPenaltyChart');
      if (!canvas) return;
      
      if (charts.bonusPenalty) charts.bonusPenalty.destroy();
      
      // Last 7 entries
      const last7 = data.slice(-7).reverse();
      const labels = last7.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      const bonus = last7.map(d => Number(d.bonus || 0));
      const penalty = last7.map(d => Number(d.penalty || 0));
      
      charts.bonusPenalty = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Bonus',
              data: bonus,
              backgroundColor: '#10b981',
              borderRadius: 6,
              borderWidth: 0
            },
            {
              label: 'Penalty',
              data: penalty,
              backgroundColor: '#ef4444',
              borderRadius: 6,
              borderWidth: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: 'var(--text)',
                font: { size: 12 }
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  return context.dataset.label + ': ₹' + context.parsed.y.toFixed(2);
                }
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
      console.error('Bonus/Penalty chart error:', e);
    }
  }

  // ========================================
  // RENDER ENTRY LIST
  // ========================================
  function renderList(filter = '') {
    try {
      const list = $('#listNexus');
      const emptyState = $('#emptyState');
      
      if (!list) return;
      
      list.innerHTML = '';
      
      let items = data.slice().sort((a, b) => b.date.localeCompare(a.date));
      
      // Apply filter
      if (filter) {
        const q = filter.toLowerCase();
        items = items.filter(it => 
          (it.date || '').includes(q) || 
          (it.notes || '').toLowerCase().includes(q) ||
          (it.category || '').toLowerCase().includes(q)
        );
      }
      
      // Limit if not showing all
      if (!showAll) {
        items = items.slice(0, 30);
      }
      
      // Show empty state if no items
      if (items.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
      }
      
      if (emptyState) emptyState.style.display = 'none';
      
      // Render each item
      items.forEach((it, idx) => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.onclick = () => openEditModal(it.id);
        li.style.animationDelay = `${idx * 0.05}s`;
        
        li.innerHTML = `
          <div class="list-header">
            <div class="item-category">${it.category || '🎯 Work'}</div>
            <div class="item-date">📅 ${it.date}</div>
          </div>
          <div class="list-body">
            <div class="list-stat">
              <div class="stat-label">Items</div>
              <div class="stat-value">${it.items || 0}</div>
            </div>
            <div class="list-stat">
              <div class="stat-label">Hours</div>
              <div class="stat-value">${(it.hours || 0)}h</div>
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
    } catch (e) {
      console.error('Render list error:', e);
    }
  }

  // ========================================
  // OPEN ADD MODAL
  // ========================================
  window.openAddModal = function() {
    try {
      editingId = null;
      const modalTitle = $('#modalTitle');
      const nxForm = $('#nxForm');
      const deleteBtn = $('#deleteBtn');
      
      if (modalTitle) modalTitle.textContent = 'Add Nexus Entry';
      if (nxForm) nxForm.reset();
      if (dateEl) dateEl.value = today;
      if (deleteBtn) deleteBtn.style.display = 'none';
      
      openModal('#nxModal');
    } catch (e) {
      console.error('Open add modal error:', e);
    }
  };

  // ========================================
  // OPEN EDIT MODAL
  // ========================================
  function openEditModal(id) {
    try {
      const item = data.find(d => d.id === id);
      if (!item) return;
      
      editingId = id;
      
      const modalTitle = $('#modalTitle');
      if (modalTitle) modalTitle.textContent = 'Edit Nexus Entry';
      
      $('#editId').value = id;
      $('#nxDate').value = item.date;
      $('#nxItems').value = item.items || 0;
      $('#nxHours').value = item.hours || 0;
      $('#nxBonus').value = item.bonus || 0;
      $('#nxPenalty').value = item.penalty || 0;
      $('#nxPayout').value = item.payout;
      $('#nxCategory').value = item.category;
      $('#nxNotes').value = item.notes || '';
      
      const deleteBtn = $('#deleteBtn');
      if (deleteBtn) deleteBtn.style.display = 'block';
      
      openModal('#nxModal');
    } catch (e) {
      console.error('Open edit modal error:', e);
    }
  }

  // ========================================
  // FORM SUBMISSION
  // ========================================
  const nxForm = $('#nxForm');
  if (nxForm) {
    nxForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      try {
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
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    
    try {
      data = data.filter(d => d.id !== editingId);
      saveData('fin_nexus', data);
      calcSummary();
      renderList();
      renderCharts();
      closeModal('#nxModal');
      showSnackbar('Entry deleted! 🗑️');
    } catch (e) {
      console.error('Delete entry error:', e);
      showSnackbar('Failed to delete', 'error');
    }
  };

  // ========================================
  // TOGGLE SHOW ALL
  // ========================================
  window.toggleShowAll = function() {
    try {
      showAll = !showAll;
      const toggleText = $('#toggleText');
      if (toggleText) {
        toggleText.textContent = showAll ? 'Show Less' : 'Show All';
      }
      
      const searchInput = $('#searchInput');
      renderList(searchInput ? searchInput.value : '');
    } catch (e) {
      console.error('Toggle show all error:', e);
    }
  };

  // ========================================
  // EXPORT FUNCTIONS
  // ========================================
  window.exportToJSON = function() {
    try {
      if (data.length === 0) {
        showSnackbar('No data to export', 'error');
        return;
      }
      exportJSON(data, `nexus-entries-${today}.json`);
    } catch (e) {
      console.error('Export JSON error:', e);
      showSnackbar('Failed to export', 'error');
    }
  };

  window.exportToCSV = function() {
    try {
      if (data.length === 0) {
        showSnackbar('No data to export', 'error');
        return;
      }
      const headers = ['date', 'category', 'items', 'hours', 'bonus', 'penalty', 'payout', 'notes'];
      exportCSV(data, `nexus-entries-${today}.csv`, headers);
    } catch (e) {
      console.error('Export CSV error:', e);
      showSnackbar('Failed to export', 'error');
    }
  };

  window.importFromJSON = function() {
    try {
      importJSON((imported) => {
        if (Array.isArray(imported)) {
          data = [...data, ...imported];
          saveData('fin_nexus', data);
          calcSummary();
          renderList();
          renderCharts();
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
      saveData('fin_nexus', data);
      calcSummary();
      renderList();
      renderCharts();
      showSnackbar('All data cleared! 🗑️');
    } catch (e) {
      console.error('Clear all data error:', e);
      showSnackbar('Failed to clear data', 'error');
    }
  };

  // ========================================
  // SEARCH FUNCTIONALITY
  // ========================================
  const searchInput = $('#searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      renderList(e.target.value);
    }, 300));
  }

  // Date filter
  const filterDate = $('#filterDate');
  if (filterDate) {
    filterDate.addEventListener('change', (e) => {
      const selectedDate = e.target.value;
      if (selectedDate) {
        renderList(selectedDate);
      } else {
        renderList(searchInput ? searchInput.value : '');
      }
    });
  }

  // ========================================
  // INITIALIZATION
  // ========================================
  function init() {
    try {
      calcSummary();
      renderList();
      
      // Render charts after a short delay to ensure DOM is ready
      setTimeout(() => {
        renderCharts();
      }, 100);
      
      console.log('✅ Nexus initialized successfully');
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
      setTimeout(() => renderCharts(), 100);
    }
  });

})();
