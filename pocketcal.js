startClock('#timeNow');
attachBottomNav('nav-pocket');

(function(){
  let data = loadData('fin_pocketcal') || []; 
  const grid = $('#calendarGrid'); 
  const monthLabel = $('#calMonth');
  let current = new Date(); 
  current.setDate(1);

  let selectedDate = null;

  function renderCalendar(){
    grid.innerHTML = '';
    const year = current.getFullYear(); 
    const month = current.getMonth();
    monthLabel.textContent = current.toLocaleString(undefined, {month:'long', year:'numeric'});
    const firstDay = new Date(year, month, 1).getDay();
    const daysIn = new Date(year, month+1,0).getDate();

    // Blank cells
    for(let i=0;i<firstDay;i++) {
      const d = document.createElement('div'); 
      d.className='day'; 
      grid.appendChild(d);
    }

    // Days
    for(let i=1;i<=daysIn;i++){
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      const entry = data.find(d=>d.date===dateStr);
      const d = document.createElement('div'); 
      d.className='day';
      d.innerHTML = `<div class="date-num">${i}</div><div class="amount">${entry ? fmt(entry.amount) : ''}</div>`;
      if(entry) d.classList.add('has-entry');
      d.onclick = ()=> openModal(dateStr, entry);
      grid.appendChild(d);
    }
    updateTotals();
  }

  function updateTotals(){
    const all = data.reduce((a,b)=>a+Number(b.amount||0),0);
    $('#pcAll').textContent = fmt(all);
    const currentMonthStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
    const monthTotal = data.filter(d => d.date.startsWith(currentMonthStr))
                           .reduce((a,b)=>a+Number(b.amount||0),0);
    $('#pcMonth').textContent = fmt(monthTotal);
  }

  // Modal Handling
  function openModal(dateStr, entry){
    selectedDate = dateStr;
    $('#pcDate').value = dateStr;
    $('#pcAmount').value = entry ? entry.amount : '';
    $('#pcNotes').value = entry ? entry.notes : '';
    $('#pcDelete').style.display = entry ? 'inline-block' : 'none';
    $('#modalTitle').textContent = entry ? 'Edit Entry' : 'Add Entry';
    $('#entryModal').classList.remove('hidden');
  }
  function closeModal(){
    $('#entryModal').classList.add('hidden');
    selectedDate = null;
  }

  // Save Entry
  $('#pcSave').onclick = () => {
    const date = $('#pcDate').value;
    const amount = Number($('#pcAmount').value||0);
    const notes = $('#pcNotes').value;
    if(!date) return alert('Pick date');
    const idx = data.findIndex(d=>d.date===date);
    if(idx>=0) data.splice(idx,1);
    data.push({id:Date.now().toString(), date, amount, notes});
    saveData('fin_pocketcal', data);
    snack('Saved ' + date);
    closeModal();
    renderCalendar();
  };

  // Delete Entry
  $('#pcDelete').onclick = () => {
    if(!selectedDate) return;
    data = data.filter(d=>d.date!==selectedDate);
    saveData('fin_pocketcal', data);
    snack('Deleted ' + selectedDate);
    closeModal();
    renderCalendar();
  };

  $('#pcClose').onclick = closeModal;

  // Navigation
  $('#prevMonth').onclick = ()=>{
    current.setMonth(current.getMonth()-1); renderCalendar();
  };
  $('#nextMonth').onclick = ()=>{
    current.setMonth(current.getMonth()+1); renderCalendar();
  };

  // Search
  $('#pcSearch').oninput = e => {
    const v = e.target.value.trim();
    if(v.length===10){
      const entry = data.find(d=>d.date===v);
      if(entry) openModal(v, entry);
      else openModal(v, null);
    }
  };

  renderCalendar();
})();
