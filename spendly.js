startClock('#timeNow');
attachBottomNav('nav-spend');

(function(){
    // Enhanced Subcategories with Emojis for Spendly
const categoryMap = {
  Food: [
    '🍳 Breakfast',
    '🥪 Lunch',
    '🍝 Dinner',
    '🍿 Snacks',
    '☕ Beverages',
    '🍰 Desserts',
    '🛒 Groceries',
    'All'
  ],
  Travel: [
    '🚌 Bus',
    '🚗 Taxi / Ride-share',
    '🚖 Local Transport',
    '✈️ Flights',
    '🚆 Train / Intercity',
    '⛴️ Ferry / Boat',
    '🛣️ Fuel / Petrol',
    'All'
  ],
  Rent: [
    '🏠 House Rent',
    '📱 Mobile Recharge',
    '💡 Utilities (Electricity, Water)',
    '🌐 Internet / WiFi',
    '🏢 Office / Workspace',
    'All'
  ],
  Shopping: [
    '👕 Clothes',
    '👗 Fashion / Accessories',
    '🛍️ Online Shopping',
    '📺 Electronics / Gadgets',
    '🛒 Groceries',
    '🎁 Gifts',
    '✏️ Stationary',
    'All'
  ],
  Bills: [
    '💡 Electricity',
    '🌊 Water',
    '🌐 Internet / WiFi',
    '📞 Phone / Landline',
    '📺 Cable / OTT',
    '🧾 Insurance / Subscriptions',
    'All'
  ],
  Health: [
    '💊 Medicines',
    '🩺 Doctor / Clinic',
    '🏋️‍♂️ Gym / Fitness',
    '🦷 Dental',
    '💆‍♀️ Spa / Wellness',
    'All'
  ],
  Entertainment: [
    '🎬 Movies / OTT',
    '🎮 Games',
    '🎵 Music / Events',
    '📚 Books / Magazines',
    '🎤 Concerts / Shows',
    'All'
  ],
  Education: [
    '📚 Tuition / Classes',
    '📝 Exams / Fees',
    '💻 Online Courses',
    '📖 Books / Materials',
    'All'
  ],
  Other: [
    '🛠️ Miscellaneous',
    '🎁 Gifts',
    '💵 Donations / Charity',
    'All'
  ]
};

  const expenseCategory = $('#expenseCategory');
  const expenseSub = $('#expenseSub');
  function populateSub(){ expenseSub.innerHTML = categoryMap[expenseCategory.value].map(s=> `<option>${s}</option>`).join(''); }
  expenseCategory.onchange = populateSub;
  populateSub();

  // Data storage
  let data = loadData('fin_spendly') || [];

  // Totals
  function calcTotals(){
    const totalIncome = data.filter(d=>d.type==='income').reduce((a,b)=>a+Number(b.amount||0),0);
    const totalExpense = data.filter(d=>d.type==='expense').reduce((a,b)=>a+Number(b.amount||0),0);
    $('#totalIncome').textContent = fmt(totalIncome);
    $('#totalExpense').textContent = fmt(totalExpense);
    $('#balance').textContent = fmt(totalIncome-totalExpense);
  }

  // Render list
  let showLimit = 6;
  function renderList(filter=''){
    const list = $('#listSpend'); list.innerHTML='';
    const items = data.slice().reverse().filter(it=>{
      if(!filter) return true;
      const q = filter.toLowerCase();
      return (it.notes||'').toLowerCase().includes(q) || (it.category||'').toLowerCase().includes(q) || (it.sub||'').toLowerCase().includes(q);
    }).slice(0, showLimit);

    items.forEach(it=>{
      const li = document.createElement('li'); li.className='list-item';
      li.innerHTML = `<div>
        <div style="font-weight:700">${it.type==='expense' ? '- ' + fmt(it.amount) : '+ ' + fmt(it.amount)} • ${it.category||''} / ${it.sub||''}</div>
        <div class="meta">${it.date} • ${it.notes||''}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <div>
          <button class="btn" data-id="${it.id}" data-action="edit">Edit</button>
          <button class="btn" data-id="${it.id}" data-action="del">Delete</button>
        </div>
      </div>`;
      list.appendChild(li);
    });
    calcTotals();
    updateCharts();
  }

  // Add Income
  $('#btnAddIncome').onclick = () => {
    const amt = Number($('#incomeAmount').value||0);
    const date = $('#incomeDate').value || new Date().toISOString().split('T')[0];
    const notes = $('#incomeNotes').value;
    if(!amt || amt<=0) return alert('Enter amount');
    data.push({id:Date.now().toString(), type:'income', amount:amt, date, notes});
    saveData('fin_spendly', data);
    snack('Income added');
    $('#incomeAmount').value=''; $('#incomeNotes').value=''; $('#incomeDate').value='';
    renderList($('#searchSpend').value);
  };

  // Add Expense
  $('#btnAddExpense').onclick = () => {
    const amt = Number($('#expenseAmount').value||0);
    const category = $('#expenseCategory').value;
    const sub = $('#expenseSub').value;
    const date = $('#expenseDate').value || new Date().toISOString().split('T')[0];
    const notes = $('#expenseNotes').value;
    if(!amt || amt<=0) return alert('Enter amount');
    data.push({id:Date.now().toString(), type:'expense', amount:amt, category, sub, date, notes});
    saveData('fin_spendly', data);
    snack('Expense added');
    $('#expenseAmount').value=''; $('#expenseNotes').value=''; $('#expenseDate').value='';
    renderList($('#searchSpend').value);
  };

  // Search
  $('#searchSpend').oninput = e => { showLimit=6; renderList(e.target.value); };

  // Edit/Delete
  $('#listSpend').onclick = e => {
    const btn = e.target.closest('button'); if(!btn) return;
    const id = btn.dataset.id; const action = btn.dataset.action;
    const idx = data.findIndex(d=>d.id===id); if(idx<0) return;
    const it = data[idx];
    if(action==='del'){ if(confirm('Delete entry?')){ data.splice(idx,1); saveData('fin_spendly',data); renderList($('#searchSpend').value); snack('Deleted'); } }
    else if(action==='edit'){
      if(it.type==='income'){
        $('#incomeAmount').value=it.amount; $('#incomeDate').value=it.date; $('#incomeNotes').value=it.notes;
      } else {
        $('#expenseAmount').value=it.amount; $('#expenseDate').value=it.date; $('#expenseNotes').value=it.notes;
        $('#expenseCategory').value=it.category; populateSub(); $('#expenseSub').value=it.sub;
      }
      data.splice(idx,1); saveData('fin_spendly', data);
    }
  };

  // Charts
  function updateCharts(){
    const barC = $('#barChart'); const pieC = $('#pieChart');
    const last = data.slice().reverse().slice(0,12);
    const labels = last.map(i=>i.date.slice(5));
    const values = last.map(i=> i.type==='income'? i.amount : -i.amount);
    drawBar(barC, labels, values.map(v=>Math.abs(v)));
    const map={}; data.forEach(i=>{ if(i.type==='expense'){ map[i.category]=(map[i.category]||0)+i.amount; } });
    drawPie(pieC,map);
  }

  renderList();

})();

