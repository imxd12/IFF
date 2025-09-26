 // Start clock and navigation
startClock('#timeNow');
attachBottomNav('nav-home');

(function(){
  // Load saved username or default
  let username = localStorage.getItem('fin_userName') || "Imad";

// Personalized welcome message (more detailed)
function welcome() {
    const h = new Date().getHours();

    if (h >= 0 && h < 3) return `Good midnight 🌙, ${username}!`;
    if (h >= 3 && h < 5) return `Early dawn 🌌, ${username}!`;
    if (h >= 5 && h < 7) return `Good early morning 🌅, ${username}!`;
    if (h >= 7 && h < 9) return `Good morning ☀️, ${username}!`;
    if (h >= 9 && h < 12) return `Late morning 🌤️, ${username}!`;
    if (h >= 12 && h < 14) return `Good noon 🌞, ${username}!`;
    if (h >= 14 && h < 16) return `Early afternoon 🌤️, ${username}!`;
    if (h >= 16 && h < 18) return `Late afternoon 🌇, ${username}!`;
    if (h >= 18 && h < 20) return `Good evening 🌙, ${username}!`;
    if (h >= 20 && h < 22) return `Good Night 🌃, ${username}!`;
    if (h >= 22 && h < 24) return `Late night 🌌, ${username}!`;

    return `Hello, ${username}!`; // fallback
}

  function updateWelcome(){
    document.getElementById('welcomeMsg').textContent = welcome();
  }

  updateWelcome();

  // Button to set/edit username
  document.getElementById('btnSetName').onclick = ()=>{
    const newName = prompt("Enter your name:", username);
    if(newName && newName.trim() !== ""){
      username = newName.trim();
      localStorage.setItem('fin_userName', username);
      updateWelcome();
    }
  };

  // Load all app data
  const spend = loadData('fin_spendly') || [];
  const nexus = loadData('fin_nexus') || [];
  const pocket = loadData('fin_pocketcal') || [];

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0,7);

  // Quick summaries
  const todayExp = spend.filter(s => s.type==='expense' && s.date===today).reduce((a,b)=>a+Number(b.amount||0),0);
  document.getElementById('todayExpense').textContent = fmt(todayExp);

  const monthPocket = pocket.filter(p=>p.date && p.date.slice(0,7)===thisMonth).reduce((a,b)=>a+Number(b.amount||0),0);
  document.getElementById('monthPocket').textContent = fmt(monthPocket);

  const monthNexus = nexus.filter(n=>n.date && n.date.slice(0,7)===thisMonth).reduce((a,b)=>a+Number(b.payout||0),0);
  document.getElementById('monthNexus').textContent = fmt(monthNexus);

  const totalIncome = spend.filter(s=>s.type==='income').reduce((a,b)=>a+Number(b.amount||0),0);
  const totalExpense = spend.filter(s=>s.type==='expense').reduce((a,b)=>a+Number(b.amount||0),0);
  const allBalance = totalIncome - totalExpense;
  document.getElementById('allTimeBalance').textContent = fmt(allBalance);

  // Export all
  document.getElementById('btnExportAll').onclick = ()=> {
    const blob = {spend,nexus,pocket,exportedAt:new Date().toISOString()};
    exportJSON('finfusion-backup.json', blob);
    snack('All data exported as JSON');
  };

  // Modal handling
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');
  modalClose.onclick = ()=>{ modal.style.display='none'; }
  window.onclick = e => { if(e.target===modal) modal.style.display='none'; }
// Button content
const devContent = `
  <h3>Terms & Conditions</h3>
  <p>1. Use the app responsibly. All data is stored locally in your browser.</p>
  <p>2. Developer is not liable for any financial losses based on app data.</p>
  <p>3. Users are responsible for backing up/exporting their data.</p>
  <p>4. The app is provided "as is" without any warranties.</p>
  <p>5. Redistribution or resale of the app without permission is prohibited.</p>
  <p>6. Data privacy: All entries remain on your local storage; the app does not send your data online.</p>
  <p>7. Updates may improve functionality; check developer options for version info.</p>
`;

  document.getElementById('btnDevOptions').onclick = ()=>{
    modalBody.innerHTML = devContent;
    modal.style.display='block';
  }
  document.getElementById('btnTerms').onclick = ()=>{
    modalBody.innerHTML = devContent; // Reusing devContent for simplicity
    modal.style.display='block';
  }

})();

const brandingCard = document.querySelector('.branding-card');
const profileModal = document.getElementById('profileModal');
const closeBtn = profileModal.querySelector('.close-btn');

brandingCard.onclick = () => profileModal.style.display = 'flex';
closeBtn.onclick = () => profileModal.style.display = 'none';
window.onclick = e => { if(e.target === profileModal) profileModal.style.display='none'; }

// Hide splash after content loads
window.addEventListener('load', () => {
  const splash = document.getElementById('splashScreen');
  setTimeout(() => splash.style.display = 'none', 3000);
});
