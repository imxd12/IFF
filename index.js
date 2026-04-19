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
        if (!el) return;
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
            '🌌', '🌃', '🦉', '🦇', '🐺', '🌅', '🌄', '☕', '🍳', '🌞', '😎', '🏖️',
            '🏜️', '🏙️', '🚶', '🏃', '🌇', '🌆', '🌙', '🌟', '🌠', '🛌', '😴', '💤'
        ];
        const currentEmoji = emojiArray[hour];

        let greeting = "";
        if (hour >= 0 && hour < 3) greeting = "Late night";
        else if (hour >= 3 && hour < 6) greeting = "Early morning";
        else if (hour >= 6 && hour < 10) greeting = "Morning";
        else if (hour >= 10 && hour < 12) greeting = "Late morning";
        else if (hour >= 12 && hour < 15) greeting = "Afternoon";
        else if (hour >= 15 && hour < 18) greeting = "Late Afternoon";
        else if (hour >= 18 && hour < 21) greeting = "Evening";
        else greeting = "Night";

        let randEmoji = ['✨', '💫', '🌟', '🔥', '🥂'][Math.floor(Math.random() * 5)];
        let finalGreeting = `${greeting} ${currentEmoji}<br><span class="text-gradient">${state.username}</span> ${randEmoji}`;

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
        // Use sessionStorage instead of localStorage so it plays once per app session (each time app is opened)
        if (sessionStorage.getItem("app_session_started") === "true") return;

        let hasSpoken = false;

        const hour = new Date().getHours();
        const date = new Date();

        let timeGreeting = "Good day";

        if (hour >= 0 && hour < 3) {
            timeGreeting = "Late night";
        } else if (hour >= 3 && hour < 6) {
            timeGreeting = "Early morning";
        } else if (hour >= 6 && hour < 9) {
            timeGreeting = "Morning";
        } else if (hour >= 9 && hour < 12) {
            timeGreeting = "Late morning";
        } else if (hour >= 12 && hour < 15) {
            timeGreeting = "Afternoon";
        } else if (hour >= 15 && hour < 18) {
            timeGreeting = "Late afternoon";
        } else if (hour >= 18 && hour < 21) {
            timeGreeting = "Evening";
        } else if (hour >= 21 && hour < 24) {
            timeGreeting = "Early Night";
        } else {
            timeGreeting = "Good Night";
        }

        const dob = localStorage.getItem('userDOB');
        const dobDate = dob ? new Date(dob) : null;
        const isBirthday = dobDate && dobDate.getMonth() === date.getMonth() && dobDate.getDate() === date.getDate();
        let bdayWish = isBirthday ? " Happy birthday!" : "";

        let message = `Asalamwalikum, ${state.username}. ${timeGreeting}.${bdayWish} Welcome to money flow.`;
        if (date.getDay() === 5) {
            message = `Asalamwalikum, Jummah Mubarak, ${state.username}. ${timeGreeting}.${bdayWish} Welcome to money flow.`;
        }

        const runSpeech = () => {
            if (hasSpoken) return;

            const speech = new SpeechSynthesisUtterance(message);
            speech.lang = "en-US";
            speech.rate = 0.95;
            speech.pitch = 1;

            speech.onstart = () => {
                hasSpoken = true;
                sessionStorage.setItem("app_session_started", "true");
                document.removeEventListener('click', runSpeech);
                document.removeEventListener('touchstart', runSpeech);
            };

            const loadVoiceAndSpeak = () => {
                const voices = speechSynthesis.getVoices();
                const savedURI = localStorage.getItem('fin_voiceURI');
                let preferred = null;
                if (savedURI) preferred = voices.find(v => v.voiceURI === savedURI);
                if (!preferred) preferred = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha")) || voices[0];
                if (preferred) speech.voice = preferred;

                speechSynthesis.cancel();
                speechSynthesis.speak(speech);
            };

            if (speechSynthesis.getVoices().length === 0) {
                speechSynthesis.addEventListener('voiceschanged', loadVoiceAndSpeak, { once: true });
            } else {
                loadVoiceAndSpeak();
            }
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
        if (promptEl) {
            promptEl.style.display = 'block'; // Force show
            setTimeout(() => promptEl.classList.add('show'), 100);
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
        });

        document.getElementById('installBtn')?.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                showSnackbar('MoneyFlow installed!');
            }
            deferredPrompt = null;
            document.getElementById('installPrompt').classList.remove('show');
            setTimeout(() => document.getElementById('installPrompt').style.display = 'none', 600);
        });

        document.getElementById('dismissBtn')?.addEventListener('click', () => {
            document.getElementById('installPrompt').classList.remove('show');
            setTimeout(() => document.getElementById('installPrompt').style.display = 'none', 600);
            localStorage.setItem('installDismissed', 'true');
        });
    }

    // ----------------------------------------------------
    // NEURAL BEATS - LONG PRESS MUSIC MODAL LOGIC
    // ----------------------------------------------------
    function initMusicModalLogic() {
        const musicBtn = document.getElementById('musicIconBtn');
        const modal = document.getElementById('musicPlayerModal');
        if (!musicBtn || !modal) return;

        let pressTimer = null;
        let isLongPress = false;
        
        // Formatter for MM:SS
        const formatTime = (time) => {
            if(isNaN(time)) return "0:00";
            const min = Math.floor(time / 60);
            const sec = Math.floor(time % 60);
            return `${min}:${sec < 10 ? '0' : ''}${sec}`;
        };

        // UI references
        const player = document.getElementById('globalMusicPlayer');
        const playPauseBtn = document.getElementById('musicModalPlayPause');
        const playIcon = document.getElementById('musicModalPlayIcon');
        const modalTrackName = document.getElementById('modalTrackName');
        const currentTimeEl = document.getElementById('musicModalCurrentTime');
        const durationEl = document.getElementById('musicModalDuration');
        const seekSlider = document.getElementById('musicModalSeek');
        const fileInput = document.getElementById('localAudioFile');
        const loadBtn = document.getElementById('loadDeviceAudioBtn');

        // Long Press Events
        const startPress = (e) => {
            if (e.button && e.button !== 0) return; // Only left click
            isLongPress = false;
            musicBtn.style.transform = 'scale(0.9)'; // Provide visual feedback of pressing
            
            pressTimer = setTimeout(() => {
                isLongPress = true;
                // Vibrate if allowed
                if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
                // Open Modal
                modal.classList.add('active');
                updateModalUIState();
            }, 3000); // 3 seconds
        };

        const cancelPress = () => {
            clearTimeout(pressTimer);
            musicBtn.style.transform = 'scale(1)';
        };

        const executeClick = (e) => {
            cancelPress();
            if(!isLongPress) {
                // Was just a normal click
                if(window.toggleGlobalMusic) window.toggleGlobalMusic();
                updateModalUIState();
            }
        };

        musicBtn.addEventListener('pointerdown', startPress);
        musicBtn.addEventListener('pointerup', executeClick);
        musicBtn.addEventListener('pointerleave', cancelPress);

        // Modal Controls
        document.getElementById('closeMusicModalBtn').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            // Close if clicking overlay directly
            if(e.target === modal) modal.classList.remove('active');
        });

        // Sync Modal UI
        const updateModalUIState = () => {
             if (player.paused) {
                 playIcon.setAttribute('data-lucide', 'play');
                 document.getElementById('miniEQ').style.opacity = '0.3';
             } else {
                 playIcon.setAttribute('data-lucide', 'pause');
                 document.getElementById('miniEQ').style.opacity = '1';
             }
             if(window.lucide) lucide.createIcons();
        };

        playPauseBtn.addEventListener('click', () => {
            if(window.toggleGlobalMusic) window.toggleGlobalMusic();
            updateModalUIState();
        });

        // Skip buttons (just simulated skip by 15s since single track)
        document.getElementById('musicModalNext').addEventListener('click', () => {
            player.currentTime += 15;
        });
        document.getElementById('musicModalPrev').addEventListener('click', () => {
            player.currentTime = Math.max(0, player.currentTime - 15);
        });

        // Update progress bar
        player.addEventListener('timeupdate', () => {
            if(!modal.classList.contains('active')) return; // Save perf
            
            currentTimeEl.textContent = formatTime(player.currentTime);
            if(player.duration) {
                durationEl.textContent = formatTime(player.duration);
                seekSlider.value = (player.currentTime / player.duration) * 100;
            }
        });
        
        // Ensure duration updates on load
        player.addEventListener('loadedmetadata', () => {
            durationEl.textContent = formatTime(player.duration);
        });

        seekSlider.addEventListener('input', (e) => {
            const seekTime = (e.target.value / 100) * player.duration;
            player.currentTime = seekTime;
        });

        // Load Device Audio handling
        loadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                player.src = url;
                modalTrackName.textContent = file.name.replace(/\.[^/.]+$/, ""); // remove extension
                player.play().then(() => {
                    if (window.toggleGlobalMusic && player.paused) window.toggleGlobalMusic(); // sync global state
                    updateModalUIState();
                    // Force the global header icon to show pause
                    const headerIcon = document.getElementById("musicStatusIcon");
                    if(headerIcon) headerIcon.setAttribute('data-lucide', 'pause');
                    if(window.lucide) lucide.createIcons();
                }).catch(e => console.log('Autoplay prevented', e));
                
                showSnackbar('Loaded local audio track successfully.');
            }
        });
    }

    // ----------------------------------------------------
    // BOOTSTRAP
    // ----------------------------------------------------
    window.addEventListener('DOMContentLoaded', () => {
        updateTextGreeting();
        updateDashboard();
        initPWA();
        initMusicModalLogic();

        // Voice greeting after a tiny timeout to ensure it feels natural
        setTimeout(speakAssistantGreeting, 1200);

        // Auto refresh
        setInterval(updateDashboard, 60000);
    });

})();
