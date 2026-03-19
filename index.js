/* ========================================================================
   MONEYFLOW - INDEX.JS (The Hub Logic)
   Calculate Stats, Speak Greetings, Handle PWA Install
======================================================================== */

(function () {
    'use strict';

    // State
    const state = {
        spendlyData: [],
        pocketData: [],
        username: localStorage.getItem('fin_userName') || 'User'
    };

    // ----------------------------------------------------
    // LOAD DATA & COMPUTE STATS
    // ----------------------------------------------------
    function updateDashboard() {
        state.spendlyData = loadData('fin_spendly') || [];
        state.pocketData = loadData('fin_pocketcal') || [];

        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().slice(0, 7);

        // Compute
        const todayExpense = state.spendlyData
            .filter(t => t.date === today && t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const monthlyExpense = state.spendlyData
            .filter(t => t.date && t.date.startsWith(currentMonth) && t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        
        const monthlyIncome = state.spendlyData
            .filter(t => t.date && t.date.startsWith(currentMonth) && t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalIncome = state.spendlyData
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalExpense = state.spendlyData
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalBalance = totalIncome - totalExpense;

        const monthPocket = state.pocketData
            .filter(p => p.date && p.date.startsWith(currentMonth))
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        // Smart Insight calculation
        let percent = 0;
        if (monthlyIncome > 0) {
            percent = Math.round((monthlyExpense / monthlyIncome) * 100);
        }

        // Apply to DOM
        animateValueUpdate('todayExpense', todayExpense);
        animateValueUpdate('monthExpense', monthlyExpense);
        animateValueUpdate('monthPocket', monthPocket);
        animateValueUpdate('totalBalance', totalBalance);

        generateInsight(percent);
    }

    function animateValueUpdate(elementId, value) {
        const el = document.getElementById(elementId);
        if(!el) return;
        el.textContent = fmt(value);
        
        // Trigger reflow for animation restart
        el.classList.remove('flash-update');
        void el.offsetWidth;
        el.classList.add('flash-update');
    }

    function generateInsight(percent) {
        const insightEl = document.getElementById('financeInsightMsg');
        if (!insightEl) return;

        let message = '';
        if (percent >= 90) message = `⚠️ Liquid warning: You spent ${percent}% of your income this month.`;
        else if (percent >= 70) message = `💡 Flow steady: You used ${percent}% of your income. Consider saving more.`;
        else if (percent >= 50) message = `👍 Balanced flow (${percent}%). Good financial control.`;
        else if (percent >= 30) message = `💎 Crystal clear! Only ${percent}% of income spent. Savings looking strong.`;
        else message = `🚀 Excellent discipline! Spending only ${percent}% of income.`;

        insightEl.textContent = message;
    }

    // ----------------------------------------------------
    // CONSTANT GREETINGS
    // ----------------------------------------------------
    function updateTextGreeting() {
        const welcomeEl = document.getElementById('welcomeText');
        if (!welcomeEl) return;

        const date = new Date();
        const hour = date.getHours();
        
        const emojiArray = [
            '🌌','🌃','🦉','🦇','🐺','🌅','🌄','☕','🍳','🌞','😎','🏖️',
            '🏜️','🏙️','🚶','🏃','🌇','🌆','🌙','🌟','🌠','🛌','😴','💤'
        ];
        const currentEmoji = emojiArray[hour];
        
        let greeting = "";
        if (hour >= 0 && hour < 3) greeting = "Late night";
        else if (hour >= 3 && hour < 6) greeting = "Early morning";
        else if (hour >= 6 && hour < 9) greeting = "Morning";
        else if (hour >= 9 && hour < 12) greeting = "Late morning";
        else if (hour >= 12 && hour < 15) greeting = "Afternoon";
        else if (hour >= 15 && hour < 18) greeting = "Late afternoon";
        else if (hour >= 18 && hour < 21) greeting = "Evening";
        else greeting = "Night";

        let randEmoji = ['✨','💫','🌟','🔥','🥂'][Math.floor(Math.random() * 5)];
        let finalGreeting = `Good ${greeting} ${currentEmoji}<br><span class="text-gradient">${state.username}</span> ${randEmoji}`;
        
        if (date.getDay() === 5) {
            finalGreeting = `Jummah Mubarak 🕌<br><span class="text-gradient">${state.username}</span> - Good ${greeting} ${currentEmoji}`;
        }

        welcomeEl.innerHTML = finalGreeting;
    }

    // ----------------------------------------------------
    // PROFESSIONAL VOICE GREETING (Web Speech API)
    // ----------------------------------------------------
    function speakAssistantGreeting() {
        if (localStorage.getItem("voiceGreeting") === "off") return;
        
        let hasSpoken = false;

        const hour = new Date().getHours();
        const date = new Date();
        let timeGreeting = "Good day";
        if (hour < 12) timeGreeting = "Good morning";
        else if (hour < 17) timeGreeting = "Good afternoon";
        else timeGreeting = "Good evening";

        let message = `Asalamwalikum, ${state.username}. ${timeGreeting}. Welcome to money flow.`;
        if (date.getDay() === 5) {
            message = `Asalamwalikum, Jummah Mubarak, ${state.username}. ${timeGreeting}. Welcome to money flow.`;
        }

        const runSpeech = () => {
            if (hasSpoken) return;

            const speech = new SpeechSynthesisUtterance(message);
            speech.lang = "en-US";
            speech.rate = 0.95;
            speech.pitch = 1;

            const voices = speechSynthesis.getVoices();
            const savedURI = localStorage.getItem('fin_voiceURI');
            let preferred = null;
            if(savedURI) preferred = voices.find(v => v.voiceURI === savedURI);
            if(!preferred) preferred = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha")) || voices[0];
            if (preferred) speech.voice = preferred;

            speech.onstart = () => {
                hasSpoken = true;
                document.removeEventListener('click', runSpeech);
                document.removeEventListener('touchstart', runSpeech);
            };

            speechSynthesis.cancel();
            speechSynthesis.speak(speech);
        };

        // Try playing immediately (Allowed on installed PWAs / Desktop)
        runSpeech();

        // Bind unconditionally to body touch/click (Fallback for Strict Browsers)
        document.addEventListener('click', runSpeech);
        document.addEventListener('touchstart', runSpeech);
    }

    // ----------------------------------------------------
    // PWA INSTALL LOGIC
    // ----------------------------------------------------
    let deferredPrompt;
    function initPWA() {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return; // Already installed, hide banner logic natively handles
        }

        const promptEl = document.getElementById('installPrompt');
        if(promptEl) {
            promptEl.style.display = 'block'; // Force show
            setTimeout(() => promptEl.classList.add('show'), 100);
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
        });

        document.getElementById('installBtn')?.addEventListener('click', async () => {
            if(!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if(outcome === 'accepted') {
                showSnackbar('MoneyFlow installed!');
            }
            deferredPrompt = null;
            document.getElementById('installPrompt').classList.remove('show');
            setTimeout(() => document.getElementById('installPrompt').style.display='none', 600);
        });

        document.getElementById('dismissBtn')?.addEventListener('click', () => {
            document.getElementById('installPrompt').classList.remove('show');
            setTimeout(() => document.getElementById('installPrompt').style.display='none', 600);
            localStorage.setItem('installDismissed', 'true');
        });
    }

    // ----------------------------------------------------
    // BOOTSTRAP
    // ----------------------------------------------------
    window.addEventListener('DOMContentLoaded', () => {
        updateTextGreeting();
        updateDashboard();
        initPWA();
        
        // Voice greeting after a tiny timeout to ensure it feels natural
        setTimeout(speakAssistantGreeting, 1200);

        // Auto refresh
        setInterval(updateDashboard, 60000);
    });

})();
