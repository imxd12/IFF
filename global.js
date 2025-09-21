/* global.js - shared functions */
(function(){
  /* Utility */
  window.$ = (s, r=document) => r.querySelector(s);
  window.$$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  // format currency (INR). change as needed
  window.fmt = n => {
    n = Number(n)||0;
    return '₹' + n.toLocaleString('en-IN', {maximumFractionDigits:2});
  };

  // header time updater - call on each page
  function startClock(selector='#timeNow'){
    const el = document.querySelector(selector);
    if(!el) return;
    function update(){
      const d = new Date();
      const hh = String(d.getHours()).padStart(2,'0');
      const mm = String(d.getMinutes()).padStart(2,'0');
      const ss = String(d.getSeconds()).padStart(2,'0');
      const dateStr = d.toLocaleDateString();
      el.textContent = `${dateStr} • ${hh}:${mm}:${ss}`;
    }
    update();
    setInterval(update,1000);
  }
  window.startClock = startClock;

  // Storage helpers
  window.saveData = (key, obj) => localStorage.setItem(key, JSON.stringify(obj||[]));
  window.loadData = (key) => {
    try { return JSON.parse(localStorage.getItem(key))||[]; }
    catch(e){ return []; }
  };

  // Export CSV
  window.exportCSV = function(filename, rows){
    if(!rows || !rows.length) return alert('No data to export');
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => `"${String(r[k]||'').replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename||'data.csv'; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  window.exportJSON = function(filename, data){
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename||'backup.json'; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // Import JSON file
  window.importJSONFile = function(cb){
    const inp = document.createElement('input');
    inp.type='file'; inp.accept='application/json';
    inp.onchange = e => {
      const f = e.target.files[0];
      if(!f) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          cb(null, data);
        } catch(err){ cb(err); }
      };
      reader.readAsText(f);
    };
    inp.click();
  };

  // small snackbar
  window.snack = function(msg, t=2200){
    let s = document.getElementById('finSnack');
    if(!s){
      s = document.createElement('div'); s.id='finSnack';
      s.style.position='fixed'; s.style.left='50%'; s.style.bottom='84px'; s.style.transform='translateX(-50%)';
      s.style.background='rgba(255,255,255,0.06)'; s.style.border='1px solid rgba(255,255,255,0.12)';
      s.style.padding='8px 12px'; s.style.borderRadius='10px'; s.style.boxShadow='0 8px 20px rgba(0,0,0,0.6)';
      s.style.color='var(--text)'; document.body.appendChild(s);
    }
    s.textContent = msg; s.style.opacity=1;
    setTimeout(()=> s.style.opacity=0, t);
  };

  // Attach nav clicks (use in each page)
  window.attachBottomNav = function(activeId){
    const btns = document.querySelectorAll('.nav-btn');
    btns.forEach(b=>{
      b.onclick = () => {
        const dest = b.dataset.href;
        if(dest) location.href = dest;
      };
      b.classList.remove('active');
      if(b.id === activeId) b.classList.add('active');
    });
  };

  // Simple chart helpers for canvas
  window.drawBar = function(canvas, labels, values){
    const c = canvas; const ctx = c.getContext('2d'); const W=c.width; const H=c.height;
    ctx.clearRect(0,0,W,H);
    const max = Math.max(...values,1);
    const pad = 28; const barW = (W - pad*2) / values.length * 0.7;
    values.forEach((v,i)=>{
      const x = pad + i * ((W - pad*2)/values.length) + ((W - pad*2)/values.length - barW)/2;
      const h = (v/max) * (H - 40);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(x, H - 20 - h, barW, h);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px sans-serif';
      ctx.fillText(labels[i], x, H - 4);
    });
  };

  window.drawPie = function(canvas, map){
    const c = canvas; const ctx = c.getContext('2d'); const W=c.width; const H=c.height; const cx=W/2; const cy=H/2; const r=Math.min(W,H)/2 - 10;
    ctx.clearRect(0,0,W,H);
    const vals = Object.values(map); const keys = Object.keys(map);
    const total = vals.reduce((a,b)=>a+b,0)||1;
    let angle= -Math.PI/2;
    keys.forEach((k,i)=>{
      const v = map[k];
      const slice = v/total * Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,angle, angle+slice);
      angle += slice;
      ctx.closePath();
      const alpha = 0.6 + (i%4)*0.08;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    });
    // legend
    ctx.font='12px sans-serif'; ctx.fillStyle='rgba(255,255,255,0.85)';
    keys.forEach((k,i)=> ctx.fillText(`${k} • ${Math.round(map[k]*100)/100}`, 8, 16 + i*16));
  };

  // expose nothing else
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.log('Service Worker registration failed', err));
  });
}
