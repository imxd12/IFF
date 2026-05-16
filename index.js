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
        let historicalIncome = monthlyIncome;
        if (monthlyIncome <= 0) {
            // Calculate 3-month average income as fallback
            const pastInc = state.spendlyData.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
            const monthsSet = new Set(state.spendlyData.map(t => t.date.slice(0, 7)));
            const numMonths = Math.max(monthsSet.size, 1);
            historicalIncome = pastInc / numMonths;
        }

        let percent = 0;
        let budget = historicalIncome > 0 ? historicalIncome : 100;

        // Apply to DOM
        animateValueUpdate('todayExpense', todayExpense);
        animateValueUpdate('monthExpense', monthlyExpense);
        animateValueUpdate('monthPocket', monthPocket);
        animateValueUpdate('totalBalance', totalBalance);

        // Advanced AI Spend Predictor Logic
        const currentMonthTotalDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const currentDay = new Date().getDate();
        
        let runRate = 0;
        let predictedSpend = 0;
        if (currentDay > 0) {
            // Base run-rate
            runRate = monthlyExpense / currentDay;
            
            // AI Weighted Prediction based on recency (last 7 days have higher weight)
            const last7Days = new Date();
            last7Days.setDate(currentDay - 7);
            const recentExpense = state.spendlyData
                .filter(t => t.type === 'expense' && new Date(t.date) >= last7Days && t.date.startsWith(currentMonth))
                .reduce((sum, t) => sum + Number(t.amount || 0), 0);
            
            const recentDays = Math.min(currentDay, 7);
            const recentRunRate = recentDays > 0 ? recentExpense / recentDays : runRate;
            
            // Blended Prediction: 60% recent trend + 40% overall month trend
            const smartRunRate = (recentRunRate * 0.6) + (runRate * 0.4);
            predictedSpend = smartRunRate * currentMonthTotalDays;
        }

        if (budget > 0) {
            percent = Math.round((monthlyExpense / budget) * 100);
        }

        const aiPredictedSpendEl = document.getElementById('aiPredictedSpend');
        const aiRunRateEl = document.getElementById('aiRunRate');
        const aiPredictorBarEl = document.getElementById('aiPredictorBar');

        if(aiPredictedSpendEl) aiPredictedSpendEl.textContent = `₹${predictedSpend.toFixed(0)}`;
        if(aiRunRateEl) aiRunRateEl.textContent = `₹${runRate.toFixed(0)} / day`;
        
        if(aiPredictorBarEl) {
            let barBudget = budget > 0 ? budget : (predictedSpend > 0 ? predictedSpend * 1.2 : 100); 
            let barWidth = Math.min((predictedSpend / barBudget) * 100, 100);
            aiPredictorBarEl.style.width = `${barWidth}%`;
            
            if(barWidth > 90) aiPredictorBarEl.className = "h-full transition-all duration-1000 ease-out bg-rose-500";
            else if(barWidth > 70) aiPredictorBarEl.className = "h-full transition-all duration-1000 ease-out bg-amber-500";
            else aiPredictorBarEl.className = "h-full transition-all duration-1000 ease-out bg-emerald-500";
        }

        generateInsight(percent, predictedSpend, budget, monthlyIncome);
    }

    function animateValueUpdate(elementId, value) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = fmt(value);

        // Trigger reflow for animation restart
        el.classList.remove('flash-update');
        void el.offsetWidth;
        el.classList.add('flash-update');
    }

    function generateInsight(percent, predictedSpend, budget, actualIncome) {
        const insightEl = document.getElementById('financeInsightMsg');
        if (!insightEl) return;

        let message = '';
        if (budget <= 0 && actualIncome <= 0) {
            message = "🧠 AI needs income data to generate smart insights. Log your income!";
        } else if (predictedSpend > budget) {
            message = `🚨 Critical: AI predicts you will overspend by ₹${(predictedSpend - budget).toFixed(0)}. Time to slow down!`;
        } else if (percent >= 90) {
            message = `⚠️ Liquid warning: You've spent ${percent}% of your budget. Very tight budget ahead.`;
        } else if (percent >= 70) {
            message = `💡 Flow steady: You used ${percent}% of your budget. Consider limiting non-essential spending.`;
        } else if (percent >= 50) {
            message = `👍 Balanced flow. AI predicts you'll save ₹${(budget - predictedSpend).toFixed(0)} this month.`;
        } else if (percent >= 30) {
            message = `💎 Crystal clear! Your spending is optimal. AI projects strong savings.`;
        } else {
            message = `🚀 Excellent discipline! You are well below your budget ceiling.`;
        }

        insightEl.textContent = message;
    }

    // ----------------------------------------------------
    // WEATHER & GREETINGS
    // ----------------------------------------------------
    async function initWeather() {
        const weatherBadge = document.getElementById('weatherBadge');
        if (!weatherBadge) return;

        const setWeatherUI = (temp, code) => {
            let icon = 'cloud';
            let color = 'text-gray-400';
            let condition = 'Cloudy';
            let animation = 'animate-pulse';

            if (code === 0) { icon = 'sun'; color = 'text-amber-400'; condition = 'Clear Sky'; animation = 'animate-[spin_10s_linear_infinite]'; }
            else if (code >= 1 && code <= 3) { icon = 'cloud-sun'; color = 'text-blue-300'; condition = 'Partly Cloudy'; animation = 'animate-pulse'; }
            else if (code >= 45 && code <= 48) { icon = 'wind'; color = 'text-gray-400'; condition = 'Foggy'; animation = 'animate-pulse'; }
            else if (code >= 51 && code <= 67) { icon = 'cloud-rain'; color = 'text-blue-400'; condition = 'Rainy'; animation = 'animate-bounce'; }
            else if (code >= 71 && code <= 77) { icon = 'snowflake'; color = 'text-cyan-200'; condition = 'Snowing'; animation = 'animate-[spin_3s_linear_infinite]'; }
            else if (code >= 80 && code <= 82) { icon = 'cloud-rain'; color = 'text-blue-500'; condition = 'Showers'; animation = 'animate-bounce'; }
            else if (code >= 95) { icon = 'cloud-lightning'; color = 'text-yellow-400'; condition = 'Thunderstorm'; animation = 'animate-pulse'; }

            // Custom Temperature Overrides
            if (temp >= 35) { icon = 'sun'; color = 'text-amber-500'; condition = 'Hot & Sunny'; animation = 'animate-[spin_4s_linear_infinite]'; }
            if (temp < 25 && temp > 15 && code === 0) { icon = 'sun'; color = 'text-amber-300'; condition = 'Pleasant'; }
            if (temp < 10) { icon = 'snowflake'; color = 'text-cyan-200'; condition = 'Freezing'; animation = 'animate-[spin_3s_linear_infinite]'; }

            weatherBadge.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 ${color} ${animation}"></i> <span class="text-white/80">${temp}°C • ${condition}</span>`;
            if (window.lucide) lucide.createIcons();
        };

        const fetchWeather = async (lat, lon) => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
                const data = await res.json();
                const temp = Math.round(data.current.temperature_2m);
                const code = data.current.weather_code;
                setWeatherUI(temp, code);
            } catch (e) {
                weatherBadge.innerHTML = `<i data-lucide="cloud-off" class="w-4 h-4 text-red-400"></i> <span class="text-white/50">Weather Offline</span>`;
                if (window.lucide) lucide.createIcons();
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                () => setWeatherUI(28, 1) // Fallback if denied
            );
        } else {
            setWeatherUI(28, 1);
        }
    }

    function updateTextGreeting() {
        const welcomeEl = document.getElementById('welcomeText');
        if (!welcomeEl) return;

        const date = new Date();
        const hour = date.getHours();

        const emojiArray = [
            '🌌', '🌃', '🦉', '🦇', '🐺', '🌅', '🌄', '☕', '🍳', '🌞', '😎', '🏖️',
            '🏜️', '🏙️', '🚶', '🏃', '🌇', '🌆', '🌙', '🌟', '🌠', '🛌', '😴', '💤'
        ];
        const currentEmoji = emojiArray[hour];
        let randEmoji = ['✨', '💫', '🌟', '🔥', '🥂'][Math.floor(Math.random() * 5)];

        if (window.MoneyFlowVoiceEngine) {
            const langCode = localStorage.getItem('fin_language') || 'en';
            const username = localStorage.getItem('fin_userName') || state.username || 'User';
            const useNameStr = localStorage.getItem('fin_useName');
            const useName = useNameStr !== 'false';
            
            const timeKey = window.MoneyFlowVoiceEngine.getTimeKey(hour);
            const langData = window.MoneyFlowVoiceEngine.greetings['en']; // ALWAYS ENGLISH FOR VISUAL TEXT
            const timeGreeting = langData[timeKey] || langData.morning;
            
            let finalGreeting = `${timeGreeting} ${currentEmoji}<br><span class="text-gradient">${useName ? username : ''}</span> ${randEmoji}`;
            
            if (date.getDay() === 5) { // Show Jummah Mubarak for everyone on Friday visually
                finalGreeting = `Jummah Mubarak 🕌<br><span class="text-gradient">${useName ? username : ''}</span> - Good ${timeKey} ${currentEmoji}`;
            }
            welcomeEl.innerHTML = finalGreeting;
        } else {
            let greeting = "Good day";
            let finalGreeting = `${greeting} ${currentEmoji}<br><span class="text-gradient">${state.username}</span> ${randEmoji}`;
            welcomeEl.innerHTML = finalGreeting;
        }
    }

    // ----------------------------------------------------
    // PROFESSIONAL VOICE GREETING (Web Speech API)
    // ----------------------------------------------------
    function speakAssistantGreeting(forcePlay = false) {
        if (window.MoneyFlowVoiceEngine) {
            window.MoneyFlowVoiceEngine.speak(forcePlay);
        }
    }

    // ----------------------------------------------------
    // PWA INSTALL LOGIC
    // ----------------------------------------------------
    let deferredPrompt;
    function initPWA() {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            localStorage.setItem("appInstalled", "true");
            return; // Already installed, do not show
        }

        const isInstalled = localStorage.getItem("appInstalled") === "true";
        const promptEl = document.getElementById('installPrompt');
        
        if (isInstalled && promptEl) {
            promptEl.style.display = 'none';
            return;
        }

        if (promptEl && localStorage.getItem('installDismissed') !== 'true') {
            promptEl.style.display = 'flex';
            promptEl.style.opacity = '0';
            setTimeout(() => {
                promptEl.style.transition = 'opacity 0.5s ease';
                promptEl.style.opacity = '1';
            }, 100);
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
        });

        const installBtn = document.getElementById('installBtn');
        const installBtnText = document.getElementById('installBtnText');
        const dismissBtn = document.getElementById('dismissBtn');

        installBtn?.addEventListener('click', async () => {
            if (!deferredPrompt) {
                showSnackbar('Install prompt not available right now. You can install from browser menu.');
                return;
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                localStorage.setItem("appInstalled", "true");
                showSnackbar('MoneyFlow installed successfully! ✨');
                
                // Show "Installed ✓"
                if (installBtnText) installBtnText.textContent = 'Installed ✓';
                installBtn.classList.remove('hover:bg-emerald-500/20', 'hover:border-emerald-500/50', 'hover:text-emerald-400');
                installBtn.classList.add('bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/50', 'cursor-not-allowed');
                installBtn.disabled = true;
                
                // Hide after a short delay
                setTimeout(() => {
                   if(promptEl) {
                       promptEl.style.opacity = '0';
                       setTimeout(() => promptEl.style.display = 'none', 500);
                   }
                }, 3000);
            }
            deferredPrompt = null;
        });

        dismissBtn?.addEventListener('click', () => {
            if(promptEl) {
                promptEl.style.opacity = '0';
                setTimeout(() => promptEl.style.display = 'none', 500);
            }
            localStorage.setItem('installDismissed', 'true');
        });
    }

    // ----------------------------------------------------
    // BOOTSTRAP
    // ----------------------------------------------------
    window.addEventListener('DOMContentLoaded', () => {
        initWeather();
        updateTextGreeting();
        updateDashboard();
        initPWA();

        // Voice greeting after a tiny timeout to ensure it feels natural
        setTimeout(speakAssistantGreeting, 1200);

        // Auto refresh
        setInterval(updateDashboard, 60000);
    });

})();
