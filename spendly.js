/* =========================
   SPENDLY - COMPLETE LOGIC WITH CLEAN PDF EXPORT
   Income & Expense Tracker with Analytics - Professional PDF Reports
========================= */

// Initialize global functions (already defined elsewhere in your project)
startClock('#timeNow');

(function () {
  'use strict';

  // =========================
  // SMALL HELPERS
  // =========================
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  function loadData(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('loadData error:', e);
      return null;
    }
  }

  function saveData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('saveData error:', e);
    }
  }

  function fmt(num) {
    return Number(num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  // =========================
  // CATEGORY CONFIGURATION (same as original)
  // =========================
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
  }; // [file:1]

  // =========================
  // STATE
  // =========================
  let data = loadData('fin_spendly') || [];
  let showLimit = 6;
  let showAll = false;
  let charts = {};

  const expenseCategory = $('#expenseCategory');
  const expenseSub = $('#expenseSub');

  if (expenseCategory) {
    expenseCategory.innerHTML = Object.keys(categoryMap)
      .map((c) => `<option value="${c}">${c}</option>`)
      .join('');
  }

  function populateSubcategories() {
    if (!expenseCategory || !expenseSub) return;
    const cat = expenseCategory.value;
    expenseSub.innerHTML = categoryMap[cat]
      .map((s) => `<option value="${s}">${s}</option>`)
      .join('');
  }

  if (expenseCategory) {
    expenseCategory.addEventListener('change', populateSubcategories);
    populateSubcategories();
  }

  const today = new Date().toISOString().split('T')[0];
  const incomeDateEl = $('#incomeDate');
  const expenseDateEl = $('#expenseDate');
  if (incomeDateEl) incomeDateEl.value = today;
  if (expenseDateEl) expenseDateEl.value = today;

  // =========================
  // POCKETCAL SYNC
  // =========================
  function syncIncomeToPocketCal(entry) {
    try {
      if (entry.type !== 'income') return;
      if (entry.category !== '💵 Pocket Money') return;

      let pcData = loadData('fin_pocketcal') || [];
      pcData = pcData.filter((d) => d.date !== entry.date);

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

  function deletePocketCalForSpendly(dateStr) {
    try {
      let pcData = loadData('fin_pocketcal') || [];
      const beforeLen = pcData.length;
      pcData = pcData.filter((d) => !(d.date === dateStr && d.source === 'spendly'));
      if (pcData.length !== beforeLen) saveData('fin_pocketcal', pcData);
    } catch (e) {
      console.error('Delete PocketCal sync entry error:', e);
    }
  }

  // =========================
  // TOTALS
  // =========================
  function calcTotals() {
    try {
      const totalIncome = data
        .filter((d) => d.type === 'income')
        .reduce((s, d) => s + Number(d.amount || 0), 0);
      const totalExpense = data
        .filter((d) => d.type === 'expense')
        .reduce((s, d) => s + Number(d.amount || 0), 0);
      const balance = totalIncome - totalExpense;

      const currentMonth = today.slice(0, 7);
      const monthIncome = data
        .filter((d) => d.type === 'income' && d.date && d.date.startsWith(currentMonth))
        .reduce((s, d) => s + Number(d.amount || 0), 0);

      const incomeEl = $('#totalIncome');
      const expenseEl = $('#totalExpense');
      const balanceEl = $('#balance');
      const monthIncomeEl = $('#monthIncome');

      if (incomeEl) incomeEl.textContent = fmt(totalIncome);
      if (expenseEl) expenseEl.textContent = fmt(totalExpense);
      if (balanceEl) balanceEl.textContent = fmt(balance);
      if (monthIncomeEl) monthIncomeEl.textContent = fmt(monthIncome);

      const footerTransactions = $('#footerTransactions');
      if (footerTransactions) footerTransactions.textContent = data.length;

      return { totalIncome, totalExpense, balance };
    } catch (e) {
      console.error('Calculate totals error:', e);
      return { totalIncome: 0, totalExpense: 0, balance: 0 };
    }
  }

  // =========================
  // LIST
  // =========================
  function renderList(filter = '') {
    try {
      const list = $('#listSpend');
      const emptyState = $('#emptyState');
      if (!list) return;

      list.innerHTML = '';

      const q = filter.toLowerCase();
      const filterDateEl = $('#filterDate');
      const selDate = filterDateEl ? filterDateEl.value : '';

      let items = data
        .slice()
        .reverse()
        .filter((it) => {
          let match = true;
          if (q) {
            match =
              (it.notes || '').toLowerCase().includes(q) ||
              (it.category || '').toLowerCase().includes(q) ||
              (it.sub || '').toLowerCase().includes(q);
          }
          if (selDate) match = match && it.date === selDate;
          return match;
        });

      if (!showAll) items = items.slice(0, showLimit);

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

        const displayCategory =
          it.type === 'income' ? it.category : `${it.category} - ${it.sub}`;

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

  // =========================
  // CHARTS
  // =========================
  function renderCharts() {
    try {
      const totals = calcTotals();

      Object.values(charts).forEach((c) => c && c.destroy && c.destroy());
      charts = {};

      const incomeExpenseCanvas = $('#incomeExpenseChart');
      if (incomeExpenseCanvas && window.Chart) {
        charts.incomeExpense = new Chart(incomeExpenseCanvas, {
          type: 'doughnut',
          data: {
            labels: ['Income', 'Expense'],
            datasets: [
              {
                data: [totals.totalIncome, totals.totalExpense],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 2,
                borderColor: 'var(--bg)'
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
            }
          }
        });
      }

      const categoryCanvas = $('#categoryChart');
      if (categoryCanvas && window.Chart) {
        const categoryData = {};
        data
          .filter((d) => d.type === 'expense')
          .forEach((d) => {
            categoryData[d.category] = (categoryData[d.category] || 0) + Number(d.amount);
          });

        const sortedCategories = Object.entries(categoryData)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);

        charts.category = new Chart(categoryCanvas, {
          type: 'pie',
          data: {
            labels: sortedCategories.map((c) => c[0]),
            datasets: [
              {
                data: sortedCategories.map((c) => c[1]),
                backgroundColor: [
                  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
                  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
                ],
                borderWidth: 2,
                borderColor: 'var(--bg)'
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
                  font: { size: 11 }
                }
              }
            }
          }
        });
      }

      const trendCanvas = $('#trendChart');
      if (trendCanvas && window.Chart) {
        const monthlyData = {};
        data.forEach((d) => {
          const month = d.date.slice(0, 7);
          if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
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
                data: sortedMonths.map((m) => monthlyData[m].income),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
              },
              {
                label: 'Expense',
                data: sortedMonths.map((m) => monthlyData[m].expense),
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

  // =========================
  // SWITCH TYPE
  // =========================
  window.switchType = function (type) {
    try {
      $$('.type-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.type === type);
      });
      $$('.transaction-form').forEach((form) => {
        form.classList.toggle('active', form.id === `${type}Form`);
      });
    } catch (e) {
      console.error('Switch type error:', e);
    }
  };

  // =========================
  // ADD FORMS
  // =========================
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
        syncIncomeToPocketCal(entry);

        incomeForm.reset();
        if (incomeDateEl) incomeDateEl.value = today;

        calcTotals();
        renderList();
        renderCharts();
        showSnackbar('Income added successfully! 💰');
      } catch (e2) {
        console.error('Add income error:', e2);
        showSnackbar('Failed to add income', 'error');
      }
    });
  }

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
      } catch (e2) {
        console.error('Add expense error:', e2);
        showSnackbar('Failed to add expense', 'error');
      }
    });
  }

  // =========================
  // QUICK ADD EXPENSE
  // =========================
  window.quickAddExpense = function () {
    try {
      switchType('expense');
      const expenseAmountEl = $('#expenseAmount');
      if (expenseAmountEl) expenseAmountEl.focus();
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

  // =========================
  // EDIT / DELETE
  // =========================
  function openEditModal(id) {
    try {
      const item = data.find((d) => d.id === id);
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

  const editForm = $('#editForm');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const id = Number($('#editId').value);
        const idx = data.findIndex((d) => d.id === id);
        if (idx !== -1) {
          const oldEntry = { ...data[idx] };

          data[idx].date = $('#editDate').value;
          data[idx].amount = $('#editAmount').value;
          data[idx].category = $('#editCategory').value;
          data[idx].sub = $('#editSub').value;
          data[idx].notes = $('#editNotes').value;

          saveData('fin_spendly', data);

          if (oldEntry.type === 'income') {
            deletePocketCalForSpendly(oldEntry.date);
            syncIncomeToPocketCal(data[idx]);
          }

          calcTotals();
          renderList();
          renderCharts();
          closeModal('#editModal');
          showSnackbar('Transaction updated! ✅');
        }
      } catch (e2) {
        console.error('Edit transaction error:', e2);
        showSnackbar('Failed to update', 'error');
      }
    });
  }

  window.deleteTransaction = function () {
    if (!confirm('Delete this transaction? This cannot be undone.')) return;
    try {
      const id = Number($('#editId').value);
      const tx = data.find((d) => d.id === id);
      data = data.filter((d) => d.id !== id);
      saveData('fin_spendly', data);

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

  // =========================
  // TOGGLE SHOW ALL
  // =========================
  window.toggleShowAll = function () {
    try {
      showAll = !showAll;
      const toggleText = $('#toggleText');
      if (toggleText) toggleText.textContent = showAll ? 'Show Less' : 'Show All';
      const searchInput = $('#searchInput');
      renderList(searchInput ? searchInput.value : '');
    } catch (e) {
      console.error('Toggle show all error:', e);
    }
  };

  // =========================
  // PDF MODAL
  // =========================
  window.openPDFModal = function () {
    try {
      openModal('#pdfModal');
      const pdfStartDate = $('#pdfStartDate');
      const pdfEndDate = $('#pdfEndDate');
      if (pdfStartDate && !pdfStartDate.value) pdfStartDate.value = today;
      if (pdfEndDate && !pdfEndDate.value) pdfEndDate.value = today;

      const radios = document.querySelectorAll('input[name="pdfRange"]');
      radios.forEach((r) =>
        r.addEventListener('change', function () {
          const customRange = $('#customDateRange');
          if (customRange) {
            customRange.style.display = this.value === 'custom' ? 'block' : 'none';
          }
        })
      );
    } catch (e) {
      console.error('Open PDF modal error:', e);
    }
  };

  // =========================
  // PDF HELPERS
  // =========================
  function fmtNum(num) {
    return Number(num).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatMonthYear(monthStr) {
    const [year, month] = monthStr.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  }

  function formatDateTime(date) {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} • ${h}:${m}`;
  }

// =========================
// ULTRA CLEAN PROFESSIONAL PDF EXPORT
// =========================
window.generatePDF = function () {
  try {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      showSnackbar('jsPDF not loaded', 'error');
      return;
    }

    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const selectedRangeEl = document.querySelector('input[name="pdfRange"]:checked');
    const selectedRange = selectedRangeEl ? selectedRangeEl.value : 'today';

    let filteredData = [];
    let rangeText = '';
    const now = new Date();

    // ===== RANGE FILTER =====
    if (selectedRange === 'today') {
      filteredData = data.filter(d => d.date === today);
      rangeText = `Today • ${formatDate(today)}`;
    } else if (selectedRange === 'week') {
      const w = new Date();
      w.setDate(now.getDate() - 7);
      const ws = w.toISOString().split('T')[0];
      filteredData = data.filter(d => d.date >= ws && d.date <= today);
      rangeText = `Last 7 Days • ${formatDate(ws)} → ${formatDate(today)}`;
    } else if (selectedRange === 'month') {
      const m = today.slice(0, 7);
      filteredData = data.filter(d => d.date.startsWith(m));
      rangeText = `Month • ${formatMonthYear(m)}`;
    } else if (selectedRange === 'year') {
      const y = today.slice(0, 4);
      filteredData = data.filter(d => d.date.startsWith(y));
      rangeText = `Year • ${y}`;
    } else {
      const s = $('#pdfStartDate').value;
      const e = $('#pdfEndDate').value;
      filteredData = data.filter(d => d.date >= s && d.date <= e);
      rangeText = `Custom • ${formatDate(s)} → ${formatDate(e)}`;
    }

    if (filteredData.length === 0) {
      showSnackbar('No transactions', 'error');
      return;
    }

    const income = filteredData
      .filter(d => d.type === 'income')
      .reduce((s, d) => s + Number(d.amount), 0);

    const expense = filteredData
      .filter(d => d.type === 'expense')
      .reduce((s, d) => s + Number(d.amount), 0);

    const balance = income - expense;

    let y = 0;

    // =========================
    // HEADER BAR
    // =========================
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('SPENDLY FINANCIAL REPORT', pageWidth / 2, 14, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Income & Expense Statement', pageWidth / 2, 21, { align: 'center' });

    y = 34;

    // =========================
    // PERIOD BOX
    // =========================
    doc.setDrawColor(200);
    doc.roundedRect(12, y, pageWidth - 24, 18, 3, 3);

    doc.setFontSize(9);
    doc.setTextColor(40);
    doc.text(rangeText, 16, y + 7);
    doc.text(`Generated: ${formatDateTime(now)}`, 16, y + 13);

    doc.text(`Transactions: ${filteredData.length}`, pageWidth - 16, y + 7, { align: 'right' });

    y += 26;

    // =========================
    // SUMMARY CARDS
    // =========================
    const cardW = (pageWidth - 32) / 3;

    function drawCard(x, title, value, color) {
      doc.setDrawColor(220);
      doc.roundedRect(x, y, cardW, 20, 3, 3);

      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text(title, x + 4, y + 7);

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...color);
      doc.text(`₹ ${fmtNum(value)}`, x + 4, y + 15);
    }

    drawCard(12, 'Income', income, [22, 163, 74]);
    drawCard(16 + cardW, 'Expense', expense, [220, 38, 38]);
    drawCard(20 + cardW * 2, balance >= 0 ? 'Savings' : 'Loss', Math.abs(balance), balance >= 0 ? [37, 99, 235] : [220, 38, 38]);

    y += 30;

    // =========================
    // TRANSACTION TABLE
    // =========================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text('Transactions', 12, y);

    y += 4;

    const rows = filteredData.slice().reverse().map(d => {
      const cat = d.type === 'income'
        ? d.category
        : `${d.category} - ${d.sub}`;

      return [
        formatDate(d.date),
        d.type.toUpperCase(),
        cat,
        `₹ ${fmtNum(d.amount)}`
      ];
    });

    doc.autoTable({
      startY: y,
      head: [['Date', 'Type', 'Category', 'Amount']],
      body: rows,
      theme: 'grid',

      headStyles: {
        fillColor: [22, 163, 74],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },

      bodyStyles: {
        fontSize: 9,
        textColor: 40
      },

      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },

      columnStyles: {
        0: { cellWidth: 28, halign: 'center' },
        1: { cellWidth: 24, halign: 'center' },
        2: { cellWidth: 78 },
        3: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
      },

      didParseCell: function (cell) {
        if (cell.section === 'body' && cell.column.index === 1) {
          if (cell.cell.raw === 'INCOME') {
            cell.cell.styles.textColor = [22, 163, 74];
          } else {
            cell.cell.styles.textColor = [220, 38, 38];
          }
        }
      },

      didDrawPage: function () {
        const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
      }
    });

    // =========================
    // TOTAL ROW
    // =========================
    const finalY = doc.lastAutoTable.finalY + 4;

    doc.setDrawColor(180);
    doc.line(12, finalY, pageWidth - 12, finalY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL EXPENSE', pageWidth - 60, finalY + 6);

    doc.setTextColor(220, 38, 38);
    doc.text(`₹ ${fmtNum(expense)}`, pageWidth - 12, finalY + 6, { align: 'right' });

    // =========================
    // CATEGORY INSIGHTS
    // =========================
    let iy = finalY + 16;

    const catTotals = {};
    filteredData
      .filter(d => d.type === 'expense')
      .forEach(d => {
        catTotals[d.category] = (catTotals[d.category] || 0) + Number(d.amount);
      });

    const top = Object.entries(catTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (top.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(37, 99, 235);
      doc.text('Top Expense Categories', 12, iy);

      const body = top.map(([c, a]) => [
        c,
        `₹ ${fmtNum(a)}`,
        expense > 0 ? ((a / expense) * 100).toFixed(1) + '%' : '0%'
      ]);

      doc.autoTable({
        startY: iy + 3,
        head: [['Category', 'Amount', '%']],
        body,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'center' }
        }
      });
    }

    // =========================
    // SAVE
    // =========================
    const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    doc.save(`Spendly_Report_${stamp}.pdf`);

    closeModal('#pdfModal');
    showSnackbar('PDF generated ✔', 'success');

  } catch (e) {
    console.error(e);
    showSnackbar('PDF failed: ' + e.message, 'error');
  }
};

  // =========================
  // CSV / JSON
  // =========================
  window.exportToCSV = function () {
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

  window.importFromJSON = function () {
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

  // =========================
  // CLEAR ALL
  // =========================
  window.clearAllData = function () {
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

  // =========================
  // SEARCH & DATE FILTER
  // =========================
  function debounce(fn, delay) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  const searchInput = $('#searchInput');
  if (searchInput) {
    searchInput.addEventListener(
      'input',
      debounce((e) => {
        renderList(e.target.value);
      }, 300)
    );
  }

  const filterDate = $('#filterDate');
  if (filterDate) {
    filterDate.addEventListener('change', () => {
      renderList(searchInput ? searchInput.value : '');
    });
  }

  // =========================
  // INIT
  // =========================
  function init() {
    try {
      calcTotals();
      renderList();
      setTimeout(renderCharts, 100);
      console.log('✅ Spendly initialized with clean PDF export');
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
      setTimeout(renderCharts, 100);
    }
  });
})();
