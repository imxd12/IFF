startClock('#timeNow');
attachBottomNav('nav-pocket');

(function(){
  let data = loadData('fin_pocketcal') || []; 
  const grid = $('#calendarGrid'); 
  const monthLabel = $('#calMonth');
  let current = new Date(); 
  current.setDate(1);

  let selectedDate = null;
  let chart = null;

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
    updateChart();
  }

  function updateTotals(){
    const all = data.reduce((a,b)=>a+Number(b.amount||0),0);
    $('#pcAll').textContent = fmt(all);
    const currentMonthStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
    const monthEntries = data.filter(d => d.date.startsWith(currentMonthStr));
    const monthTotal = monthEntries.reduce((a,b)=>a+Number(b.amount||0),0);
    $('#pcMonth').textContent = fmt(monthTotal);

    if(monthEntries.length){
      const max = Math.max(...monthEntries.map(e=>e.amount));
      const avg = (monthTotal / monthEntries.length).toFixed(2);
      $('#pcHigh').textContent = fmt(max);
      $('#pcAvg').textContent = fmt(avg);
    } else {
      $('#pcHigh').textContent = '₹0';
      $('#pcAvg').textContent = '₹0';
    }
  }

  // Chart update
  function updateChart(){
    const labels = [];
    const values = [];
    const year = current.getFullYear();
    const month = current.getMonth();
    const daysIn = new Date(year, month+1,0).getDate();
    for(let i=1;i<=daysIn;i++){
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      const entry = data.find(d=>d.date===dateStr);
      labels.push(i.toString());
      values.push(entry ? entry.amount : 0);
    }

    const ctx = document.getElementById('pcChart').getContext('2d');
    if(chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Daily Spend',
          data: values,
          backgroundColor: 'rgba(0, 200, 100, 0.6)'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }},
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  // Modal Handling
  function openModal(dateStr, entry){
    selectedDate = dateStr;
    $('#pcDate').value = dateStr;
    $('#pcAmount').value = entry ? entry.amount : '';
    $('#pcCategory').value = entry ? entry.category || '' : '';
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
    const category = $('#pcCategory').value;
    if(!date) return alert('Pick date');
    const idx = data.findIndex(d=>d.date===date);
    if(idx>=0) data.splice(idx,1);
    data.push({id:Date.now().toString(), date, amount, notes, category});
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

  // Search by date picker
  $('#pcSearch').onchange = e => {
    const v = e.target.value.trim();
    if (v) {
      const entry = data.find(d => d.date === v);
      if (entry) openModal(v, entry);
      else openModal(v, null);
    }
  };

  // Add Today Button
  $('#btnAddToday').onclick = () => {
    const today = new Date().toISOString().slice(0,10);
    const entry = data.find(d=>d.date===today);
    openModal(today, entry);
  };

  renderCalendar();
})();
