startClock('#timeNow');
attachBottomNav('nav-spend');

(function(){
  // Extended categories with emojis
const categoryMap = {
  Food: ['🍳 Breakfast','🥪 Lunch','🍝 Dinner','🍿 Snacks','☕ Beverages','🍰 Desserts','🛒 Groceries','All'],
  Travel: ['🚌 Bus','🚗 Taxi','🚖 Local Transport','✈️ Flights','🚆 Train','⛴️ Ferry','🛣️ Fuel','All'],
  Rent: ['🏠 House Rent','📱 Mobile Recharge','💡 Utilities','🌐 Internet','🏢 Workspace','All'],
  Shopping: ['👕 Clothes','👗 Fashion','🛍️ Online','📺 Electronics','🎁 Gifts','🖊️ Stationary','All'], // added Stationary
  Bills: ['💡 Electricity','🌊 Water','🌐 WiFi','📞 Phone','📺 OTT','🧾 Insurance','🎫 Railway Pass','All'], // added Railway Pass
  Health: ['💊 Medicines','🩺 Doctor','🏋️‍♂️ Gym','🦷 Dental','💆 Spa','All'],
  Entertainment: ['🎬 Movies','🎮 Games','🎵 Music','📚 Books','🎤 Shows','All'],
  Education: ['📚 Tuition','📝 Exams','💻 Online Course','📖 Books','All'],
  Savings: ['🏦 Bank Deposit','📈 Investments','💎 Assets','All'],
  Family: ['👨‍👩‍👧 Kids','🎂 Celebrations','🎁 Gifts','All'],
  Other: ['🛠️ Miscellaneous','💵 Charity','All']
};

  const expenseCategory = $('#expenseCategory');
  const expenseSub = $('#expenseSub');

  // Fill category dropdown
  expenseCategory.innerHTML = Object.keys(categoryMap).map(c=>`<option value="${c}">${c}</option>`).join('');
  function populateSub(){ expenseSub.innerHTML = categoryMap[expenseCategory.value].map(s=> `<option>${s}</option>`).join(''); }
  expenseCategory.onchange = populateSub;
  populateSub();

  // Data storage
  let data = loadData('fin_spendly') || [];
  let showLimit = 6;
  let showAll = false;

  // Totals
  function calcTotals(){
    const totalIncome = data.filter(d=>d.type==='income').reduce((a,b)=>a+Number(b.amount||0),0);
    const totalExpense = data.filter(d=>d.type==='expense').reduce((a,b)=>a+Number(b.amount||0),0);
    $('#totalIncome').textContent = fmt(totalIncome);
    $('#totalExpense').textContent = fmt(totalExpense);
    $('#balance').textContent = fmt(totalIncome-totalExpense);
  }

  // Render list
  function renderList(filter=''){
    const list = $('#listSpend'); list.innerHTML='';
    const q = filter.toLowerCase();
    const selDate = $('#filterDate').value;

    let items = data.slice().reverse().filter(it=>{
      let match = true;
      if(q){
        match = (it.notes||'').toLowerCase().includes(q) || (it.category||'').toLowerCase().includes(q) || (it.sub||'').toLowerCase().includes(q);
      }
      if(selDate){ match = match && it.date===selDate; }
      return match;
    });

    if(!showAll){ items = items.slice(0, showLimit); }

    items.forEach(it=>{
      const li = document.createElement('li'); li.className='list-item';
      li.innerHTML = `<div>
        <div style="font-weight:700">${it.type==='expense' ? '- ' + fmt(it.amount) : '+ ' + fmt(it.amount)} • ${it.category||''} / ${it.sub||''}</div>
        <div class="meta">${it.date} • ${it.notes||''}</div>
      </div>
      <div>
        <button class="btn" data-id="${it.id}" data-action="edit">Edit</button>
        <button class="btn" data-id="${it.id}" data-action="del">Delete</button>
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
  $('#searchSpend').oninput = e => { renderList(e.target.value); };

  // Date filter
  $('#filterDate').onchange = ()=> renderList($('#searchSpend').value);

  // See All button
  $('#btnSeeAll').onclick = ()=>{
    showAll = !showAll;
    $('#btnSeeAll').textContent = showAll ? "Show Less" : "See All";
    renderList($('#searchSpend').value);
  };

  // Edit/Delete
  $('#listSpend').onclick = e => {
    const btn = e.target.closest('button'); if(!btn) return;
    const id = btn.dataset.id; const action = btn.dataset.action;
    const idx = data.findIndex(d=>d.id===id); if(idx<0) return;
    const it = data[idx];
    if(action==='del'){
      if(confirm('Delete entry?')){ data.splice(idx,1); saveData('fin_spendly',data); renderList($('#searchSpend').value); snack('Deleted'); }
    } else if(action==='edit'){
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
