startClock('#timeNow');
attachBottomNav('nav-home');

(function(){
// Personalized welcome message
function welcome() {
  const h = new Date().getHours();
  const name = "Imad";
  
  if(h >= 0 && h < 4) return `Good midnight 🌙, ${name}!`;
  if(h >= 4 && h < 7) return `Good early morning 🌅, ${name}!`;
  if(h >= 7 && h < 12) return `Good morning ☀️, ${name}!`;
  if(h >= 12 && h < 14) return `Good noon 🌞, ${name}!`;
  if(h >= 14 && h < 18) return `Good afternoon 🌤️, ${name}!`;
  if(h >= 18 && h < 21) return `Good evening 🌙, ${name}!`;
  return `Good night 🌌, ${name}!`;
}

document.getElementById('welcomeMsg').textContent = welcome();

  // Load all app data
  const spend = loadData('fin_spendly');
  const nexus = loadData('fin_nexus');
  const pocket = loadData('fin_pocketcal');

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
  const totalPocket = pocket.reduce((a,b)=>a+Number(b.amount||0),0);
  const totalNexus = nexus.reduce((a,b)=>a+Number(b.payout||0),0);
  const allBalance = totalIncome - totalExpense ;
  document.getElementById('allTimeBalance').textContent = fmt(allBalance);

  // Export all
  document.getElementById('btnExportAll').onclick = ()=>{
    const blob={spend,nexus,pocket,exportedAt:new Date().toISOString()};
    exportJSON('finfusion-backup.json', blob);
    snack('All data exported as JSON');
  };

  // Modal references
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  modalClose.onclick = ()=>{ modal.style.display='none'; }

  window.onclick = e => { if(e.target===modal) modal.style.display='none'; }

// Button content
const devContent = `
  <h3>Developer Options</h3>
  <p>FinFusion v1.0 — All-in-One Finance & Productivity Tracker</p>
  <p>Developer: Imad Khan</p>
  <p>Contact: <a href="mailto:imadak999@gmail.com">imadak999@gmail.com</a></p>
  <p>Instagram: <a href="https://www.instagram.com/_imxd12" target="_blank">@_imxd12</a></p>
  <p>App Version: Web HTML/CSS/JS (Responsive & Mobile-First)</p>
  <p>Last updated: ${new Date().toLocaleDateString()}</p>
`;


const termsContent = `
  <h3>Terms & Conditions</h3>
  <p>1. Use the app responsibly. All data is stored locally in your browser.</p>
  <p>2. Developer is not liable for any financial losses based on app data.</p>
  <p>3. Users are responsible for backing up/exporting their data.</p>
  <p>4. The app is provided "as is" without any warranties.</p>
  <p>5. Redistribution or resale of the app without permission is prohibited.</p>
  <p>6. Data privacy: All entries remain on your local storage; the app does not send your data online.</p>
  <p>7. Updates may improve functionality; check developer options for version info.</p>
`;

const howToUseContent = `
  <h3>How to Use FinFusion</h3>

  <h4>Spendly — Expense & Income Tracker</h4>
  <ul>
    <li>Add separate entries for Income and Expense.</li>
    <li>Select the appropriate category and subcategory for each entry.</li>
    <li>Use the "Notes" field to describe the transaction.</li>
    <li>Track monthly totals and get alerts if budget exceeds limits.</li>
    <li>Edit or delete any entry by clicking the respective buttons.</li>
    <li>Use the search bar to quickly find transactions by notes or category.</li>
    <li>Export data to CSV or backup to JSON for offline storage.</li>
  </ul>

  <h4>Nexus — Blinkit Income Tracker</h4>
  <ul>
    <li>Record daily working hours, payouts, bonuses, and penalties.</li>
    <li>View monthly and all-time income summaries.</li>
    <li>Use the "View More" button to see older entries.</li>
    <li>Edit or delete income logs to correct mistakes.</li>
    <li>Charts visualize income trends over time.</li>
    <li>Backup and export options available for security.</li>
  </ul>

  <h4>PocketCal — Pocket Money Manager</h4>
  <ul>
    <li>Track your daily pocket money and usage.</li>
    <li>View monthly summaries to plan expenses better.</li>
    <li>Set recurring entries for regular allowances.</li>
    <li>Edit or delete entries as needed.</li>
    <li>Charts help visualize where your money is going.</li>
    <li>Export or backup your data to JSON files for safety.</li>
  </ul>

  <h4>General Tips</h4>
  <ul>
    <li>Use export/backup regularly to prevent data loss.</li>
    <li>Check your all-time balance for an overview of financial health.</li>
    <li>Use charts to identify spending trends and plan budgets.</li>
    <li>Keep your browser storage clean to maintain app performance.</li>
  </ul>
`;

  document.getElementById('btnDevOptions').onclick = ()=>{
    modalBody.innerHTML = devContent;
    modal.style.display='block';
  }
  document.getElementById('btnTerms').onclick = ()=>{
    modalBody.innerHTML = termsContent;
    modal.style.display='block';
  }
  document.getElementById('btnHowToUse').onclick = ()=>{
    modalBody.innerHTML = howToUseContent;
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
