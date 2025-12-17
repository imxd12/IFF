/* =========================
   SPENDLY - COMPLETE LOGIC WITH ENHANCED PDF EXPORT & POCKETCAL SYNC
   Income & Expense Tracker with Analytics - Professional PDF Reports
========================= */

// Initialize global functions
startClock('#timeNow');

(function() {
  'use strict';

// ========================================
  // CATEGORY CONFIGURATION - ENHANCED (30+ items each)
  // ========================================
  const categoryMap = {
    Food: [
      '🍳 Breakfast', '🥪 Lunch', '🍝 Dinner', '🍿 Snacks', '☕ Beverages',
      '🍰 Desserts', '🛒 Groceries', '🥤 Drinks', '🍔 Fast Food', '🥗 Healthy Meals',
      '🍕 Pizza', '🍜 Noodles', '🍛 Curry', '🥙 Street Food', '🍦 Ice Cream',
      '🧃 Juice', '🥛 Dairy Products', '🍞 Bakery', '🥩 Meat', '🐟 Seafood',
      '🍲 Home Cooked', '🍜 Chinese', '🍱 Japanese', '🌮 Mexican', '🍝 Italian',
      '🥘 South Indian', '🥘 North Indian', '🍲 Biryani', '🥘 Dal', '🍗 Chicken',
      '🥚 Eggs', '🍎 Fruits', '🥬 Vegetables', 'All'
    ],
    Travel: [
      '🚌 Bus', '🚗 Taxi', '🚖 Local Transport', '✈️ Flights', '🚆 Train',
      '⛴️ Ferry', '🛣️ Fuel', '🚲 Bicycle', '🏍️ Bike', '🛺 Rickshaw',
      '🚇 Metro', '🚕 Ola/Uber', '🛵 Scooter Rental', '🚠 Cable Car', '🚁 Helicopter',
      '🚢 Ship', '🚗 Car Rental', '🅿️ Parking', '🛤️ Road Tax', '🎫 Travel Pass',
      '🛫 International', '🛬 Domestic', '🚗 Self Drive', '🚙 Road Trip', '🏖️ Vacation',
      '🏔️ Adventure', '🏰 Pilgrimage', '🎡 Sightseeing', '🗺️ Local Tour', '🚤 Cruise',
      '🛤️ Toll Plaza', '🛒 Travel Insurance', '📱 Roaming Pack', 'All'
    ],
    Rent: [
      '🏠 House Rent', '📱 Mobile Recharge', '💡 Utilities', '🌐 Internet', '🏢 Workspace',
      '🛋️ Furniture Rent', '🏨 Hotel', '🏡 PG/Hostel', '🚗 Vehicle Rent', '📺 TV Cable',
      '💧 Water Bill', '⚡ Electricity Bill', '🔥 Gas Bill', '🧹 Maintenance', '🏘️ Society Fee',
      '🔒 Security Deposit', '🛠️ Repair Charges', '🧰 Equipment Rental', '📦 Storage Rent', '🏪 Shop Rent',
      '🏠 Apartment', '🏘️ Villa', '🏢 Office Space', '🏪 Commercial', '🛥️ Boat Rent',
      '🎪 Event Space', '📚 Study Room', '💼 Meeting Room', '🏋️ Gym Locker', '🎸 Music Room',
      '🖥️ Server Hosting', '☁️ Cloud Hosting', '📡 Satellite', 'All'
    ],
    Shopping: [
      '👕 Clothes', '👗 Fashion', '🛍️ Online', '📺 Electronics', '🎁 Gifts',
      '🖊️ Stationary', '👟 Shoes', '💄 Cosmetics', '👔 Formal Wear', '👖 Casual Wear',
      '🧥 Winter Wear', '🩳 Summer Wear', '👜 Bags', '⌚ Watches', '💍 Jewelry',
      '🕶️ Accessories', '🧴 Skincare', '💅 Makeup', '🧢 Headwear', '🧦 Innerwear',
      '👓 Eyewear', '💰 Wallet', '🧳 Luggage', '🎒 Backpack', '👒 Hats',
      '🧳 Travel Gear', '🏃 Sports Wear', '🏋️ Fitness Gear', '🎮 Gaming', '📱 Mobile',
      '💻 Laptop', '📷 Camera', '🎧 Audio Gear', 'All'
    ],
    Bills: [
      '🛜 Airtel Recharge Own', '💡 Electricity', '🌊 Water', '🌐 WiFi', '📞 Phone', 
      '📺 OTT', '🧾 Insurance', '🎫 Railway Pass', '📦 Subscriptions', '💳 Credit Card',
      '📱 Postpaid', '🔥 Gas Cylinder', '📡 DTH', '☁️ Cloud Storage', '🎵 Music App',
      '🎬 Netflix/Prime', '🎮 Gaming Pass', '📰 News Subscription', '💻 Software License',
      '🏋️ Gym Membership', '🚗 Car Insurance', '🏠 Home Insurance', '👨‍⚕️ Health Insurance',
      '👨‍💼 Life Insurance', '🏦 Loan EMI', '💳 Credit EMI', '📚 Education Loan',
      '🏠 Mortgage', '💰 SIP Auto Debit', '🪙 Crypto Auto Buy', '📈 Stock SIP',
      '🏦 Bank Charges', '💳 ATM Charges', '📱 App Charges', 'All'
    ],
    Health: [
      '💊 Medicines', '🩺 Doctor', '🏋️ Gym', '🦷 Dental', '💆 Spa',
      '🧘 Yoga', '🏥 Hospital', '🔬 Lab Tests', '👓 Eye Care', '🩹 First Aid',
      '💉 Vaccination', '🧠 Mental Health', '🧘‍♂️ Meditation', '🤰 Maternity', '👶 Baby Care',
      '🦴 Physiotherapy', '💪 Fitness', '🏃 Sports', '🧴 Health Supplements', '🩺 Health Checkup',
      '🥗 Nutritionist', '💊 Pharmacy', '🩺 Specialist', '🩺 Cardiologist', '🧠 Neurologist',
      '👂 ENT', '🦷 Orthodontist', '🏥 Emergency', '🩹 Bandages', '🥛 Protein',
      '💊 Vitamins', '🩺 Annual Checkup', '🏃 Marathon Fee', '🏋️ Personal Trainer', 'All'
    ],
    Entertainment: [
      '🎬 Movies', '🎮 Games', '🎵 Music', '📚 Books', '🎤 Shows',
      '🎲 Board Games', '🎯 Hobbies', '🎪 Events', '🎭 Theatre', '🎨 Art Supplies',
      '🎸 Musical Instruments', '🎧 Headphones', '🎮 Gaming Console', '🎱 Pool/Snooker', '🎳 Bowling',
      '🎢 Amusement Park', '🎡 Fun Activities', '🎰 Casino', '🎪 Circus', '📖 Magazines',
      '🎤 Live Concert', '🎪 Comedy Show', '🎨 Painting Class', '📚 Book Fair', '🎮 Esports',
      '🎵 Music Festival', '🎬 Premiere', '🎭 Drama', '🎪 Magic Show', '🎲 Puzzle',
      '🎯 Archery', '🎸 Guitar Lessons', '🎨 Art Exhibition', 'All'
    ],
    Education: [
      '📚 Tuition', '📝 Exams', '💻 Online Course', '📖 Books', '🖋️ Stationary',
      '🎓 Certifications', '📄 Print Out', '🏫 School Fees', '🎒 School Supplies', '📓 Notebooks',
      '✏️ Pens/Pencils', '📐 Geometry Box', '🖨️ Printing', '📱 Learning Apps', '👨‍🏫 Coaching',
      '🧑‍💻 Workshops', '📜 Study Material', '🗂️ Reference Books', '🎓 Exam Fees', '📚 Library Fees',
      '🎓 College Fees', '📚 Textbooks', '💻 Laptop for Study', '📱 Tablet', '🎒 School Bag',
      '🖥️ Software Courses', '🎓 Degree Fees', '🏆 Competition Fees', '📚 Language Course',
      '💻 Coding Bootcamp', '🎓 Seminar', '📚 Ebooks', '🧑‍🏫 Private Tutor', 'All'
    ],
    Savings: [
      '🏦 Bank Deposit', '📈 Investments', '💎 Assets', '🪙 Crypto', '💰 Cash Savings',
      '📊 Stocks', '💹 Mutual Funds', '🏅 Gold', '🏠 Property', '📉 Bonds',
      '💵 Fixed Deposit', '💳 SIP', '🏦 Recurring Deposit', '💼 PPF', '🔐 NSC',
      '🪙 NFT', '🌾 Commodities', '💱 Forex', '🏛️ Real Estate', '💎 Precious Metals',
      '💰 Emergency Fund', '👨‍💼 Retirement Fund', '👶 Child Education', '🏠 Home Downpayment',
      '💳 Credit Card Points', '🎁 Gift Cards', '🏦 Fixed Maturity Plan', '💼 EPF',
      '💰 Sovereign Gold Bonds', '📈 Index Funds', '🏦 Senior Citizen FD', 'All'
    ],
    Family: [
      '👨‍👩‍👧 Kids', '🎂 Celebrations', '🎁 Gifts', '👵👴 Elder Care', '👶 Baby Products',
      '🎉 Birthday Party', '💒 Wedding', '🎊 Anniversary', '🎈 Festivals', '🍰 Cake',
      '💐 Flowers', '🎀 Decorations', '👗 Family Clothing', '🧸 Toys', '📸 Photography',
      '🍽️ Family Dinner', '🏖️ Family Trip', '🎓 Education Support', '💊 Medical Care', '🏡 Home Improvement',
      '👨‍👩‍👧‍👦 Family Outing', '🎁 Diwali Gifts', '🎄 Christmas', '🕌 Eid', '🎊 Housewarming',
      '👨‍👩‍👧‍👦 School Trip', '👵👴 Medical', '👶 Diapers', '🍼 Baby Food', 'All'
    ],
    Other: [
      '🛠️ Miscellaneous', '💵 Charity', '🌱 Donations', '🎟️ Tickets', '🐕 Pet Care',
      '🐈 Pet Food', '🐾 Vet Visit', '🧼 Cleaning Supplies', '🧹 Household Items', '🔧 Tools',
      '🪴 Plants', '🌿 Gardening', '🎁 Random Gifts', '📮 Courier', '📦 Packaging',
      '🔑 Keys/Locks', '🚪 Home Decor', '🖼️ Paintings', '🕯️ Candles', '💡 Light Bulbs', 
      '💇 Haircut', '💅 Salon', '🚬 Smoking', '🍺 Alcohol', '🎰 Lottery',
      '📱 Repair', '👕 Laundry', '🧺 Dry Cleaning', '🚲 Bike Service', '🚗 Car Service',
      '🏠 Housekeeping', '🌸 Florist', '🎨 Interior Decor', 'All'
    ]
  };

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  let data = loadData('fin_spendly') || [];
  let showLimit = 6;
  let showAll = false;
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
  // HELPER: SYNC INCOME → POCKETCAL
  // Only for incomes with category "💵 Pocket Money"
  // ========================================
  function syncIncomeToPocketCal(entry) {
    try {
      if (entry.type !== 'income') return;
      if (entry.category !== '💵 Pocket Money') return;

      let pcData = loadData('fin_pocketcal') || [];

      // One entry per date for PocketCal
      pcData = pcData.filter(d => d.date !== entry.date);

      pcData.push({
        id: entry.id.toString(),
        date: entry.date,
        amount: Number(entry.amount),
        category: '💵 Pocket Money',
        notes: entry.notes || '',
        source: 'spendly'
      });

      saveData('fin_pocketcal', pcData);
    } catch (e) {
      console.error('Sync income to PocketCal error:', e);
    }
  }

  // When deleting income, also clear PocketCal entry for that date (if source=spendly)
  function deletePocketCalForSpendly(dateStr) {
    try {
      let pcData = loadData('fin_pocketcal') || [];
      const beforeLen = pcData.length;
      pcData = pcData.filter(d => !(d.date === dateStr && d.source === 'spendly'));
      if (pcData.length !== beforeLen) {
        saveData('fin_pocketcal', pcData);
      }
    } catch (e) {
      console.error('Delete PocketCal sync entry error:', e);
    }
  }

  // ========================================
  // CALCULATE TOTALS (with month income)
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

      // This month income
      const currentMonth = today.slice(0, 7);
      const monthIncome = data
        .filter(d => d.type === 'income' && d.date && d.date.startsWith(currentMonth))
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);
      
      const incomeEl = $('#totalIncome');
      const expenseEl = $('#totalExpense');
      const balanceEl = $('#balance');
      const monthIncomeEl = $('#monthIncome');
      
      if (incomeEl) incomeEl.textContent = fmt(totalIncome);
      if (expenseEl) expenseEl.textContent = fmt(totalExpense);
      if (balanceEl) balanceEl.textContent = fmt(balance);
      if (monthIncomeEl) monthIncomeEl.textContent = fmt(monthIncome);
      
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

        // SYNC to PocketCal if Pocket Money
        syncIncomeToPocketCal(entry);
        
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
          const oldEntry = { ...data[idx] };

          data[idx].date = $('#editDate').value;
          data[idx].amount = $('#editAmount').value;
          data[idx].category = $('#editCategory').value;
          data[idx].sub = $('#editSub').value;
          data[idx].notes = $('#editNotes').value;
          
          saveData('fin_spendly', data);

          // If it was or is a Pocket Money income, resync PocketCal entry
          if (oldEntry.type === 'income') {
            // clear old date mapping
            deletePocketCalForSpendly(oldEntry.date);
            // sync new version if category matches
            syncIncomeToPocketCal(data[idx]);
          }

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
      const tx = data.find(d => d.id === id);

      data = data.filter(d => d.id !== id);
      saveData('fin_spendly', data);

      // If this was pocket money income, remove from PocketCal
      if (tx && tx.type === 'income' && tx.category === '💵 Pocket Money') {
        deletePocketCalForSpendly(tx.date);
      }

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
  // ENHANCED PDF MODAL FUNCTIONS
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
  // PROFESSIONAL ENHANCED PDF GENERATION
  // ========================================
  window.generatePDF = function() {
    try {
      const { jsPDF } = window.jspdf;
      const { autoTable } = window.autotable;
      
      const selectedRange = document.querySelector('input[name="pdfRange"]:checked').value;
      
      let filteredData = [];
      let rangeText = '';
      const currentDate = new Date();
      
      if (selectedRange === 'today') {
        filteredData = data.filter(d => d.date === today);
        rangeText = `📅 Today - ${formatDate(today)}`;
      } else if (selectedRange === 'week') {
        const weekAgo = new Date(currentDate);
        weekAgo.setDate(currentDate.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        filteredData = data.filter(d => d.date >= weekAgoStr && d.date <= today);
        rangeText = `📊 Last 7 Days (${formatDate(weekAgoStr)} → ${formatDate(today)})`;
      } else if (selectedRange === 'month') {
        const currentMonth = today.slice(0, 7);
        filteredData = data.filter(d => d.date.startsWith(currentMonth));
        rangeText = `📈 This Month - ${formatMonthYear(currentMonth)}`;
      } else if (selectedRange === 'year') {
        const currentYear = today.slice(0, 4);
        filteredData = data.filter(d => d.date.startsWith(currentYear));
        rangeText = `📉 This Year - ${currentYear}`;
      } else if (selectedRange === 'custom') {
        const startDate = $('#pdfStartDate').value;
        const endDate = $('#pdfEndDate').value;
        
        if (!startDate || !endDate) {
          showSnackbar('Please select both start and end dates', 'error');
          return;
        }
        
        filteredData = data.filter(d => d.date >= startDate && d.date <= endDate);
        rangeText = `🎯 Custom Period: ${formatDate(startDate)} → ${formatDate(endDate)}`;
      }
      
      if (filteredData.length === 0) {
        showSnackbar('No transactions found for selected period', 'error');
        return;
      }
      
      const income = filteredData.filter(d => d.type === 'income').reduce((sum, d) => sum + Number(d.amount), 0);
      const expense = filteredData.filter(d => d.type === 'expense').reduce((sum, d) => sum + Number(d.amount), 0);
      const balance = income - expense;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // 🎨 ENHANCED HEADER WITH GRADIENT & LOGO
      // Background gradient
      const gradient = doc.linearGradient(0, 0, 0, 40, [
        [0.1, '#10b981'],
        [0.5, '#059669'],
        [1.0, '#047857']
      ]);
      doc.setFillColor(gradient);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Logo/Header
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('💰 SPENDLY', 20, 28, { charSpace: 0.5 });
      
      // Subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Professional Income & Expense Analytics', 20, 38);
      
      // Header line
      doc.setDrawColor(255, 255, 255, 0.3);
      doc.setLineWidth(1);
      doc.line(20, 45, pageWidth - 20, 45);
      
      let yPos = 65;
      
      // 📊 EXECUTIVE SUMMARY BOX
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, yPos, pageWidth - 40, 35, 8, 8, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(20, yPos, pageWidth - 40, 35, 8, 8, 'S');
      
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 EXECUTIVE SUMMARY', 30, yPos + 12);
      
      // Summary Cards - Enhanced Design
      const cardWidth = (pageWidth - 80) / 3;
      const cardHeight = 18;
      const cardStartX = 30;
      
      // INCOME CARD
      doc.setFillColor(34, 197, 94);
      doc.roundedRect(cardStartX, yPos + 18, cardWidth, cardHeight, 6, 6, 'F');
      doc.setFillColor(16, 185, 129, 0.1);
      doc.roundedRect(cardStartX + 2, yPos + 20, cardWidth - 4, cardHeight - 4, 4, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('INCOME', cardStartX + cardWidth/2, yPos + 27, { align: 'center' });
      doc.setFontSize(18);
      doc.text('₹' + fmtNum(income), cardStartX + cardWidth/2, yPos + 40, { align: 'center' });
      
      // EXPENSE CARD
      doc.setFillColor(239, 68, 68);
      doc.roundedRect(cardStartX + cardWidth + 8, yPos + 18, cardWidth, cardHeight, 6, 6, 'F');
      doc.setFillColor(220, 38, 38, 0.1);
      doc.roundedRect(cardStartX + cardWidth + 10, yPos + 20, cardWidth - 4, cardHeight - 4, 4, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('EXPENSE', cardStartX + cardWidth + 8 + cardWidth/2, yPos + 27, { align: 'center' });
      doc.setFontSize(18);
      doc.text('₹' + fmtNum(expense), cardStartX + cardWidth + 8 + cardWidth/2, yPos + 40, { align: 'center' });
      
      // BALANCE CARD
      const isPositive = balance >= 0;
      const balanceColor = isPositive ? [34, 197, 94] : [239, 68, 68];
      const balanceBg = isPositive ? [16, 185, 129, 0.15] : [220, 38, 38, 0.15];
      doc.setFillColor(...balanceColor);
      doc.roundedRect(cardStartX + (cardWidth + 8) * 2, yPos + 18, cardWidth, cardHeight, 6, 6, 'F');
      doc.setFillColor(...balanceBg);
      doc.roundedRect(cardStartX + (cardWidth + 8) * 2 + 2, yPos + 20, cardWidth - 4, cardHeight - 4, 4, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('BALANCE', cardStartX + (cardWidth + 8) * 2 + cardWidth/2, yPos + 27, { align: 'center' });
      doc.setFontSize(18);
      doc.text((isPositive ? '+ ' : '- ') + '₹' + fmtNum(Math.abs(balance)), cardStartX + (cardWidth + 8) * 2 + cardWidth/2, yPos + 40, { align: 'center' });
      
      yPos += 65;
      
      // 📋 PERIOD & METRICS INFO
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, yPos, pageWidth - 40, 22, 6, 6, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(20, yPos, pageWidth - 40, 22, 6, 6, 'S');
      
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.setFont('helvetica', 'normal');
      
      doc.text(rangeText, 30, yPos + 10);
      doc.text(`📅 Generated: ${formatDateTime(new Date())}`, 30, yPos + 17);
      doc.text(`📊 Total Transactions: ${filteredData.length}`, pageWidth - 60, yPos + 10, { align: 'right' });
      doc.text(`💹 Net Savings: ${isPositive ? '+' : ''}${fmtNum(balance)}`, pageWidth - 60, yPos + 17, { align: 'right' });
      
      yPos += 35;
      
      // 📈 TRANSACTION DETAILS TABLE - PROFESSIONAL
      doc.setFontSize(13);
      doc.setTextColor(17, 24, 39);
      doc.setFont('helvetica', 'bold');
      doc.text('📈 TRANSACTION DETAILS', 20, yPos);
      
      yPos += 8;
      
      const tableData = filteredData.slice().reverse().map(item => {
        const category = item.type === 'income' 
          ? item.category 
          : `${item.category} → ${item.sub}`;
        
        const emoji = item.type === 'income' ? '💰' : '💸';
        return [
          emoji,
          formatDate(item.date),
          item.type.toUpperCase(),
          category.substring(0, 35) + (category.length > 35 ? '...' : ''),
          '₹' + Number(item.amount).toFixed(0),
          item.notes ? item.notes.substring(0, 25) + (item.notes.length > 25 ? '...' : '') : '-'
        ];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['', 'Date', 'Type', 'Category', 'Amount', 'Notes']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center',
          lineWidth: 0.5,
          lineColor: [255, 255, 255]
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [55, 65, 81],
          lineWidth: 0.3,
          lineColor: [243, 244, 246]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12, fillColor: [249, 250, 251] },
          1: { halign: 'center', cellWidth: 25 },
          2: { halign: 'center', cellWidth: 18 },
          3: { halign: 'left', cellWidth: 55 },
          4: { halign: 'right', cellWidth: 25, fontStyle: 'bold' },
          5: { halign: 'left', cellWidth: 35 }
        },
        didParseCell: function(data) {
          if (data.column.index === 2 && data.section === 'body') {
            const type = data.cell.raw.toLowerCase();
            if (type === 'income') {
              data.cell.styles.textColor = [34, 197, 94];
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 253, 244];
            } else {
              data.cell.styles.textColor = [239, 68, 68];
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [254, 242, 242];
            }
          }
          
          if (data.column.index === 4 && data.section === 'body') {
            const rowType = tableData[data.row.index][2].toLowerCase();
            if (rowType === 'income') {
              data.cell.styles.textColor = [34, 197, 94];
            } else {
              data.cell.styles.textColor = [239, 68, 68];
            }
          }
        },
        margin: { top: 5, left: 20, right: 20 },
        didDrawPage: function(data) {
          // Enhanced Footer
          const footerY = pageHeight - 25;
          
          // Footer gradient line
          doc.setFillColor(34, 197, 94, 0.1);
          doc.rect(0, footerY - 5, pageWidth, 8, 'F');
          
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.setFont('helvetica', 'normal');
          
          const pageNum = `Page ${doc.internal.getCurrentPageInfo().pageNumber}`;
          doc.text(pageNum, pageWidth / 2, footerY, { align: 'center' });
          
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(34, 197, 94);
          doc.text('💰 SPENDLY', 20, footerY);
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('Developed by Imad Khan (@imxd12) | © 2025 Spendly Pro', pageWidth - 35, footerY, { align: 'right' });
        }
      });
      
      const finalY = doc.lastAutoTable.finalY;
      
      // 🎯 TOP CATEGORIES INSIGHTS (if space available)
      if (finalY < pageHeight - 80) {
        const categoryTotals = {};
        filteredData.filter(d => d.type === 'expense').forEach(d => {
          categoryTotals[d.category] = (categoryTotals[d.category] || 0) + Number(d.amount);
        });
        
        const sortedCategories = Object.entries(categoryTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6);
        
        if (sortedCategories.length > 0) {
          yPos = finalY + 20;
          
          // Insights Header
          doc.setFillColor(59, 130, 246);
          doc.roundedRect(20, yPos, pageWidth - 40, 28, 8, 8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('🎯 TOP SPENDING INSIGHTS', 30, yPos + 14);
          
          yPos += 32;
          
          const insightsData = sortedCategories.map(([cat, amt]) => [
            `📊 ${cat}`,
            '₹' + fmtNum(amt),
            `${((amt / expense) * 100).toFixed(1)}%`
          ]);
          
          autoTable(doc, {
            startY: yPos,
            head: [['Category', 'Amount', '% of Total']],
            body: insightsData,
            theme: 'striped',
            headStyles: {
              fillColor: [59, 130, 246],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 10
            },
            bodyStyles: {
              fontSize: 9.5,
              lineWidth: 0.5,
              lineColor: [229, 231, 235]
            },
            columnStyles: {
              0: { cellWidth: 90 },
              1: { halign: 'right', cellWidth: 40, fontStyle: 'bold' },
              2: { halign: 'center', cellWidth: 30 }
            },
            margin: { left: 20, right: 20 }
          });
        }
      }
      
      const filename = `Spendly_Pro_Report_${selectedRange}_${today.replace(/-/g, '')}.pdf`;
      doc.save(filename);
      
      closeModal('#pdfModal');
      showSnackbar('🏆 Professional PDF Report Downloaded! 📄✨', 'success');
      
    } catch (e) {
      console.error('Generate PDF error:', e);
      showSnackbar('Failed to generate PDF: ' + e.message, 'error');
    }
  };

  // ========================================
  // HELPER FUNCTIONS (Enhanced)
  // ========================================
  function fmtNum(num) {
    return Number(num).toLocaleString('en-IN', { 
      maximumFractionDigits: 0,
      minimumFractionDigits: 0 
    });
  }

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
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} • ${hours}:${minutes}`;
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
      
      console.log('✅ Spendly Pro initialized successfully with Enhanced PDF');
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
