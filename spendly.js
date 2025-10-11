/* =========================
   SPENDLY - COMPLETE LOGIC WITH PDF EXPORT
   Income & Expense Tracker with Analytics
========================= */

// Initialize global functions
startClock('#timeNow');

(function() {
  'use strict';

// ========================================
// CATEGORY CONFIGURATION - ENHANCED
// ========================================
const categoryMap = {
  Food: [
    '🍳 Breakfast', '🥪 Lunch', '🍝 Dinner', '🍿 Snacks', '☕ Beverages',
    '🍰 Desserts', '🛒 Groceries', '🥤 Drinks', '🍔 Fast Food', '🥗 Healthy Meals',
    '🍕 Pizza', '🍜 Noodles', '🍛 Curry', '🥙 Street Food', '🍦 Ice Cream',
    '🧃 Juice', '🥛 Dairy Products', '🍞 Bakery', '🥩 Meat', '🐟 Seafood',
    'All'
  ],
  
  Travel: [
    '🚌 Bus', '🚗 Taxi', '🚖 Local Transport', '✈️ Flights', '🚆 Train',
    '⛴️ Ferry', '🛣️ Fuel', '🚲 Bicycle', '🏍️ Bike', '🛺 Rickshaw',
    '🚇 Metro', '🚕 Ola/Uber', '🛵 Scooter Rental', '🚠 Cable Car', '🚁 Helicopter',
    '🚢 Ship', '🚗 Car Rental', '🅿️ Parking', '🛤️ Road Tax', '🎫 Travel Pass',
    'All'
  ],
  
  Rent: [
    '🏠 House Rent', '📱 Mobile Recharge', '💡 Utilities', '🌐 Internet', '🏢 Workspace',
    '🛋️ Furniture Rent', '🏨 Hotel', '🏡 PG/Hostel', '🚗 Vehicle Rent', '📺 TV Cable',
    '💧 Water Bill', '⚡ Electricity Bill', '🔥 Gas Bill', '🧹 Maintenance', '🏘️ Society Fee',
    '🔒 Security Deposit', '🛠️ Repair Charges', '🧰 Equipment Rental', '📦 Storage Rent', '🏪 Shop Rent',
    'All'
  ],
  
  Shopping: [
    '👕 Clothes', '👗 Fashion', '🛍️ Online', '📺 Electronics', '🎁 Gifts',
    '🖊️ Stationary', '👟 Shoes', '💄 Cosmetics', '👔 Formal Wear', '👖 Casual Wear',
    '🧥 Winter Wear', '🩳 Summer Wear', '👜 Bags', '⌚ Watches', '💍 Jewelry',
    '🕶️ Accessories', '🧴 Skincare', '💅 Makeup', '🧢 Headwear', '🧦 Innerwear',
    'All'
  ],
  
  Bills: [
    '🛜 Airtel Recharge Own','💡 Electricity', '🌊 Water', '🌐 WiFi', '📞 Phone', '📺 OTT',
    '🧾 Insurance', '🎫 Railway Pass', '📦 Subscriptions', '💳 Credit Card', '📱 Postpaid',
    '🔥 Gas Cylinder', '📡 DTH', '☁️ Cloud Storage', '🎵 Music App', '🎬 Netflix/Prime',
    '🎮 Gaming Pass', '📰 News Subscription', '💻 Software License', '🏋️ Gym Membership', '🚗 Car Insurance',
    'All'
  ],
  
  Health: [
    '💊 Medicines', '🩺 Doctor', '🏋️ Gym', '🦷 Dental', '💆 Spa',
    '🧘 Yoga', '🏥 Hospital', '🔬 Lab Tests', '👓 Eye Care', '🩹 First Aid',
    '💉 Vaccination', '🧠 Mental Health', '🧘‍♂️ Meditation', '🤰 Maternity', '👶 Baby Care',
    '🦴 Physiotherapy', '💪 Fitness', '🏃 Sports', '🧴 Health Supplements', '🩺 Health Checkup',
    'All'
  ],
  
  Entertainment: [
    '🎬 Movies', '🎮 Games', '🎵 Music', '📚 Books', '🎤 Shows',
    '🎲 Board Games', '🎯 Hobbies', '🎪 Events', '🎭 Theatre', '🎨 Art Supplies',
    '🎸 Musical Instruments', '🎧 Headphones', '🎮 Gaming Console', '🎱 Pool/Snooker', '🎳 Bowling',
    '🎢 Amusement Park', '🎡 Fun Activities', '🎰 Casino', '🎪 Circus', '📖 Magazines',
    'All'
  ],
  
  Education: [
    '📚 Tuition', '📝 Exams', '💻 Online Course', '📖 Books', '🖋️ Stationary',
    '🎓 Certifications', '📄 Print Out', '🏫 School Fees', '🎒 School Supplies', '📓 Notebooks',
    '✏️ Pens/Pencils', '📐 Geometry Box', '🖨️ Printing', '📱 Learning Apps', '👨‍🏫 Coaching',
    '🧑‍💻 Workshops', '📜 Study Material', '🗂️ Reference Books', '🎓 Exam Fees', '📚 Library Fees',
    'All'
  ],
  
  Savings: [
    '🏦 Bank Deposit', '📈 Investments', '💎 Assets', '🪙 Crypto', '💰 Cash Savings',
    '📊 Stocks', '💹 Mutual Funds', '🏅 Gold', '🏠 Property', '📉 Bonds',
    '💵 Fixed Deposit', '💳 SIP', '🏦 Recurring Deposit', '💼 PPF', '🔐 NSC',
    '🪙 NFT', '🌾 Commodities', '💱 Forex', '🏛️ Real Estate', '💎 Precious Metals',
    'All'
  ],
  
  Family: [
    '👨‍👩‍👧 Kids', '🎂 Celebrations', '🎁 Gifts', '👵👴 Elder Care', '👶 Baby Products',
    '🎉 Birthday Party', '💒 Wedding', '🎊 Anniversary', '🎈 Festivals', '🍰 Cake',
    '💐 Flowers', '🎀 Decorations', '👗 Family Clothing', '🧸 Toys', '📸 Photography',
    '🍽️ Family Dinner', '🏖️ Family Trip', '🎓 Education Support', '💊 Medical Care', '🏡 Home Improvement',
    'All'
  ],
  
  Other: [
    '🛠️ Miscellaneous', '💵 Charity', '🌱 Donations', '🎟️ Tickets', '🐕 Pet Care',
    '🐈 Pet Food', '🐾 Vet Visit', '🧼 Cleaning Supplies', '🧹 Household Items', '🔧 Tools',
    '🪴 Plants', '🌿 Gardening', '🎁 Random Gifts', '📮 Courier', '📦 Packaging',
    '🔑 Keys/Locks', '🚪 Home Decor', '🖼️ Paintings', '🕯️ Candles', '💡 Light Bulbs',
    'All'
  ]
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
      
      const incomeEl = $('#totalIncome');
      const expenseEl = $('#totalExpense');
      const balanceEl = $('#balance');
      
      if (incomeEl) incomeEl.textContent = fmt(totalIncome);
      if (expenseEl) expenseEl.textContent = fmt(totalExpense);
      if (balanceEl) balanceEl.textContent = fmt(balance);
      
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
      
      Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
      });
      charts = {};
      
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
      
      const trendCanvas = $('#trendChart');
      if (trendCanvas) {
        const monthlyData = {};
        
        data.forEach(d => {
          const month = d.date.slice(0, 7);
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
  // PDF MODAL FUNCTIONS
  // ========================================
  window.openPDFModal = function() {
    try {
      openModal('#pdfModal');
      
      // Set today's date as default for custom range
      const pdfStartDate = $('#pdfStartDate');
      const pdfEndDate = $('#pdfEndDate');
      if (pdfStartDate) pdfStartDate.value = today;
      if (pdfEndDate) pdfEndDate.value = today;
      
      // Listen for radio changes
      const radioInputs = document.querySelectorAll('input[name="pdfRange"]');
      radioInputs.forEach(radio => {
        radio.addEventListener('change', function() {
          const customRange = $('#customDateRange');
          if (customRange) {
            customRange.style.display = this.value === 'custom' ? 'block' : 'none';
          }
        });
      });
    } catch (e) {
      console.error('Open PDF modal error:', e);
    }
  };

  // ========================================
  // GENERATE PDF REPORT
  // ========================================
  window.generatePDF = function() {
    try {
      const { jsPDF } = window.jspdf;
      
      // Get selected range
      const selectedRange = document.querySelector('input[name="pdfRange"]:checked').value;
      
      // Filter data based on range
      let filteredData = [];
      let rangeText = '';
      const currentDate = new Date();
      
      if (selectedRange === 'today') {
        filteredData = data.filter(d => d.date === today);
        rangeText = `Today - ${formatDate(today)}`;
      } else if (selectedRange === 'week') {
        const weekAgo = new Date(currentDate);
        weekAgo.setDate(currentDate.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        filteredData = data.filter(d => d.date >= weekAgoStr && d.date <= today);
        rangeText = `Last 7 Days (${formatDate(weekAgoStr)} to ${formatDate(today)})`;
      } else if (selectedRange === 'month') {
        const currentMonth = today.slice(0, 7);
        filteredData = data.filter(d => d.date.startsWith(currentMonth));
        rangeText = `This Month - ${formatMonthYear(currentMonth)}`;
      } else if (selectedRange === 'year') {
        const currentYear = today.slice(0, 4);
        filteredData = data.filter(d => d.date.startsWith(currentYear));
        rangeText = `This Year - ${currentYear}`;
      } else if (selectedRange === 'custom') {
        const startDate = $('#pdfStartDate').value;
        const endDate = $('#pdfEndDate').value;
        
        if (!startDate || !endDate) {
          showSnackbar('Please select both start and end dates', 'error');
          return;
        }
        
        filteredData = data.filter(d => d.date >= startDate && d.date <= endDate);
        rangeText = `${formatDate(startDate)} to ${formatDate(endDate)}`;
      }
      
      if (filteredData.length === 0) {
        showSnackbar('No transactions found for selected period', 'error');
        return;
      }
      
      // Calculate totals for filtered data
      const income = filteredData.filter(d => d.type === 'income').reduce((sum, d) => sum + Number(d.amount), 0);
      const expense = filteredData.filter(d => d.type === 'expense').reduce((sum, d) => sum + Number(d.amount), 0);
      const balance = income - expense;
      
      // Initialize PDF
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;
      
      // ========================================
      // HEADER SECTION
      // ========================================
      
      // App Title with emoji
      doc.setFontSize(24);
      doc.setTextColor(16, 185, 129);
      doc.setFont(undefined, 'bold');
      doc.text('💰 SPENDLY', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 8;
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, 'normal');
      doc.text('Income & Expense Tracker Report', pageWidth / 2, yPos, { align: 'center' });
      
      // Separator line
      yPos += 5;
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.5);
      doc.line(20, yPos, pageWidth - 20, yPos);
      
      // Report Info
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.setFont(undefined, 'bold');
      doc.text('Report Period:', 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(rangeText, 55, yPos);
      
      yPos += 6;
      doc.setFont(undefined, 'bold');
      doc.text('Generated On:', 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(formatDateTime(new Date()), 55, yPos);
      
      yPos += 6;
      doc.setFont(undefined, 'bold');
      doc.text('Total Transactions:', 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(filteredData.length.toString(), 55, yPos);
      
      // ========================================
      // SUMMARY CARDS
      // ========================================
      yPos += 10;
      
      const cardWidth = (pageWidth - 50) / 3;
      const cardHeight = 20;
      const cardStartX = 20;
      
      // Income Card
      doc.setFillColor(220, 252, 231);
      doc.roundedRect(cardStartX, yPos, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text('TOTAL INCOME', cardStartX + cardWidth / 2, yPos + 6, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.setFont(undefined, 'bold');
      doc.text('₹' + income.toFixed(2), cardStartX + cardWidth / 2, yPos + 14, { align: 'center' });
      
      // Expense Card
      doc.setFillColor(254, 226, 226);
      doc.roundedRect(cardStartX + cardWidth + 5, yPos, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont(undefined, 'normal');
      doc.text('TOTAL EXPENSE', cardStartX + cardWidth + 5 + cardWidth / 2, yPos + 6, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(239, 68, 68);
      doc.setFont(undefined, 'bold');
      doc.text('₹' + expense.toFixed(2), cardStartX + cardWidth + 5 + cardWidth / 2, yPos + 14, { align: 'center' });
      
      // Balance Card
      const balanceColor = balance >= 0 ? [16, 185, 129] : [239, 68, 68];
      const balanceBg = balance >= 0 ? [219, 234, 254] : [254, 226, 226];
      doc.setFillColor(...balanceBg);
      doc.roundedRect(cardStartX + (cardWidth + 5) * 2, yPos, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont(undefined, 'normal');
      doc.text('NET BALANCE', cardStartX + (cardWidth + 5) * 2 + cardWidth / 2, yPos + 6, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(...balanceColor);
      doc.setFont(undefined, 'bold');
      doc.text('₹' + balance.toFixed(2), cardStartX + (cardWidth + 5) * 2 + cardWidth / 2, yPos + 14, { align: 'center' });
      
      // ========================================
      // TRANSACTION TABLE
      // ========================================
      yPos += cardHeight + 10;
      
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.setFont(undefined, 'bold');
      doc.text('Transaction Details', 20, yPos);
      
      yPos += 5;
      
      // Prepare table data
      const tableData = filteredData.map(item => {
        const category = item.type === 'income' 
          ? item.category 
          : `${item.category} - ${item.sub}`;
        
        return [
          formatDate(item.date),
          item.type.toUpperCase(),
          category,
          '₹' + Number(item.amount).toFixed(2),
          item.notes || '-'
        ];
      });
      
      // Generate table
      doc.autoTable({
        startY: yPos,
        head: [['Date', 'Type', 'Category', 'Amount', 'Notes']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [50, 50, 50]
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 25 },
          1: { halign: 'center', cellWidth: 20 },
          2: { halign: 'left', cellWidth: 55 },
          3: { halign: 'right', cellWidth: 30 },
          4: { halign: 'left', cellWidth: 'auto' }
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        didParseCell: function(data) {
          // Color code type column
          if (data.column.index === 1 && data.section === 'body') {
            const type = data.cell.raw.toLowerCase();
            if (type === 'income') {
              data.cell.styles.textColor = [16, 185, 129];
              data.cell.styles.fontStyle = 'bold';
            } else if (type === 'expense') {
              data.cell.styles.textColor = [239, 68, 68];
              data.cell.styles.fontStyle = 'bold';
            }
          }
          
          // Color code amount column
          if (data.column.index === 3 && data.section === 'body') {
            const rowType = tableData[data.row.index][1].toLowerCase();
            if (rowType === 'income') {
              data.cell.styles.textColor = [16, 185, 129];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [239, 68, 68];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        margin: { top: 10, left: 20, right: 20 },
        didDrawPage: function(data) {
          // Footer on each page
          const footerY = pageHeight - 15;
          
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.setFont(undefined, 'normal');
          
          // Page number
          const pageNum = 'Page ' + doc.internal.getCurrentPageInfo().pageNumber + ' of ' + doc.internal.getNumberOfPages();
          doc.text(pageNum, pageWidth / 2, footerY, { align: 'center' });
          
          // Developer info
          doc.text('Developed by Imad Khan (@imxd12)', 20, footerY);
          
          // Copyright
          doc.text('© 2025 MoneyFlow', pageWidth - 20, footerY, { align: 'right' });
        }
      });
      
      // ========================================
      // CATEGORY BREAKDOWN (if space available)
      // ========================================
      const finalY = doc.lastAutoTable.finalY;
      
      if (finalY < pageHeight - 60) {
        // Calculate category totals
        const categoryTotals = {};
        filteredData.filter(d => d.type === 'expense').forEach(d => {
          categoryTotals[d.category] = (categoryTotals[d.category] || 0) + Number(d.amount);
        });
        
        const sortedCategories = Object.entries(categoryTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        
        if (sortedCategories.length > 0) {
          doc.setFontSize(11);
          doc.setTextColor(40, 40, 40);
          doc.setFont(undefined, 'bold');
          doc.text('Top 5 Expense Categories', 20, finalY + 15);
          
          const categoryTableData = sortedCategories.map(([cat, amt]) => [
            cat,
            '₹' + amt.toFixed(2),
            ((amt / expense) * 100).toFixed(1) + '%'
          ]);
          
          doc.autoTable({
            startY: finalY + 20,
            head: [['Category', 'Amount', 'Percentage']],
            body: categoryTableData,
            theme: 'striped',
            headStyles: {
              fillColor: [59, 130, 246],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9
            },
            bodyStyles: {
              fontSize: 9
            },
            columnStyles: {
              0: { halign: 'left', cellWidth: 100 },
              1: { halign: 'right', cellWidth: 40 },
              2: { halign: 'center', cellWidth: 'auto' }
            },
            margin: { left: 20, right: 20 }
          });
        }
      }
      
      // ========================================
      // SAVE PDF
      // ========================================
      const filename = `Spendly_Report_${selectedRange}_${today.replace(/-/g, '')}.pdf`;
      doc.save(filename);
      
      closeModal('#pdfModal');
      showSnackbar('PDF report downloaded successfully! 📄');
      
    } catch (e) {
      console.error('Generate PDF error:', e);
      showSnackbar('Failed to generate PDF: ' + e.message, 'error');
    }
  };

  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  
  function formatMonthYear(monthStr) {
    const [year, month] = monthStr.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[parseInt(month) - 1]} ${year}`;
  }
  
  function formatDateTime(date) {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} at ${hours}:${minutes}`;
  }

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
      
      setTimeout(() => {
        renderCharts();
      }, 100);
      
      console.log('✅ Spendly initialized successfully');
    } catch (e) {
      console.error('Initialization error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.theme-toggle')) {
      setTimeout(() => renderCharts(), 100);
    }
  });

})();

