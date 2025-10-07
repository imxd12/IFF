/* =========================
   SPENDLY - INCOME & EXPENSE TRACKER
========================= */

startClock('#timeNow');
attachBottomNav('nav-spend');

(function() {
  'use strict';

  // Extended categories with subcategories
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

  // Setup expense category dropdowns
  const expenseCategory = $('#expenseCategory');
  const expenseSub = $('#expenseSub');
  
  expenseCategory.innerHTML = Object.keys(categoryMap)
    .map(c => `<option value="${c}">${c}</option>`)
    .join('');

  function populateSubcategories() {
    const category = expenseCategory.value;
    expenseSub.innerHTML = categoryMap[category]
      .map(s => `<option value="${s}">${s}</option>`)
      .join('');
  }
  
  expenseCategory.addEventListener('change', populateSubcategories);
  populateSubcategories();

  // Data storage
  let data = loadData('fin_spendly') || [];
  let showLimit = 6;
  let showAll = false;
  let editingId = null;

  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  $('#incomeDate').value = today;
  $('#expenseDate').value = today;

  // Calculate totals
  function calcTotals() {
    const totalIncome = data
      .filter(d => d.type === 'income')
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);
    
    const totalExpense = data
      .filter(d => d.type === 'expense')
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);
    
    const balance = totalIncome - totalExpense;
    
    $('#totalIncome').textContent = fmt(totalIncome);
    $('#totalExpense').textContent = fmt(totalExpense);
    $('#balance').textContent = fmt(balance);
  }

  // Render transaction list
  function renderList(filter = '') {
    const list = $('#listSpend');
    const emptyState = $('#emptyState');
    list.innerHTML = '';
    
    const q = filter.toLowerCase();
    const selDate = $('#filterDate').value;
    
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
      emptyState.style.display = 'block';
      return;
    }
    
    emptyState.style.display = 'none';
    
    items.forEach((it, idx) => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.onclick = () => openEditModal(it.id);
      
      const displayCategory = it.type === 'income' ? it.category : `${it.category} - ${it.sub}`;
      
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
  }

  // Switch between income/expense forms
  window.switchType = function(type) {
    $$('.type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });
    
    $$('.transaction-form').forEach(form => {
      form.classList.toggle('active', form.id === `${type}Form`);
    });
  };

  // Handle income form submission
  $('#incomeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
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
    $('#incomeForm').reset();
    $('#incomeDate').value = today;
    
    calcTotals();
    renderList();
    showSnackbar('Income added successfully! 💰');
  });

  // Handle expense form submission
  $('#expenseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
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
    $('#expenseForm').reset();
    $('#expenseDate').value = today;
    populateSubcategories();
    
    calcTotals();
    renderList();
    showSnackbar('Expense added successfully! 💸');
  });

  // Quick Add Expense (FAB functionality)
  window.quickAddExpense = function() {
    switchType('expense');
    $('#expenseAmount').focus();
    window.scrollTo({ top: $('#expenseForm').offsetTop - 100, behavior: 'smooth' });
  };

  // Open edit modal
  function openEditModal(id) {
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
  }

  // Handle edit form submission
  $('#editForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
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
      closeModal('#editModal');
      showSnackbar('Transaction updated! ✅');
    }
  });

  // Delete transaction
  window.deleteTransaction = function() {
    if (!confirm('Delete this transaction?')) return;
    
    const id = Number($('#editId').value);
    data = data.filter(d => d.id !== id);
    
    saveData('fin_spendly', data);
    calcTotals();
    renderList();
    closeModal('#editModal');
    showSnackbar('Transaction deleted! 🗑️');
  };

  // Toggle show all
  window.toggleShowAll = function() {
    showAll = !showAll;
    $('#toggleText').textContent = showAll ? 'Show Less' : 'Show All';
    renderList($('#searchInput').value);
  };

  // Export to CSV
  window.exportToCSV = function() {
    if (data.length === 0) {
      showSnackbar('No data to export', 'error');
      return;
    }
    
    const headers = ['type', 'date', 'amount', 'category', 'sub', 'notes'];
    exportCSV(data, 'spendly-transactions.csv', headers);
  };

  // Import from JSON
  window.importFromJSON = function() {
    importJSON((imported) => {
      if (Array.isArray(imported)) {
        data = [...data, ...imported];
        saveData('fin_spendly', data);
        calcTotals();
        renderList();
      } else {
        showSnackbar('Invalid data format', 'error');
      }
    });
  };

  // Search functionality
  $('#searchInput').addEventListener('input', (e) => {
    renderList(e.target.value);
  });

  // Date filter
  $('#filterDate').addEventListener('change', () => {
    renderList($('#searchInput').value);
  });

  // Initialize
  calcTotals();
  renderList();

})();
