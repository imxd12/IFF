startClock('#timeNow');
attachBottomNav('nav-nexus');

(function(){
  let data = loadData('fin_nexus') || [];
  let editingId = null;

  const nxModal = $('#nxModal');
  const fields = ['nxDate','nxItems','nxHours','nxBonus','nxPenalty','nxPayout','nxNotes'];

  function renderList(filter=''){
    const list = $('#listNexus'); list.innerHTML='';
    const items = data.slice().reverse().filter(it=>{
      if(!filter) return true;
      const q = filter.toLowerCase();
      return (it.date||'').includes(q) || (it.notes||'').toLowerCase().includes(q);
    });

    items.forEach(it=>{
      const li = document.createElement('li'); li.className='list-item';
      li.innerHTML = `<div>
        <div style="font-weight:700">${it.date} • ${fmt(it.payout)} • ${it.items||0} items • ${it.hours||0}h</div>
        <div class="meta">Bonus: ${fmt(it.bonus||0)} • Penalty: ${fmt(it.penalty||0)} • Notes: ${it.notes||''}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <button class="btn" data-id="${it.id}" data-action="edit">Edit</button>
        <button class="btn btn-danger" data-id="${it.id}" data-action="del">Delete</button>
      </div>`;
      list.appendChild(li);
    });
    updateChart();
  }

  function openModal(entry=null){
    editingId = entry ? entry.id : null;
    $('#nxModalTitle').textContent = entry ? 'Edit Entry' : 'Add Entry';
    fields.forEach(f => $(`#${f}`).value = entry ? entry[f.replace('nx','').toLowerCase()]||'' : '');
    $('#nxDelete').style.display = entry ? 'inline-block':'none';
    nxModal.classList.remove('hidden');
  }

  function closeModal(){ nxModal.classList.add('hidden'); editingId=null; }

  $('#btnAddN').onclick = () => openModal(null);
  $('#nxClose').onclick = closeModal;

  $('#nxSave').onclick = () => {
    const entry = {};
    fields.forEach(f => entry[f.replace('nx','').toLowerCase()] = $('#'+f).value);
    entry.date = entry.date || new Date().toISOString().slice(0,10);
    entry.items = Number(entry.items||0);
    entry.hours = Number(entry.hours||0);
    entry.bonus = Number(entry.bonus||0);
    entry.penalty = Number(entry.penalty||0);
    entry.payout = Number(entry.payout||0);

    // enforce one entry per day
    const idx = data.findIndex(d=>d.date===entry.date);
    if(editingId){ 
      const editIdx = data.findIndex(d=>d.id===editingId);
      if(editIdx>=0) data[editIdx] = {...entry,id:editingId};
    } else {
      if(idx>=0){ 
        if(!confirm('Replace existing entry for this date?')) return;
        data.splice(idx,1);
      }
      entry.id = Date.now().toString();
      data.push(entry);
    }
    saveData('fin_nexus', data);
    snack('Saved');
    closeModal();
    renderList($('#searchNexus').value);
  };

  $('#nxDelete').onclick = () => {
    if(!editingId) return;
    data = data.filter(d=>d.id!==editingId);
    saveData('fin_nexus', data);
    snack('Deleted');
    closeModal();
    renderList($('#searchNexus').value);
  };

  $('#listNexus').onclick = e => {
    const btn = e.target.closest('button'); if(!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const entry = data.find(d=>d.id===id);
    if(!entry) return;
    if(action==='edit') openModal(entry);
    if(action==='del'){ if(confirm('Delete entry?')){ data=data.filter(d=>d.id!==id); saveData('fin_nexus', data); snack('Deleted'); renderList($('#searchNexus').value); } }
  };

  $('#searchNexus').oninput = e => renderList(e.target.value);

  function updateChart(){
    const canvas = $('#nxChart');
    const last = data.slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(-12);
    const labels = last.map(i=> i.date.slice(5));
    const values = last.map(i=> i.payout);
    drawBar(canvas, labels, values);

    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const monthTotal = data.filter(d=>d.date.startsWith(monthStr)).reduce((a,b)=>a+b.payout,0);
    const ytd = data.reduce((a,b)=>a+b.payout,0);
    $('#nxMonth').textContent = fmt(monthTotal);
    $('#nxYTD').textContent = fmt(ytd);
  }

  renderList();
})();
