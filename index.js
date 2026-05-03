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

        // AI Spend Predictor Logic
        const currentMonthTotalDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const currentDay = new Date().getDate();
        
        let runRate = 0;
        let predictedSpend = 0;
        if(currentDay > 0) {
            runRate = monthlyExpense / currentDay;
            predictedSpend = runRate * currentMonthTotalDays;
        }

        const aiPredictedSpendEl = document.getElementById('aiPredictedSpend');
        const aiRunRateEl = document.getElementById('aiRunRate');
        const aiPredictorBarEl = document.getElementById('aiPredictorBar');

        if(aiPredictedSpendEl) aiPredictedSpendEl.textContent = `₹${predictedSpend.toFixed(0)}`;
        if(aiRunRateEl) aiRunRateEl.textContent = `₹${runRate.toFixed(0)} / day`;
        
        if(aiPredictorBarEl) {
            let budget = monthlyIncome > 0 ? monthlyIncome : (predictedSpend > 0 ? predictedSpend * 1.2 : 100); 
            let barWidth = Math.min((predictedSpend / budget) * 100, 100);
            aiPredictorBarEl.style.width = `${barWidth}%`;
            
            if(barWidth > 90) aiPredictorBarEl.className = "h-full transition-all duration-1000 ease-out bg-rose-500";
            else if(barWidth > 70) aiPredictorBarEl.className = "h-full transition-all duration-1000 ease-out bg-amber-500";
            else aiPredictorBarEl.className = "h-full transition-all duration-1000 ease-out bg-emerald-500";
        }

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

        let playlist = [];
        let currentTrackIndex = 0;
        
        let audioCtx, analyser, dataArray, canvasCtx;
        let isVisualizerInit = false;

        const formatTime = (time) => {
            if(isNaN(time)) return "0:00";
            const min = Math.floor(time / 60);
            const sec = Math.floor(time % 60);
            return `${min}:${sec < 10 ? '0' : ''}${sec}`;
        };

        const player = document.getElementById('globalMusicPlayer');
        const playPauseBtn = document.getElementById('musicModalPlayPause');
        const playIcon = document.getElementById('musicModalPlayIcon');
        const modalTrackName = document.getElementById('modalTrackName');
        const currentTimeEl = document.getElementById('musicModalCurrentTime');
        const durationEl = document.getElementById('musicModalDuration');
        const seekSlider = document.getElementById('musicModalSeek');
        const volSlider = document.getElementById('musicModalVolume');
        const fileInput = document.getElementById('localAudioFile');
        const loadBtn = document.getElementById('loadDeviceAudioBtn');
        const visualizerBox = document.getElementById('musicVisualizerBox');
        const canvas = document.getElementById('audioVisualizerCanvas');

        // Init Volume
        const savedVol = localStorage.getItem('fin_musicVolume');
        if(savedVol !== null && volSlider) {
            player.volume = parseFloat(savedVol);
            volSlider.value = parseFloat(savedVol) * 100;
            volSlider.style.setProperty('--val', `${volSlider.value}%`);
        } else if (volSlider) {
            volSlider.value = player.volume * 100;
            volSlider.style.setProperty('--val', `${volSlider.value}%`);
        }

        const initVisualizer = () => {
            if(isVisualizerInit || !canvas) return;
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
                const source = audioCtx.createMediaElementSource(player);
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64; 
                source.connect(analyser);
                analyser.connect(audioCtx.destination);
                
                canvasCtx = canvas.getContext('2d');
                const bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
                isVisualizerInit = true;
                drawVisualizer();
            } catch(e) {
                console.log("Audio API init error (maybe CORS):", e);
            }
        };

        const drawVisualizer = () => {
            requestAnimationFrame(drawVisualizer);
            if(!isVisualizerInit || !canvas || player.paused) return;
            
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            analyser.getByteFrequencyData(dataArray);
            
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / dataArray.length) * 1.5;
            let barHeight;
            let x = 0;
            
            for(let i = 0; i < dataArray.length; i++) {
                barHeight = dataArray[i] / 2.5; 
                
                const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, '#10b981'); // Emerald
                gradient.addColorStop(1, '#06b6d4'); // Cyan
                
                canvasCtx.fillStyle = gradient;
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };

        const startPress = (e) => {
            if (e.button && e.button !== 0) return;
            isLongPress = false;
            musicBtn.style.transform = 'scale(0.9)';
            
            pressTimer = setTimeout(() => {
                isLongPress = true;
                if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
                modal.classList.add('active');
                updateModalUIState();
            }, 3000); 
        };

        const cancelPress = () => {
            clearTimeout(pressTimer);
            musicBtn.style.transform = 'scale(1)';
        };

        const executeClick = (e) => {
            cancelPress();
            if(!isLongPress) {
                if(window.toggleGlobalMusic) window.toggleGlobalMusic();
                updateModalUIState();
            }
        };

        musicBtn.addEventListener('pointerdown', startPress);
        musicBtn.addEventListener('pointerup', executeClick);
        musicBtn.addEventListener('pointerleave', cancelPress);

        document.getElementById('closeMusicModalBtn').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.remove('active');
        });

        const updateModalUIState = () => {
             if (player.paused) {
                 playIcon.setAttribute('data-lucide', 'play');
                 if(visualizerBox) visualizerBox.classList.remove('animate-vinyl');
             } else {
                 playIcon.setAttribute('data-lucide', 'pause');
                 if(visualizerBox) visualizerBox.classList.add('animate-vinyl');
                 if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
             }
             if(window.lucide) lucide.createIcons();
        };

        const playTrack = (index) => {
            if(playlist.length === 0) return;
            if(index >= playlist.length) index = 0;
            if(index < 0) index = playlist.length - 1;
            
            currentTrackIndex = index;
            const track = playlist[currentTrackIndex];
            
            player.src = track.url;
            modalTrackName.textContent = track.name;
            player.play().then(() => {
                initVisualizer();
                updateModalUIState();
                const headerIcon = document.getElementById("musicStatusIcon");
                if(headerIcon) headerIcon.setAttribute('data-lucide', 'pause');
                if(window.lucide) lucide.createIcons();
            }).catch(e => console.log('Autoplay prevented', e));
        };

        playPauseBtn.addEventListener('click', () => {
            if(window.toggleGlobalMusic) {
                window.toggleGlobalMusic();
            } else {
                if(player.paused) player.play(); else player.pause();
            }
            initVisualizer();
            updateModalUIState();
        });

        document.getElementById('musicModalNext').addEventListener('click', () => {
            if(playlist.length > 0) {
                playTrack(currentTrackIndex + 1);
            } else {
                player.currentTime += 15;
            }
        });
        document.getElementById('musicModalPrev').addEventListener('click', () => {
            if(playlist.length > 0) {
                playTrack(currentTrackIndex - 1);
            } else {
                player.currentTime = Math.max(0, player.currentTime - 15);
            }
        });

        player.addEventListener('timeupdate', () => {
            if(!modal.classList.contains('active')) return;
            currentTimeEl.textContent = formatTime(player.currentTime);
            if(player.duration) {
                durationEl.textContent = formatTime(player.duration);
                const progress = (player.currentTime / player.duration) * 100;
                seekSlider.value = progress;
                seekSlider.style.setProperty('--val', `${progress}%`);
            }
        });
        
        player.addEventListener('loadedmetadata', () => {
            durationEl.textContent = formatTime(player.duration);
        });

        player.addEventListener('ended', () => {
            if(playlist.length > 0) {
                playTrack(currentTrackIndex + 1);
            }
        });

        seekSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            e.target.style.setProperty('--val', `${val}%`);
            const seekTime = (val / 100) * player.duration;
            player.currentTime = seekTime;
        });

        if(volSlider) {
            volSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                e.target.style.setProperty('--val', `${val}%`);
                const vol = val / 100;
                player.volume = vol;
                localStorage.setItem('fin_musicVolume', vol);
            });
        }

        loadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                const wasEmpty = playlist.length === 0;
                
                files.forEach(file => {
                    playlist.push({
                        name: file.name.replace(/\.[^/.]+$/, ""),
                        url: URL.createObjectURL(file)
                    });
                });
                
                showSnackbar(`Loaded ${files.length} audio track(s) ✨`);
                
                if(wasEmpty) {
                    playTrack(0);
                }
            }
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
        initMusicModalLogic();

        // Voice greeting after a tiny timeout to ensure it feels natural
        setTimeout(speakAssistantGreeting, 1200);

        // Auto refresh
        setInterval(updateDashboard, 60000);
    });

})();
