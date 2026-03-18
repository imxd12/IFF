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
  Travel: [
    '🛺 Rickshaw', '🚍 BEST Bus', '🚌 Luxury Bus', '🚗 Taxi', '🚖 Local Transport', '🚇 Metro',
    '🚆 Train', '🚕 Ola/Uber', '🛵 Bike Petrol', '⛽ Fuel',
    '🅿️ Parking', '🛤️ Toll', '🎫 Monthly Pass',
    '🚶 Walking', '🚲 Bicycle',
    '🏫 College Travel', '💼 Office Travel',
    '🏖️ Trip', '🏠 Native Travel', 'All'
  ],

  Food: [
    '🍳 Breakfast', '🥪 Lunch', '🍛 Dinner',
    '🍿 Snacks', '☕ Tea/Chai', '🥤 Cold Drinks', '🥤 Juice',
    '🍲 Home Food', '🍔 Outside Food', '🥙 Street Food',
    '🛒 Groceries', '🥬 Vegetables', '🍎 Fruits',
    '🥛 Milk', '🍞 Bread', '🥚 Eggs',
    '🍗 Chicken', '🍛 Biryani', '🍕 Pizza',
    '🥘 Tiffin', '🍱 Mess Food', 'All'
  ],

  Rent: [
    '🏠 House Rent', '🏡 PG/Hostel', '🏢 Room Rent',
    '💡 Electricity Bill', '💧 Water Bill', '🔥 Gas Cylinder',
    '🌐 Internet/WiFi', '📱 Mobile Recharge',
    '🏘️ Society Maintenance',
    '🛠️ Repairs', '🧹 Cleaning',
    '📺 Cable/DTH', 'All'
  ],

  Shopping: [
    '👕 Clothes', '👟 Shoes', '🧢 Daily Wear','🧼 Soap', '🪥 Toothpaste', '🧻 Tissue',
    '🧴 Shampoo', '🪒 Razor',
    '🎒 College Items', '🖊️ Stationary',
    '📱 Mobile', '🔌 Accessories', '💻 Laptop',
    '🛍️ Online Shopping', '🏪 Local Market',
    '🧴 Personal Care', '💄 Cosmetics',
    '🪑 Home Items', 'All'
  ],

  Bills: [
    '📱 Mobile Recharge', '🚆 Railway Pass',
    '💡 Electricity',
    '📶 Data Pack', '💻 Software',
    '🏦 Bank Charges', '💳 Late Fees',
    '🌊 Water', '🌐 WiFi',
    '📺 OTT', '🎬 Netflix/Prime',
    '💳 Credit Card Bill', '🏦 Loan EMI',
    '🏋️ Gym Membership',
    '🧾 Insurance', 'All'
  ],

  Health: [
    '💊 Medicines', '🧴 Skin Care',
    '🩺 Doctor Visit','🧠 Mental Therapy', '🧂 ORS',
    '💉 Injection', '🩺 Checkup',
    '🏥 Hospital', '🦷 Dental',
    '🧘 Yoga', '🏋️ Gym',
    '🧪 Tests', '💊 Pharmacy',
    '🩹 First Aid', 'All'
  ],

  Entertainment: [
    '🎬 Movies', '🎮 Games', '🎵 Music',
    '🎥 YouTube Premium',
    '🎮 Mobile Games', '🎧 Spotify',
    '📚 Comics',
    '🍿 Outing', '🎡 Fun Activities',
    '🎂 Party', '📺 TV Shows',
    '📱 Mobile Apps', '🎧 Subscriptions',
    'All'
  ],

  Education: [
    '📚 Books', '🖊️ Stationary',
    '🧾 Xerox', '🖨️ Printouts', '📓 Notes',
    '🏫 College Fees', '📝 Exam Fees',
    '💻 Online Course', '📱 Learning Apps',
    '🧑‍🏫 Coaching Classes',
    '📘 Guides', '📗 Reference Books',
    '🧮 Calculator', '📏 Scale',
    '📐 Drawing Items', '🧑‍💻 Coding Course',
    '📊 Project Work', '📂 Files',
    '🖊️ Extra Pens', '🎓 Seminar Fees',
    'All'
  ],

  Savings: [
    '🏦 Bank Saving', '💰 Cash Saving',
    '📈 Mutual Funds', '📊 Stocks',
    '💳 SIP', '🏅 Gold',
    '💼 PF', '🏠 Future Saving',
    '🚨 Emergency Fund', 'All'
  ],

  Family: [
    '🍛 Family Food', '🎁 Gifts',
    '🎉 Festivals', '🕌 Eid', '🪔 Diwali',
    '🎂 Birthday', '👶 Kids',
    '👵 Medical Care',
    '🏠 Home Needs', 'All'
  ],

  Other: [
    '💇 Haircut', '💅 Salon',
    '🧼 Cleaning Items', '🧹 House Items',
    '📦 Courier', '📱 Repair',
    '🚗 Vehicle Service', '🏍️ Bike Service',
    '💵 Charity', '🎟️ Tickets',
    '🚬 Smoking', '🍺 Alcohol',
    'All'
  ]
};

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

window.generatePDF = function () {
  try {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      showSnackbar('jsPDF not loaded', 'error');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const now = new Date();
    let y = 20;

    // =========================
    // 🌿 BACKGROUND WATER EFFECT
    // =========================
    doc.setFillColor(240, 253, 244); // very light green
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // =========================
    // 💧 HEADER (GRADIENT STYLE)
    // =========================
    doc.setFillColor(16, 185, 129); // emerald
    doc.roundedRect(10, 10, pageWidth - 20, 18, 4, 4, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('POCKET MONEY BANK', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(9);
    doc.text('Savings Account Passbook Statement', pageWidth / 2, 23, { align: 'center' });

    y = 35;

    // =========================
    // 🌿 ACCOUNT GLASS CARD
    // =========================
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.roundedRect(12, y, pageWidth - 24, 24, 3, 3, 'FD');

    doc.setTextColor(0);
    doc.setFontSize(9);

// Get username from localStorage
let username = localStorage.getItem('fin_userName') || 'User';

// Optional: Capitalize nicely
username = username.replace(/\b\w/g, c => c.toUpperCase());

// Label
doc.setFont('helvetica', 'normal');
doc.text('Account Holder:', 14, y + 7);

// Value (dynamic 🔥)
doc.setFont('helvetica', 'bold');
doc.text(username, 50, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.text('Account No:', 120, y + 7);
    doc.text('532377734', 160, y + 7);

    doc.text('Branch:', 14, y + 14);
    doc.text('Mumbai Branch', 50, y + 14);

    doc.text('IFSC:', 120, y + 14);
    doc.text('IMXD00000012', 160, y + 14);

    doc.text('Generated:', 14, y + 21);
    doc.text(now.toLocaleString('en-IN'), 50, y + 21);

    y += 32;

    // =========================
    // FILTER DATA (same)
    // =========================
    const selectedRangeEl = document.querySelector('input[name="pdfRange"]:checked');
    const selectedRange = selectedRangeEl ? selectedRangeEl.value : 'today';

    let filteredData = [];
    let rangeText = '';
    const todayDate = today;

    if (selectedRange === 'today') {
      filteredData = data.filter(d => d.date === todayDate);
      rangeText = `Today`;
    } else if (selectedRange === 'week') {
      const w = new Date();
      w.setDate(now.getDate() - 7);
      const ws = w.toISOString().split('T')[0];
      filteredData = data.filter(d => d.date >= ws && d.date <= todayDate);
      rangeText = `Last 7 Days`;
    } else if (selectedRange === 'month') {
      const m = todayDate.slice(0, 7);
      filteredData = data.filter(d => d.date.startsWith(m));
      rangeText = `Month`;
    } else {
      filteredData = data;
      rangeText = `All Records`;
    }

    if (!filteredData.length) {
      showSnackbar('No transactions', 'error');
      return;
    }

    // =========================
    // PASSBOOK ROWS
    // =========================
    let balance = 0;

    const rows = filteredData.map(d => {
      const amt = Number(d.amount);

      let debit = '';
      let credit = '';

      if (d.type === 'expense') {
        debit = amt.toFixed(2);
        balance -= amt;
      } else {
        credit = amt.toFixed(2);
        balance += amt;
      }

      return [
        formatDate(d.date),
        (d.category || 'Pocket Money') + (d.sub ? ' - ' + d.sub : ''),
        debit ? `₹ ${debit}` : '-',
        credit ? `₹ ${credit}` : '-',
        `₹ ${balance.toFixed(2)}`
      ];
    });

    // =========================
    // 🌿 SECTION TITLE
    // =========================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text(`Statement: ${rangeText}`, 12, y);

    y += 4;

    // =========================
    // 💧 TABLE (PREMIUM STYLE)
    // =========================
    doc.autoTable({
      startY: y,
      head: [['Date', 'Particulars', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)']],
      body: rows,

      theme: 'grid',

      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        overflow: 'linebreak',
        valign: 'middle'
      },

      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },

      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 'auto' },
        2: { halign: 'right', cellWidth: 28 },
        3: { halign: 'right', cellWidth: 28 },
        4: { halign: 'right', cellWidth: 32 }
      },

      alternateRowStyles: {
        fillColor: [236, 253, 245] // light mint rows
      },

      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 2) {
          data.cell.styles.textColor = [220, 38, 38];
        }
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = [22, 163, 74];
        }
      },

      didDrawPage: function () {
        doc.setFontSize(8);
        doc.setTextColor(120);

        doc.text(
          'This is a system-generated passbook statement.',
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );

        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
          pageWidth - 12,
          pageHeight - 10,
          { align: 'right' }
        );
      }
    });

    // =========================
    // 🌿 SUMMARY GLASS BOX
    // =========================
    let finalY = doc.lastAutoTable.finalY + 8;

    let totalCredit = filteredData
      .filter(d => d.type === 'income')
      .reduce((s, d) => s + Number(d.amount), 0);

    let totalDebit = filteredData
      .filter(d => d.type === 'expense')
      .reduce((s, d) => s + Number(d.amount), 0);

    doc.setFillColor(220, 252, 231);
    doc.roundedRect(12, finalY, pageWidth - 24, 20, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);

    doc.text(`Total Credit: ₹ ${fmtNum(totalCredit)}`, 16, finalY + 8);
    doc.text(`Total Debit: ₹ ${fmtNum(totalDebit)}`, 16, finalY + 15);

// Label
doc.setTextColor(100);
doc.setFont('helvetica', 'normal');
doc.text('Closing Balance:', pageWidth - 70, finalY + 11);

// Amount (highlighted)
doc.setTextColor(16, 185, 129);
doc.setFont('helvetica', 'bold');
doc.text(
  `₹ ${fmtNum(totalCredit - totalDebit)}`,
  pageWidth - 14,
  finalY + 11,
  { align: 'right' }
);

    // =========================
    // SAVE
    // =========================
    const stamp = now.toISOString().split('T')[0];
    doc.save(`Passbook_${stamp}.pdf`);

    closeModal('#pdfModal');
    showSnackbar('Passbook PDF Ready ✔', 'success');

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

