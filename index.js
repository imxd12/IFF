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


  // Button content - Developer Terms
  const devContent = `
 <h3>📜 Terms & Conditions</h3>
  <p>Welcome to Spendly! By using this app, you agree to the following:</p>
  <ul style="margin-left:15px; line-height:1.6;">
    <li>✅ The app is for <strong>personal finance tracking</strong> only.</li>
    <li>✅ All data is stored locally on your device via browser storage.</li>
    <li>✅ You are solely responsible for entering accurate information.</li>
    <li>✅ The developer does not access, share, or sell your personal data.</li>
    <li>✅ The app is provided <em>“as is”</em> with no guarantees of accuracy.</li>
    <li>✅ Use of the app is at your own risk; financial decisions are your responsibility.</li>
    <li>✅ Do not attempt to misuse, redistribute, or resell the app.</li>
    <li>✅ Updates may change features, UI, or local storage structure.</li>
  </ul>
  <p style="margin-top:10px;">By continuing, you agree to these Terms & Conditions ✅</p>
`;

  // Button content - How to Use Apps
  const termsContent = `
    <h3>📖 How to Use Spendly, Nexus & PocketCal</h3>

    <h4>💸 Spendly (Expense Tracker)</h4>
    <p>1. Choose a category (Food, Travel, Bills, Shopping, etc.) from the dropdown.</p>
    <p>2. Enter amount and description, then click <b>Add</b> to save the expense.</p>
    <p>3. View your expenses in the list below. Hover for details, click remove to delete.</p>
    <p>4. Use <b>Export/Backup</b> in developer options to save your data.</p>
    <p>5. Data is stored in localStorage and stays safe on your device.</p>

    <h4>📊 Nexus (Income Tracker)</h4>
    <p>1. Enter your income source (e.g., Salary, Freelance, Business).</p>
    <p>2. Add the amount and description, then click <b>Add</b>.</p>
    <p>3. Nexus will keep track of your total income in localStorage.</p>
    <p>4. Use the filter/search bar to quickly find income entries.</p>
    <p>5. Backup or clear data from developer options when needed.</p>

    <h4>🧮 PocketCal (Calculator)</h4>
    <p>1. Open the calculator tab inside the app.</p>
    <p>2. Perform quick math operations (Add, Subtract, Multiply, Divide).</p>
    <p>3. Use <b>CE</b> to clear the last entry, <b>AC</b> to reset all.</p>
    <p>4. PocketCal is lightweight and works offline with instant results.</p>
    <p>5. Great for budgeting calculations while adding Spendly/Nexus entries.</p>

    <h4>⚡ Tips</h4>
    <p>✔ Combine Spendly + Nexus to balance your Income vs Expenses.</p>
    <p>✔ Use PocketCal for quick totals before adding transactions.</p>
    <p>✔ Always back up before clearing or reinstalling the app.</p>
    <p>✔ Your privacy is safe: no online sync, only local storage.</p>
  `;

  // Button actions
  document.getElementById('btnDevOptions').onclick = ()=>{
    modalBody.innerHTML = devContent;
    modal.style.display = 'block';
  }

  document.getElementById('btnTerms').onclick = ()=>{
    modalBody.innerHTML = termsContent; 
    modal.style.display = 'block';
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
