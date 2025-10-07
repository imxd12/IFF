/* =========================
   SPENDLY - COMPLETE LOGIC
   Income & Expense Tracker with Analytics
========================= */

// Initialize global functions
startClock('#timeNow');

(function() {
  'use strict';

  // ========================================
  // CATEGORY CONFIGURATION
  // ========================================
  const categoryMap = {
    Food: ['🍳 Breakfast','🥪 Lunch','🍝 Dinner','🍿 Snacks','☕ Beverages','🍰 Desserts','🛒 Groceries','🥤 Drinks','🍔 Fast Food','🥗 Healthy Meals','All'],
    Travel: ['🚌 Bus','🚗 Taxi','🚖 Local Transport','✈️ Flights','🚆 Train','⛴️ Ferry','🛣️ Fuel','🚲 Bicycle','🏍️ Bike','🛺 Rickshaw','All'],
    Rent: ['🏠 House Rent','📱 Mobile Recharge','💡 Utilities','🌐 Internet','🏢 Workspace','🛋️ Furniture Rent','All'],
    Shopping: ['👕 Clothes','👗 Fashion','🛍️ Online','📺 Electronics','🎁 Gifts','🖊️ Stationary','👟 Shoes','💄 Cosmetics','All'],
    Bills: ['💡 Electricity','🌊 Water','🌐 WiFi','📞 Phone','📺 OTT','🧾 Insurance','🎫 Railway Pass','📦 Subscriptions','All'],
    Health: ['💊 Medicines','🩺 Doctor','🏋️ Gym','🦷 Dental','💆 Spa','🧘 Yoga','All'],
    Entertainment: ['🎬 Movies','🎮 Games','🎵 Music','📚 Books','🎤 Shows','🎲 Board Games','🎯 Hobbies','All'],
    Education: ['📚 Tuition','📝 Exams','💻 Online Course','📖 Books','🖋️ Stationary','🎓 Certifications','All'],
    Savings: ['🏦 Bank Deposit','📈 Investments','💎 Assets','🪙 Crypto','💰 Cash Savings','All'],
    Family: ['👨‍👩‍👧 Kids','🎂 Celebrations','🎁 Gifts','👵👴 Elder Care','All'],
    Other: ['🛠️ Miscellaneous','💵 Charity','🌱 Donations','🎟️ Tickets','All']
  };

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  let data = loadData('fin_spendly') || [];
  let showLimit = 6;
  let showAll = false;
  let editingId = null;
  let charts = {};

  // Setup expense category dropdowns
  const expenseCategory = $('#expenseCategory');
  const expenseSub = $('#expenseSub');
  
  if (expenseCategory) {
    expenseCategory.innerHTML = Object.keys(categoryMap)
      .map(c => `<option value="${c}">${c}</option>`)
      .join('');
  }

  // ========================================
  // POPULATE SUBCATEGORIES
  // ========================================
  function populateSubcategories() {
    if (!expenseCategory || !expenseSub) return;
    
    const category = expenseCategory.value;
    expenseSub.innerHTML = categoryMap[category]
      .map(s => `<option value="${s}">${s}</option>`)
      .join('');
  }
  
  if (expenseCategory) {
    expenseCategory.addEventListener('change', populateSubcategories);
    populateSubcategories();
  }

  // ========================================
  // SET TODAY'S DATE
  // ========================================
  const today = new Date().toISOString().split('T')[0];
  const incomeDateEl = $('#incomeDate');
  const expenseDateEl = $('#expenseDate');
  
  if (incomeDateEl) incomeDateEl.value = today;
  if (expenseDateEl) expenseDateEl.value = today;

  // ========================================
  // CALCULATE TOTALS
  // ========================================
  function calcTotals() {
    try {
      const totalIncome = data
        .filter(d => d.type === 'income')
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);
      
      const totalExpense = data
        .filter(d => d.type === 'expense')
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);
      
      const balance = totalIncome - totalExpense;
      
      // Update summary cards
      const incomeEl = $('#totalIncome');
      const expenseEl = $('#totalExpense');
      const balanceEl = $('#balance');
      
      if (incomeEl) incomeEl.textContent = fmt(totalIncome);
      if (expenseEl) expenseEl.textContent = fmt(totalExpense);
      if (balanceEl) balanceEl.textContent = fmt(balance);
      
      // Update footer stats
      const footerTransactions = $('#footerTransactions');
      if (footerTransactions) {
        footerTransactions.textContent = data.length;
      }
      
      return { totalIncome, totalExpense, balance };
    } catch (e) {
      console.error('Calculate totals error:', e);
      return { totalIncome: 0, totalExpense: 0, balance: 0 };
    }
  }

  // ========================================
  // RENDER TRANSACTION LIST
  // ========================================
  function renderList(filter = '') {
    try {
      const list = $('#listSpend');
      const emptyState = $('#emptyState');
      
      if (!list) return;
      
      list.innerHTML = '';
      
      const q = filter.toLowerCase();
      const filterDateEl = $('#filterDate');
      const selDate = filterDateEl ? filterDateEl.value : '';
      
      let items = data.slice().reverse().filter(it => {
        let match = true;
        
        if (q) {
          match = (it.notes || '').toLowerCase().includes(q) ||
                  (it.category || '').toLowerCase().includes(q) ||
                  (it.sub || '').toLowerCase().includes(q);
        }
        
        if (selDate) {
          match = match && it.date === selDate;
        }
        
        return match;
      });
      
      if (!showAll) {
        items = items.slice(0, showLimit);
      }
      
      if (items.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
      }
      
      if (emptyState) emptyState.style.display = 'none';
      
      items.forEach((it, idx) => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.onclick = () => openEditModal(it.id);
        li.style.animationDelay = `${idx * 0.05}s`;
        
        const displayCategory = it.type === 'income' 
          ? it.category 
          : `${it.category} - ${it.sub}`;
        
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
    } catch (e) {
      console.error('Render list error:', e);
    }
  }

  // ========================================
  // RENDER CHARTS
  // ========================================
  function renderCharts() {
    try {
      const totals = calcTotals();
      
      // Destroy existing charts
      Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
      });
      charts = {};
      
      // Income vs Expense Chart
      const incomeExpenseCanvas = $('#incomeExpenseChart');
      if (incomeExpenseCanvas) {
        charts.incomeExpense = new Chart(incomeExpenseCanvas, {
          type: 'doughnut',
          data: {
            labels: ['Income', 'Expense'],
            datasets: [{
              data: [totals.totalIncome, totals.totalExpense],
              backgroundColor: ['#10b981', '#ef4444'],
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
                  font: { size: 12 }
                }
              }
            }
          }
        });
      }
      
      // Category Distribution Chart
      const categoryCanvas = $('#categoryChart');
      if (categoryCanvas) {
        const categoryData = {};
        data.filter(d => d.type === 'expense').forEach(d => {
          categoryData[d.category] = (categoryData[d.category] || 0) + Number(d.amount);
        });
        
        const sortedCategories = Object.entries(categoryData)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);
        
        charts.category = new Chart(categoryCanvas, {
          type: 'pie',
          data: {
            labels: sortedCategories.map(c => c[0]),
            datasets: [{
              data: sortedCategories.map(c => c[1]),
              backgroundColor: [
                '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
                '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
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
              }
            }
          }
        });
      }
      
      // Monthly Trend Chart
      const trendCanvas = $('#trendChart');
      if (trendCanvas) {
        const monthlyData = {};
        
        data.forEach(d => {
          const month = d.date.slice(0, 7); // YYYY-MM
          if (!monthlyData[month]) {
            monthlyData[month] = { income: 0, expense: 0 };
          }
          monthlyData[month][d.type] += Number(d.amount);
        });
        
        const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
        
        charts.trend = new Chart(trendCanvas, {
          type: 'line',
          data: {
            labels: sortedMonths,
            datasets: [
              {
                label: 'Income',
                data: sortedMonths.map(m => monthlyData[m].income),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
              },
              {
                label: 'Expense',
                data: sortedMonths.map(m => monthlyData[m].expense),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'top',
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
      }
    } catch (e) {
      console.error('Render charts error:', e);
    }
  }

  // ========================================
  // SWITCH BETWEEN INCOME/EXPENSE
  // ========================================
  window.switchType = function(type) {
    try {
      $$('.type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
      });
      
      $$('.transaction-form').forEach(form => {
        form.classList.toggle('active', form.id === `${type}Form`);
      });
    } catch (e) {
      console.error('Switch type error:', e);
    }
  };

  // ========================================
  // HANDLE INCOME FORM
  // ========================================
  const incomeForm = $('#incomeForm');
  if (incomeForm) {
    incomeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      try {
        const entry = {
          id: Date.now(),
          type: 'income',
          date: $('#incomeDate').value,
          amount: $('#incomeAmount').value,
          category: $('#incomeCategory').value,
          sub: '',
          notes: $('#incomeNotes').value
        };
        
        data.push(entry);
        saveData('fin_spendly', data);
        
        // Reset form
        incomeForm.reset();
        if (incomeDateEl) incomeDateEl.value = today;
        
        calcTotals();
        renderList();
        renderCharts();
        showSnackbar('Income added successfully! 💰');
      } catch (e) {
        console.error('Add income error:', e);
        showSnackbar('Failed to add income', 'error');
      }
    });
  }

  // ========================================
  // HANDLE EXPENSE FORM
  // ========================================
  const expenseForm = $('#expenseForm');
  if (expenseForm) {
    expenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      try {
        const entry = {
          id: Date.now(),
          type: 'expense',
          date: $('#expenseDate').value,
          amount: $('#expenseAmount').value,
          category: $('#expenseCategory').value,
          sub: $('#expenseSub').value,
          notes: $('#expenseNotes').value
        };
        
        data.push(entry);
        saveData('fin_spendly', data);
        
        // Reset form
        expenseForm.reset();
        if (expenseDateEl) expenseDateEl.value = today;
        populateSubcategories();
        
        calcTotals();
        renderList();
        renderCharts();
        showSnackbar('Expense added successfully! 💸');
      } catch (e) {
        console.error('Add expense error:', e);
        showSnackbar('Failed to add expense', 'error');
      }
    });
  }

  // ========================================
  // QUICK ADD EXPENSE (FAB)
  // ========================================
  window.quickAddExpense = function() {
    try {
      switchType('expense');
      const expenseAmountEl = $('#expenseAmount');
      if (expenseAmountEl) {
        expenseAmountEl.focus();
      }
      
      const expenseFormEl = $('#expenseForm');
      if (expenseFormEl) {
        window.scrollTo({ 
          top: expenseFormEl.offsetTop - 100, 
          behavior: 'smooth' 
        });
      }
    } catch (e) {
      console.error('Quick add error:', e);
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
      $('#editId').value = id;
      $('#editType').value = item.type;
      $('#editDate').value = item.date;
      $('#editAmount').value = item.amount;
      $('#editCategory').value = item.category;
      $('#editSub').value = item.sub || '';
      $('#editNotes').value = item.notes || '';
      
      openModal('#editModal');
    } catch (e) {
      console.error('Open edit modal error:', e);
    }
  }

  // ========================================
  // HANDLE EDIT FORM
  // ========================================
  const editForm = $('#editForm');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      try {
        const id = Number($('#editId').value);
        const idx = data.findIndex(d => d.id === id);
        
        if (idx !== -1) {
          data[idx].date = $('#editDate').value;
          data[idx].amount = $('#editAmount').value;
          data[idx].category = $('#editCategory').value;
          data[idx].sub = $('#editSub').value;
          data[idx].notes = $('#editNotes').value;
          
          saveData('fin_spendly', data);
          calcTotals();
          renderList();
          renderCharts();
          closeModal('#editModal');
          showSnackbar('Transaction updated! ✅');
        }
      } catch (e) {
        console.error('Edit transaction error:', e);
        showSnackbar('Failed to update', 'error');
      }
    });
  }

  // ========================================
  // DELETE TRANSACTION
  // ========================================
  window.deleteTransaction = function() {
    if (!confirm('Delete this transaction? This cannot be undone.')) return;
    
    try {
      const id = Number($('#editId').value);
      data = data.filter(d => d.id !== id);
      
      saveData('fin_spendly', data);
      calcTotals();
      renderList();
      renderCharts();
      closeModal('#editModal');
      showSnackbar('Transaction deleted! 🗑️');
    } catch (e) {
      console.error('Delete transaction error:', e);
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
  // EXPORT TO CSV
  // ========================================
  window.exportToCSV = function() {
    try {
      if (data.length === 0) {
        showSnackbar('No data to export', 'error');
        return;
      }
      
      const headers = ['type', 'date', 'amount', 'category', 'sub', 'notes'];
      exportCSV(data, `spendly-transactions-${today}.csv`, headers);
    } catch (e) {
      console.error('Export CSV error:', e);
      showSnackbar('Failed to export', 'error');
    }
  };

  // ========================================
  // IMPORT FROM JSON
  // ========================================
  window.importFromJSON = function() {
    try {
      importJSON((imported) => {
        if (Array.isArray(imported)) {
          data = [...data, ...imported];
          saveData('fin_spendly', data);
          calcTotals();
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
    if (!confirm('⚠️ This will delete ALL transactions! Are you sure?')) return;
    if (!confirm('This action cannot be undone. Continue?')) return;
    
    try {
      data = [];
      saveData('fin_spendly', data);
      calcTotals();
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

  // ========================================
  // DATE FILTER
  // ========================================
  const filterDate = $('#filterDate');
  if (filterDate) {
    filterDate.addEventListener('change', () => {
      renderList(searchInput ? searchInput.value : '');
    });
  }

  // ========================================
  // INITIALIZATION
  // ========================================
  function init() {
    try {
      calcTotals();
      renderList();
      
      // Render charts after a short delay to ensure DOM is ready
      setTimeout(() => {
        renderCharts();
      }, 100);
      
      console.log('✅ Spendly initialized successfully');
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
