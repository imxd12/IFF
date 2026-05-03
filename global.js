/* ========================================================================
   MONEYFLOW - GLOBAL JAVASCRIPT & ANTIGRAVITY ENGINE
   Smooth Scrolling (Lenis), GSAP setup, Data Core, Inky Theme Toggle
======================================================================== */

(function () {
  'use strict';

  // ----------------------------------------------------
  // 1. DATA CORE & LOCALSTORAGE SHARING
  // ----------------------------------------------------
  window.loadData = function (key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn(`Failed to load ${key}:`, e);
      return null;
    }
  };

  window.saveData = function (key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Failed to save ${key}:`, e);
      if (e.name === 'QuotaExceededError') {
        window.showSnackbar('Storage full! Please clear old data.', 'error');
      }
      return false;
    }
  };

  window.fmt = function (amount) {
    const sym = localStorage.getItem('fin_currency') || '₹';
    const numstr = Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return sym + numstr;
  };

  // ----------------------------------------------------
  // 1b. PRIVACY MODE & REDUCE MOTION INIT
  // ----------------------------------------------------
  if (localStorage.getItem('fin_privacy_mode') === 'true') {
      document.body.classList.add('privacy-mode');
  }
  if (localStorage.getItem('fin_reduce_motion') === 'true') {
      document.body.classList.add('reduce-motion');
  }

  // ----------------------------------------------------
  // 2. SNACKBAR NOTIFICATION
  // ----------------------------------------------------
  window.showSnackbar = function (message, type = 'success') {
    let snackbar = document.getElementById('globalSnackbar');
    if (!snackbar) {
      snackbar = document.createElement('div');
      snackbar.id = 'globalSnackbar';
      snackbar.className = 'snackbar';
      document.body.appendChild(snackbar);
    }
    
    snackbar.textContent = message;
    
    if (type === 'error') snackbar.style.borderLeft = '4px solid var(--accent-danger)';
    else if (type === 'warning') snackbar.style.borderLeft = '4px solid orange';
    else snackbar.style.borderLeft = '4px solid var(--accent-primary)';

    snackbar.classList.add('show');
    
    clearTimeout(window.snackbarTimer);
    window.snackbarTimer = setTimeout(() => {
      snackbar.classList.remove('show');
    }, 3000);
  };

  // ----------------------------------------------------
  // 3. MUSIC PLAYER (Beat Sync & Progress Ring)
  // ----------------------------------------------------
  let isPlaying = false;
  let audioCtx, analyser, dataArray;

  function initAudioEngine(player) {
      if(audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaElementSource(player);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyser.connect(audioCtx.destination);
      dataArray = new Uint8Array(analyser.frequencyBinCount);
  }

  function renderBeat() {
      if(!isPlaying) {
          const btn = document.getElementById('musicIconBtn');
          if(btn) btn.style.transform = `scale(1)`;
          return;
      }
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for(let i=0; i < dataArray.length; i++) sum += dataArray[i];
      let avg = sum / dataArray.length; // 0 to 255
      
      // Fallback for local files where CORS blocks AnalyserNode
      if (sum === 0) {
          const t = Date.now() / 250; 
          avg = (Math.sin(t) + 1) * 127;
      }
      
      const btn = document.getElementById('musicIconBtn');
      if(btn) {
          const scale = 1 + (avg / 255) * 0.25; 
          btn.style.transform = `scale(${scale})`;
      }
      requestAnimationFrame(renderBeat);
  }

  window.toggleGlobalMusic = function () {
    const player = document.getElementById("globalMusicPlayer");
    const icon = document.getElementById("musicStatusIcon");
    if (!player) return;

    if (!audioCtx) initAudioEngine(player);
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (!isPlaying) {
      player.play().catch(e => console.log("Audio play blocked", e));
      if(icon) {
          icon.setAttribute('data-lucide', 'pause');
          icon.style.marginLeft = '0px'; 
      }
      isPlaying = true;
      renderBeat();
    } else {
      player.pause();
      if(icon) {
          icon.setAttribute('data-lucide', 'play');
          icon.style.marginLeft = '2px';
      }
      isPlaying = false;
    }
    if (window.lucide) lucide.createIcons();
  };

  // Bind Progress Ring globally 
  window.addEventListener('DOMContentLoaded', () => {
      const player = document.getElementById("globalMusicPlayer");
      if(player) {
          player.addEventListener('timeupdate', () => {
              const ring = document.getElementById('musicProgressRing');
              if(ring && player.duration) {
                  const progress = player.currentTime / player.duration;
                  const circumference = 113;
                  ring.style.strokeDashoffset = circumference - (progress * circumference);
              }
          });
      }
  });

  // ----------------------------------------------------
  // 4. THE INKY THEME TOGGLE ENGINE
  // ----------------------------------------------------
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fin_theme', theme);

    const themeNames = document.querySelectorAll('.theme-name-display');
    themeNames.forEach(el => {
      el.textContent = theme === 'dark' ? 'Obsidian Black' : 'Ceramic White';
    });
  }

  window.initInkyTheme = function () {
    const savedTheme = localStorage.getItem('fin_theme') || 'light';
    applyTheme(savedTheme);

    const toggleBtn = document.getElementById('themeToggleBtn');
    if (!toggleBtn) return;

    // Set initial icon
    toggleBtn.innerHTML = savedTheme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';

    toggleBtn.addEventListener('click', (e) => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const nextTheme = isDark ? 'light' : 'dark';

      // Advanced ViewTransitions API for the Inky effect if supported
      if (document.startViewTransition) {
        // Calculate crop circle radius
        const x = e.clientX;
        const y = e.clientY;
        const endRadius = Math.hypot(
          Math.max(x, innerWidth - x),
          Math.max(y, innerHeight - y)
        );

        const transition = document.startViewTransition(() => {
          applyTheme(nextTheme);
          toggleBtn.innerHTML = nextTheme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
          if (window.lucide) lucide.createIcons();
        });

        transition.ready.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ];

          // Animate the root using clip-path
          document.documentElement.animate(
            {
              clipPath: isDark ? [...clipPath].reverse() : clipPath
            },
            {
              duration: 600,
              easing: 'ease-in-out',
              pseudoElement: isDark ? '::view-transition-old(root)' : '::view-transition-new(root)'
            }
          );
        });
      } else {
        // Fallback for browsers without ViewTransitions API
        applyTheme(nextTheme);
        toggleBtn.innerHTML = nextTheme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
        if (window.lucide) lucide.createIcons();
      }
    });
  };

  // ----------------------------------------------------
  // 5. BOTTOM NAVIGATION DOCK LOGIC
  // ----------------------------------------------------
  window.initDockIndicator = function() {
    const dock = document.querySelector('.bottom-dock');
    if (!dock) return;

    // Create the sliding indicator pill
    let indicator = dock.querySelector('.dock-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'dock-indicator';
        // Remove transition temporarily for instant snap on load
        indicator.style.transition = 'none';
        dock.insertBefore(indicator, dock.firstChild);
    }

    const items = dock.querySelectorAll('.dock-item');
    let activeItem = dock.querySelector('.dock-item.active');
    
    // Fallback if none active
    if (!activeItem && items.length > 0) {
        activeItem = items[0];
        activeItem.classList.add('active');
    }

    const updateIndicator = (item) => {
        if (!item) return;
        const dockRect = dock.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        
        // Calculate relative position within the dock
        const leftPos = itemRect.left - dockRect.left;
        
        indicator.style.width = `${itemRect.width}px`;
        indicator.style.transform = `translateY(-50%) translateX(${leftPos}px)`;
        indicator.style.left = '0'; // using transform for smoother GPU accelerated animation
    };

    // Initial position calculation
    setTimeout(() => {
        if(activeItem) updateIndicator(activeItem);
        // Re-enable smooth transitions after initial positioning
        setTimeout(() => {
            indicator.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }, 50);
    }, 150); // slight delay to allow fonts and flexbox to render properly

    // On window resize, re-calculate
    window.addEventListener('resize', () => {
        const currentActive = dock.querySelector('.dock-item.active');
        if(currentActive) updateIndicator(currentActive);
    });

    // Add click listeners to items for a smooth transition before page navigates
    items.forEach(item => {
        item.addEventListener('click', (e) => {
            if (!item.classList.contains('active')) {
                const currentActive = dock.querySelector('.dock-item.active');
                if (currentActive) currentActive.classList.remove('active');
                
                item.classList.add('active');
                updateIndicator(item);
                
                if (window.playUISound) window.playUISound('tap');
            }
        });
    });
  };

  // ----------------------------------------------------
  // 6. GSAP ANTIGRAVITY ENGINE & LENIS SCROLLING
  // ----------------------------------------------------
  window.initAntigravity = function () {
    // 1. Initialize Lenis
    if (typeof Lenis !== 'undefined') {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      
      // Keep scrolltrigger in sync
      if(typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time)=>{
          lenis.raf(time * 1000);
        });
      }
    }

    // 2. Setup GSAP ScrollTrigger physics
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      // Find all elements with data-speed attribute for floating parallax
      const parallaxLocs = document.querySelectorAll("[data-speed]");
      parallaxLocs.forEach(el => {
        const speed = el.getAttribute("data-speed");
        gsap.to(el, {
          y: (i, target) => -1 * parseFloat(speed) * 100,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5 // Smooth catch up
          }
        });
      });

      // General reveal animation for cards
      const floatCards = document.querySelectorAll(".ag-card-reveal");
      floatCards.forEach((card, i) => {
        gsap.fromTo(card, 
          { y: 80, opacity: 0, scale: 0.95 },
          { 
            y: 0, 
            opacity: 1, 
            scale: 1, 
            duration: 1, 
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });
      
      // If reduce motion is enabled, force GSAP to complete instantly
      if (localStorage.getItem('fin_reduce_motion') === 'true') {
          gsap.globalTimeline.timeScale(1000);
      }
    }
  };

  // ----------------------------------------------------
  // 7. NEW ANTIGRAVITY UPGRADES (SOUND, SKILLS, BIRTHDAY, SPLASH, RIPPLE)
  // ----------------------------------------------------

  // A. Advanced UI Sound Engine (Web Audio API Synth - Zero Delay)
  let _audioCtx = null;
  
  window.playUISound = function(type = 'tap') {
    if (localStorage.getItem('fin_sound') === 'off') return;
    
    let intensityRaw = localStorage.getItem('fin_sound_intensity');
    let intensity = intensityRaw ? parseInt(intensityRaw, 10) : 50;
    if (intensity === 0) return;
    
    // Scale baseline gain (50 = 1x multiplier)
    const mult = intensity / 50;

    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (_audioCtx.state === 'suspended') _audioCtx.resume();

      const osc = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();
      const t = _audioCtx.currentTime;

      osc.connect(gain);
      gain.connect(_audioCtx.destination);

      if (type === 'tap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
        gain.gain.setValueAtTime(0.08 * mult, t);
        gain.gain.exponentialRampToValueAtTime(0.001 * mult, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);
      } else if (type === 'on') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(800, t + 0.1);
        gain.gain.setValueAtTime(0.03 * mult, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
      } else if (type === 'off') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.linearRampToValueAtTime(200, t + 0.15);
        gain.gain.setValueAtTime(0.03 * mult, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
      } else if (type === 'whoosh') {
        // Quick noise burst for "back / swipe"
        const bufferSize = _audioCtx.sampleRate * 0.15;
        const buffer = _audioCtx.createBuffer(1, bufferSize, _audioCtx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1; // white noise
        }
        const whiteNoise = _audioCtx.createBufferSource();
        whiteNoise.buffer = buffer;
        
        // Filter it
        const filter = _audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.frequency.linearRampToValueAtTime(100, t + 0.15);
        
        whiteNoise.connect(filter);
        filter.connect(gain);
        
        gain.gain.setValueAtTime(0.08 * mult, t);
        gain.gain.exponentialRampToValueAtTime(0.01 * mult, t + 0.15);
        
        whiteNoise.start(t);
        whiteNoise.stop(t + 0.15);
      }
    } catch(e) { /* Ignore */ }
  };

  // Backwards compat wrap
  window.playClickSound = () => window.playUISound('tap');

  window.initClickSound = function() {
    document.body.addEventListener('pointerdown', (e) => {
      const target = e.target.closest('button, a, .list-item, select, input, .ag-card-reveal, .skill-box');
      if (target) {
        // Check if back button
        if(target.innerHTML && target.innerHTML.includes('arrow-left')) {
            window.playUISound('whoosh');
        } else {
            window.playUISound('tap');
        }
      }
    });
  };

  // B. Ripple Effect
  window.initRippleEffect = function() {
    document.body.addEventListener('click', (e) => {
      const target = e.target.closest('button, a.glass-button, .ripple-btn');
      if (target) {
        const rect = target.getBoundingClientRect();
        const ripple = document.createElement('span');
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;
        
        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = `${e.clientX - rect.left - radius}px`;
        ripple.style.top = `${e.clientY - rect.top - radius}px`;
        ripple.classList.add('ripple-span');
        
        target.classList.add('ripple-btn');
        target.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
      }
    });
  };

  // C. Smart Birthday Feature
  window.initBirthdayCheck = function() {
    const dob = localStorage.getItem('userDOB');
    if (!dob) return;
    
    const username = localStorage.getItem('username') || 'User';
    const dobDate = new Date(dob);
    const today = new Date();
    
    if (dobDate.getMonth() === today.getMonth() && dobDate.getDate() === today.getDate()) {
      // Check if already wished today
      const lastWished = localStorage.getItem('lastWishedYear');
      if (lastWished != today.getFullYear()) {
        localStorage.setItem('lastWishedYear', today.getFullYear());
        
        // Create popup
        const div = document.createElement('div');
        div.className = 'mf-birthday-popup';
        div.innerHTML = `
          <div class="text-4xl mb-4">🎉🎂🎁</div>
          <h2>Happy Birthday,<br>${username}!</h2>
          <p class="text-muted mt-2">Wishing you a fantastic day from MoneyFlow!</p>
        `;
        document.body.appendChild(div);
        
        // Confetti
        const cContainer = document.createElement('div');
        cContainer.className = 'confetti-container';
        document.body.appendChild(cContainer);
        
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
        for(let i=0; i<50; i++) {
          const c = document.createElement('div');
          c.className = 'confetti';
          c.style.left = Math.random() * 100 + 'vw';
          c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          cContainer.appendChild(c);
          
          gsap.fromTo(c, 
            { y: -10, opacity: 1, rotation: 0 }, 
            { 
              y: window.innerHeight + 10, 
              opacity: 0, 
              rotation: Math.random() * 360, 
              duration: 2 + Math.random() * 2,
              delay: Math.random(),
              ease: "power1.out"
            }
          );
        }
        
        // Show Popup
        setTimeout(() => {
          div.classList.add('show');
          if(window.playClickSound) window.playClickSound(); // Ding!
          
          setTimeout(() => {
            div.classList.remove('show');
            setTimeout(() => {
              div.remove();
              cContainer.remove();
            }, 600);
          }, 5000);
        }, 1000);
      }
    }
  };

  // D. Splash Screen
  window.initSplashScreen = function() {
    const splash = document.getElementById('mfSplashScreen');
    if (!splash) return;
    
    // Play splash only on first open across app session
    if (sessionStorage.getItem('mf_splash_seen') === 'true') {
        splash.style.display = 'none'; // Instant hide with no animation if already seen
        return;
    }
    
    // Set to true so it doesn't play repeatedly on refresh
    sessionStorage.setItem('mf_splash_seen', 'true');
    
    const messages = [
        "Initializing Neural Engine...",
        "Syncing Data Core...",
        "Establishing Secure Context...",
        "Loading Antigravity UI...",
        "Welcome to MoneyFlow..."
    ];
    
    const textEl = document.getElementById('splashLoadText');
    let mIdx = 0;
    
    if (textEl) {
        const txtInterval = setInterval(() => {
            mIdx++;
            if(mIdx < messages.length) textEl.textContent = messages[mIdx];
            else clearInterval(txtInterval);
        }, 1100);
    }
    
    // 5.8 seconds total runtime to match loader bar
    setTimeout(() => {
        splash.classList.add('hidden');
        setTimeout(() => splash.remove(), 1000); // 1s wait for CSS opacity transition to complete
    }, 5500);
  };

  // E. Skill Popups logic
  const SKILL_DATA = {
    "HTML5": { desc: "The standard markup language for documents designed to be displayed in a web browser.", example: "Structuring the layout of the MoneyFlow dashboard." },
    "CSS3": { desc: "A style sheet language used for describing the presentation of a document written in HTML.", example: "Creating the glassmorphic Liquid Interface effects." },
    "JS Engine": { desc: "Programming language that conforms to the ECMAScript specification handling interactions.", example: "Powering the physics-based GSAP scroll animations." },
    "PWA INTERFACES": { desc: "Web applications that use modern web capabilities to provide a native app-like experience.", example: "Enabling MoneyFlow to be deeply installed offline on your mobile." },
    "Python": { desc: "A high-level passing programming language with rapid execution mechanics.", example: "Writing automation scripts and backend logic layers." },
    "ES6+": { desc: "Modern JavaScript updates that introduce simpler syntax and powerful new methods.", example: "Using Arrow Functions and Promises for data caching." },
    "C/C++": { desc: "Powerful general-purpose languages used for systemic and hardware-level tasks.", example: "Developing low-level robotic controllers." },
    "Arduino": { desc: "An open-source electronic prototyping platform enabling users to create interactive electronic objects.", example: "Reading sensor data from motors for robotics." },
    "Raspberry Pi": { desc: "A series of small single-board computers used to learn programming and create hardware projects.", example: "Acting as the brain for an automated attendance system." },
    "IoT": { desc: "Internet of Things represents connected sensor networks communicating via the Internet.", example: "Tracking remote EV diagnostic metrics." },
    "Git Versioning": { desc: "A distributed version control system tracking changes in source code.", example: "Managing code branches safely for MoneyFlow production." },
    "Chart.js Nodes": { desc: "A community maintained open-source visualization library.", example: "Rendering the responsive dual-chart analytics in Spendly." },
    "Automation Engines": { desc: "Systems designed to operate automatically with varied control loops.", example: "IRABOT TechEd manufacturing workflow processes." },
    "Robotic Kinematics": { desc: "Study of the motion of multi-degree of freedom robotic setups.", example: "Calculating joint degrees for an articulated arm." },
    "Embedded Systems": { desc: "A computer system with a dedicated function within a larger mechanical structure.", example: "Running real-time vehicle fault diagnostics." }
  };

  window.initSkillPopup = function() {
    const boxes = document.querySelectorAll('.skill-box');
    if (boxes.length === 0) return;
    
    // Ensure modal container exists
    let modal = document.getElementById('skillModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'skillModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content-glass max-w-sm w-full relative">
          <button class="absolute top-4 right-4 text-muted hover:text-red-500 transition-colors" onclick="document.getElementById('skillModal').classList.remove('active')">
            <i data-lucide="x"></i>
          </button>
          <div class="text-center">
            <div id="smIcon" class="w-16 h-16 mx-auto mb-4 bg-glass-hover rounded-2xl flex items-center justify-center border border-glass-border shadow-lg"></div>
            <h2 id="smTitle" class="text-2xl font-extrabold mb-2 text-gradient">Skill Name</h2>
            <p id="smDesc" class="text-sm text-muted mb-4">Description goes here.</p>
            <div class="bg-glass-bg border border-glass-border p-3 rounded-xl text-left">
              <span class="text-xs font-bold text-accent-primary uppercase tracking-wider mb-1 block">Real-Life Example</span>
              <p id="smExample" class="text-sm text-main font-medium">Example practical application.</p>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      // Click outside to close
      modal.addEventListener('click', (e) => {
        if(e.target === modal) modal.classList.remove('active');
      });
    }

    boxes.forEach(box => {
      box.addEventListener('click', function() {
        const textSpan = this.querySelector('span');
        const iconElem = this.querySelector('i');
        const skillName = textSpan ? textSpan.textContent.trim() : 'Unknown';
        
        const details = SKILL_DATA[skillName] || { desc: "A core competency mastered to deliver reliable professional solutions across stacks.", example: "Applied consistently to achieve high-quality results in modern development environments." };
        
        document.getElementById('smTitle').textContent = skillName;
        document.getElementById('smDesc').textContent = details.desc;
        document.getElementById('smExample').textContent = details.example;
        
        // Copy icon
        const iconContainer = document.getElementById('smIcon');
        if (iconElem) {
          iconContainer.innerHTML = '';
          const clonedIcon = iconElem.cloneNode(true);
          clonedIcon.classList.remove('w-8', 'h-8', 'w-10', 'h-10');
          clonedIcon.classList.add('w-8', 'h-8');
          iconContainer.appendChild(clonedIcon);
        }
        
        modal.classList.add('active');
        if(window.lucide) lucide.createIcons();
      });
    });
  };

  // ----------------------------------------------------
  // 8. MONEYFLOW GREETING VOICE ENGINE
  // ----------------------------------------------------
  window.MoneyFlowVoiceEngine = {
      greetings: {
          en: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Good night", welcome: "{timeGreeting}, {username}. Welcome to MoneyFlow." },
          hi: { morning: "सुप्रभात", afternoon: "नमस्कार", evening: "शुभ संध्या", night: "शुभ रात्रि", welcome: "{timeGreeting}, नमस्ते {username}. MoneyFlow में आपका स्वागत है।" },
          ur: { morning: "صبح بخیر", afternoon: "السلام علیکم", evening: "شام بخیر", night: "شب بخیر", welcome: "{timeGreeting}, {username}. MoneyFlow میں آپ کا خوش آمدید ہے۔" },
          mr: { morning: "शुभ सकाळ", afternoon: "नमस्कार", evening: "शुभ संध्या", night: "शुभ रात्री", welcome: "{timeGreeting}, नमस्कार {username}. MoneyFlow मध्ये तुमचं स्वागत आहे." },
          gu: { morning: "સુપ્રભાત", afternoon: "નમસ્કાર", evening: "શુભ સાંજ", night: "શુભ રાત્રિ", welcome: "{timeGreeting}, નમસ્તે {username}. MoneyFlow માં તમારું સ્વાગત છે." },
          pa: { morning: "ਸੁਪ੍ਰਭਾਤ", afternoon: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", evening: "ਸ਼ੁਭ ਸ਼ਾਮ", night: "ਸ਼ੁਭ ਰਾਤ", welcome: "{timeGreeting}, ਸਤ ਸ੍ਰੀ ਅਕਾਲ {username}. MoneyFlow ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ।" },
          ta: { morning: "காலை வணக்கம்", afternoon: "மதிய வணக்கம்", evening: "மாலை வணக்கம்", night: "இரவு வணக்கம்", welcome: "{timeGreeting}, வணக்கம் {username}. MoneyFlow இற்கு வரவேற்கிறோம்." },
          te: { morning: "శుభోదయం", afternoon: "నమస్కారం", evening: "శుభ సాయంత్రం", night: "శుభరాత్రి", welcome: "{timeGreeting}, నమస్కారం {username}. MoneyFlow కు స్వాగతం." },
          kn: { morning: "ಶುಭೋದಯ", afternoon: "ನಮಸ್ಕಾರ", evening: "ಶುಭ ಸಂಜೆ", night: "ಶುಭ ರಾತ್ರಿ", welcome: "{timeGreeting}, ನಮಸ್ಕಾರ {username}. MoneyFlow ಗೆ ಸ್ವಾಗತ." },
          bn: { morning: "সুপ্রভাত", afternoon: "নমস্কার", evening: "শুভ সন্ধ্যা", night: "শুভ রাত্রি", welcome: "{timeGreeting}, নমস্কার {username}. MoneyFlow এ আপনাকে স্বাগতম।" },
          ml: { morning: "സുപ്രഭാതം", afternoon: "നമസ്കാരം", evening: "ശുഭ സായാഹ്നം", night: "ശുഭരാത്രി", welcome: "{timeGreeting}, നമസ്കാരം {username}. MoneyFlow ലേക്ക് സ്വാഗതം." },
          ja: { morning: "おはようございます", afternoon: "こんにちは", evening: "こんばんは", night: "おやすみなさい", welcome: "{timeGreeting} {username}さん。MoneyFlowへようこそ。" },
          es: { morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches", night: "Buenas noches", welcome: "{timeGreeting}, {username}. Bienvenido a MoneyFlow." },
          fr: { morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir", night: "Bonne nuit", welcome: "{timeGreeting}, {username}. Bienvenue à MoneyFlow." },
          de: { morning: "Guten Morgen", afternoon: "Guten Tag", evening: "Guten Abend", night: "Gute Nacht", welcome: "{timeGreeting}, {username}. Willkommen bei MoneyFlow." }
      },
      bcpTags: {
          en: 'en-US', hi: 'hi-IN', ur: 'ur-PK', mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', bn: 'bn-IN', ml: 'ml-IN', ja: 'ja-JP', es: 'es-ES', fr: 'fr-FR', de: 'de-DE'
      },
      getTimeKey(hour) {
          if (hour >= 5 && hour < 12) return "morning";
          if (hour >= 12 && hour < 17) return "afternoon";
          if (hour >= 17 && hour < 22) return "evening";
          return "night";
      },
      getGreeting(language, timeKey, username, useName) {
          const langData = this.greetings[language] || this.greetings['en'];
          const timeGreeting = langData[timeKey] || langData.morning;
          let finalName = (useName && username) ? username : '';
          
          let message = langData.welcome.replace('{timeGreeting}', timeGreeting);
          if (finalName) {
              message = message.replace('{username}', finalName);
          } else {
              message = message.replace(', {username}', '').replace(' {username}さん', '').replace(' {username}', '').replace('नमस्ते ', 'नमस्ते. ').replace('नमस्कार ', 'नमस्कार. ').replace('ਸਤ ਸ੍ਰੀ ਅਕਾਲ ', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ. ');
          }
          return message;
      },
      getVoiceForLang(langCode, savedURI = null) {
          const voices = speechSynthesis.getVoices();
          if (savedURI) {
              const v = voices.find(v => v.voiceURI === savedURI);
              if (v) return v;
          }
          const targetLang = this.bcpTags[langCode] || 'en-US';
          let preferred = voices.find(v => v.lang.startsWith(targetLang) || v.lang.replace('_', '-').startsWith(targetLang));
          if (!preferred) {
              preferred = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha")) || voices[0];
          }
          return preferred;
      },
      speak(forcePlay = false) {
          if (localStorage.getItem("voiceGreeting") === "off") return;
          if (!forcePlay && sessionStorage.getItem("app_session_started") === "true") return;
          
          let hasSpoken = false;
          const hour = new Date().getHours();
          const timeKey = this.getTimeKey(hour);
          const langCode = localStorage.getItem('fin_language') || 'en';
          const username = localStorage.getItem('fin_userName') || 'User';
          const nameLang = localStorage.getItem('fin_nameLanguage') || langCode;
          const useNameStr = localStorage.getItem('fin_useName');
          const useName = useNameStr !== 'false';
          
          const langData = this.greetings[langCode] || this.greetings['en'];
          const timeGreeting = langData[timeKey] || langData.morning;

          const runSpeech = () => {
              if (hasSpoken) return;
              hasSpoken = true;
              
              if (!forcePlay) sessionStorage.setItem("app_session_started", "true");
              document.removeEventListener('click', runSpeech);
              document.removeEventListener('touchstart', runSpeech);

              speechSynthesis.cancel();

              try {
                  const AudioContext = window.AudioContext || window.webkitAudioContext;
                  const ctx = new AudioContext();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.type = 'sine';
                  osc.frequency.setValueAtTime(800, ctx.currentTime);
                  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                  gain.gain.setValueAtTime(0, ctx.currentTime);
                  gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
                  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                  osc.start(ctx.currentTime);
                  osc.stop(ctx.currentTime + 0.5);
              } catch(e) {}

              setTimeout(() => {
                  if (useName && nameLang !== langCode && username.trim() !== '') {
                      const parts = langData.welcome.split('{username}');
                      if (parts.length === 2) {
                          const part1Text = parts[0].replace('{timeGreeting}', timeGreeting);
                          const part2Text = parts[1];
                          
                          const u1 = new SpeechSynthesisUtterance(part1Text);
                          u1.voice = this.getVoiceForLang(langCode, localStorage.getItem('fin_voiceURI'));
                          u1.rate = 0.85;
                          
                          const u2 = new SpeechSynthesisUtterance(username);
                          u2.voice = this.getVoiceForLang(nameLang);
                          u2.rate = 0.85;
                          
                          const u3 = new SpeechSynthesisUtterance(part2Text);
                          u3.voice = this.getVoiceForLang(langCode, localStorage.getItem('fin_voiceURI'));
                          u3.rate = 0.85;
                          
                          speechSynthesis.speak(u1);
                          speechSynthesis.speak(u2);
                          speechSynthesis.speak(u3);
                      } else {
                          const msg = this.getGreeting(langCode, timeKey, username, useName);
                          const u = new SpeechSynthesisUtterance(msg);
                          u.voice = this.getVoiceForLang(langCode, localStorage.getItem('fin_voiceURI'));
                          u.rate = 0.85;
                          speechSynthesis.speak(u);
                      }
                  } else {
                      const msg = this.getGreeting(langCode, timeKey, username, useName);
                      const u = new SpeechSynthesisUtterance(msg);
                      u.voice = this.getVoiceForLang(langCode, localStorage.getItem('fin_voiceURI'));
                      u.rate = 0.85;
                      speechSynthesis.speak(u);
                  }
              }, 400);
          };

          if (speechSynthesis.getVoices().length === 0) {
              speechSynthesis.addEventListener('voiceschanged', runSpeech, { once: true });
          } else {
              runSpeech();
          }

          document.addEventListener('click', runSpeech);
          document.addEventListener('touchstart', runSpeech);
      }
  };

  // ----------------------------------------------------
  // BOOTSTRAP
  // ----------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    // 1. Theme
    initInkyTheme();
    // 2. Dock Indicator
    initDockIndicator();
    // 3. Antigravity & Smooth Scrolling
    initAntigravity();
    // 4. Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }
    // 5. Upgrade Initializations
    initClickSound();
    initRippleEffect();
    initSplashScreen();
    initBirthdayCheck();
    window.setupCustomDropdowns();
    window.setupCustomDatePickers();
    
    // Defer skill popups slightly to ensure DOM is ready
    setTimeout(initSkillPopup, 100);

    // 6. Global Haptics (Variable intensity)
    document.body.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, .list-item, select, input, .ag-card-reveal, .skill-box, .tab-btn');
      if (target) {
        if (localStorage.getItem('fin_haptic') !== 'false' && navigator.vibrate) {
          let hapticRaw = localStorage.getItem('fin_haptic_intensity');
          let hapticInt = hapticRaw ? parseInt(hapticRaw, 10) : 50;
          if (hapticInt > 0) {
            // Map 1-100 to 2ms - 40ms vibration duration
            let duration = Math.max(2, Math.floor(hapticInt * 0.4));
            navigator.vibrate(duration);
          }
        }
      }
    });
  });

  // ----------------------------------------------------
  // GLOBAL MODAL ENGINE (REPLACES PROMPT / CONFIRM)
  // ----------------------------------------------------
  window.showConfirmModal = function(title, text, confirmBtnText, onConfirm) {
      if(window.playUISound) window.playUISound('tap');
      const overlay = document.createElement('div');
      overlay.className = 'global-modal-overlay active';
      overlay.innerHTML = `
          <div class="global-modal-content max-w-sm w-full mx-4 relative p-6 border border-white/10 shadow-[0_0_40px_rgba(239,68,68,0.15)] rounded-3xl overflow-hidden backdrop-blur-2xl bg-black/40">
              <div class="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent pointer-events-none"></div>
              <div class="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
                  <i data-lucide="alert-triangle" class="w-8 h-8"></i>
              </div>
              <h2 class="text-2xl font-extrabold mb-2 text-center theme-text">${title}</h2>
              <p class="text-sm text-center text-muted mb-6 relative z-10">${text}</p>
              <div class="flex gap-3 relative z-10">
                  <button class="flex-1 py-3 rounded-xl font-bold bg-white/5 text-muted hover:text-white transition-colors border border-white/10" id="btnCancelModal">Cancel</button>
                  <button class="flex-1 py-3 rounded-xl font-bold bg-rose-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all" id="btnConfirmModal">${confirmBtnText}</button>
              </div>
          </div>
      `;
      document.body.appendChild(overlay);
      if (window.lucide) lucide.createIcons();
      
      const close = () => { overlay.classList.remove('active'); setTimeout(()=>overlay.remove(), 300); };
      document.getElementById('btnCancelModal').onclick = close;
      document.getElementById('btnConfirmModal').onclick = () => {
          close();
          onConfirm();
      };
  };

  window.showPromptModal = function(title, defaultValue, placeholder, onConfirm) {
      if(window.playUISound) window.playUISound('tap');
      const overlay = document.createElement('div');
      overlay.className = 'global-modal-overlay active';
      overlay.innerHTML = `
          <div class="global-modal-content max-w-sm w-full mx-4 relative p-6 border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.15)] rounded-3xl overflow-hidden backdrop-blur-2xl bg-black/40">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none"></div>
              <h2 class="text-xl font-extrabold mb-4 text-center theme-text flex justify-center items-center gap-2 relative z-10"><i data-lucide="edit-3" class="text-blue-500 w-5 h-5"></i> ${title}</h2>
              <input type="text" id="promptModalInput" class="glass-input w-full mb-6 !py-3 text-center text-lg shadow-inner relative z-10 border-blue-500/30" placeholder="${placeholder}" value="${defaultValue}">
              <div class="flex gap-3 relative z-10">
                  <button class="flex-1 py-3 rounded-xl font-bold bg-white/5 text-muted hover:text-white transition-colors border border-white/10" id="btnCancelPrompt">Cancel</button>
                  <button class="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all" id="btnConfirmPrompt">Save</button>
              </div>
          </div>
      `;
      document.body.appendChild(overlay);
      if (window.lucide) lucide.createIcons();
      
      const input = document.getElementById('promptModalInput');
      input.focus();
      
      const close = () => { overlay.classList.remove('active'); setTimeout(()=>overlay.remove(), 300); };
      document.getElementById('btnCancelPrompt').onclick = close;
      document.getElementById('btnConfirmPrompt').onclick = () => {
          const val = input.value;
          close();
          onConfirm(val);
      };
  };

  // ----------------------------------------------------
  // CUSTOM UI DROPDOWNS ENGINE
  // ----------------------------------------------------
  window.setupCustomDropdowns = function() {
      const selects = document.querySelectorAll('select.custom-select');
      
      selects.forEach(select => {
          // If already processed, we only update the options if needed (handled via observer later)
          if (select.dataset.customUiGenerated === 'true') return;
          
          select.classList.add('hidden');
          select.dataset.customUiGenerated = 'true';
          
          const hasSearch = select.dataset.search === 'true';
          
          // Wrapper
          const wrapper = document.createElement('div');
          wrapper.className = 'custom-dropdown relative w-full mb-1';
          
          // Toggle Button
          const toggle = document.createElement('div');
          toggle.className = 'custom-toggle';
          
          // Get initially selected text
          let selectedText = 'Select Option';
          if (select.options.length > 0) {
              const selectedOpt = select.options[select.selectedIndex];
              selectedText = selectedOpt ? selectedOpt.textContent : select.options[0].textContent;
          }
          
          toggle.innerHTML = `
              <span class="custom-toggle-text text-sm truncate">${selectedText}</span>
              <i data-lucide="chevron-down" class="w-4 h-4 flex-shrink-0 text-muted ml-2"></i>
          `;
          
          // Menu container
          const menu = document.createElement('div');
          menu.className = 'custom-menu';
          
          let searchContainerHtml = '';
          if (hasSearch) {
              searchContainerHtml = `
                  <div class="custom-search-container">
                      <input type="text" class="custom-search-input" placeholder="Search...">
                  </div>
              `;
          }
          
          menu.innerHTML = `
              ${searchContainerHtml}
              <div class="custom-list"></div>
          `;
          
          wrapper.appendChild(toggle);
          wrapper.appendChild(menu);
          select.parentNode.insertBefore(wrapper, select.nextSibling);
          
          if (window.lucide) window.lucide.createIcons({root: toggle});
          
          const toggleTextSpan = toggle.querySelector('.custom-toggle-text');
          const listContainer = menu.querySelector('.custom-list');
          const searchInput = menu.querySelector('.custom-search-input');
          
          // Render options
          const renderOptions = (filter = '') => {
              listContainer.innerHTML = '';
              Array.from(select.options).forEach((opt, index) => {
                  if (filter && !opt.textContent.toLowerCase().includes(filter.toLowerCase())) return;
                  if (opt.value === '' && !opt.textContent.trim()) return; // Skip completely empty placeholder
                  
                  const optionEl = document.createElement('div');
                  optionEl.className = 'custom-option';
                  if (opt.selected) optionEl.classList.add('selected');
                  
                  optionEl.textContent = opt.textContent;
                  
                  optionEl.addEventListener('click', () => {
                      // Update native select
                      select.selectedIndex = index;
                      // Update toggle UI
                      toggleTextSpan.textContent = opt.textContent;
                      // Trigger change event for listeners
                      select.dispatchEvent(new Event('change', { bubbles: true }));
                      
                      // Close menu
                      wrapper.classList.remove('open');
                      
                      // Update selected UI
                      Array.from(listContainer.children).forEach(c => c.classList.remove('selected'));
                      optionEl.classList.add('selected');
                      
                      if(window.playUISound) window.playUISound('tap');
                  });
                  listContainer.appendChild(optionEl);
              });
          };
          
          renderOptions();
          
          // Toggle UI Logic
          toggle.addEventListener('click', (e) => {
              e.stopPropagation();
              if (select.disabled) return;
              
              const wasOpen = wrapper.classList.contains('open');
              // Close all others
              document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
              
              if (!wasOpen) {
                  // Smart positioning logic
                  const rect = toggle.getBoundingClientRect();
                  const spaceBelow = window.innerHeight - rect.bottom;
                  const menuHeight = 250; // Estimated max height of menu
                  if (spaceBelow < menuHeight && rect.top > menuHeight) {
                      menu.style.top = 'auto';
                      menu.style.bottom = '100%';
                      menu.style.marginTop = '0';
                      menu.style.marginBottom = '0.75rem';
                  } else {
                      menu.style.bottom = 'auto';
                      menu.style.top = '100%';
                      menu.style.marginBottom = '0';
                      menu.style.marginTop = '0.75rem';
                  }

                  wrapper.classList.add('open');
                  if (hasSearch && searchInput) {
                      searchInput.value = '';
                      renderOptions();
                      setTimeout(() => searchInput.focus(), 100);
                  }
                  if(window.playUISound) window.playUISound('tap');
              }
          });
          
          if (hasSearch && searchInput) {
              searchInput.addEventListener('input', (e) => {
                  renderOptions(e.target.value);
              });
              searchInput.addEventListener('click', e => e.stopPropagation());
          }
          
          // Close clicking outside
          document.addEventListener('click', (e) => {
              if (!wrapper.contains(e.target)) {
                  wrapper.classList.remove('open');
              }
          });
          
          // Observer to watch for programmatic option changes (like category generation)
          const observer = new MutationObserver(() => {
              // Update toggle text in case selection changed via JS
              if (select.options.length > 0) {
                  const selectedOpt = select.options[select.selectedIndex];
                  if(selectedOpt) toggleTextSpan.textContent = selectedOpt.textContent;
              }
              if (wrapper.classList.contains('open')) {
                 renderOptions(searchInput ? searchInput.value : '');
              } else {
                 renderOptions();
              }
              
              if (select.disabled) {
                  toggle.classList.add('disabled');
              } else {
                  toggle.classList.remove('disabled');
              }
          });
          
          observer.observe(select, { childList: true, attributes: true, attributeFilter: ['disabled'] });
      });
  };

  // ----------------------------------------------------
  // CUSTOM UI CALENDAR DATE PICKER ENGINE
  // ----------------------------------------------------
  window.setupCustomDatePickers = function() {
      const dateInputs = document.querySelectorAll('input.custom-date');
      
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      dateInputs.forEach(input => {
          if (input.dataset.customCalendarInitialized) return;
          input.dataset.customCalendarInitialized = "true";
          
          input.readOnly = true;

          const wrapper = document.createElement('div');
          wrapper.className = 'relative inline-block w-full calendar-wrapper';
          
          input.parentNode.insertBefore(wrapper, input);
          wrapper.appendChild(input);
          
          const popup = document.createElement('div');
          popup.className = 'calendar-popup';
          
          let currentDate = input.value ? new Date(input.value) : new Date();
          if(isNaN(currentDate.getTime())) currentDate = new Date();
          
          let currentMonth = currentDate.getMonth();
          let currentYear = currentDate.getFullYear();
          let selectedDateStr = input.value;
          let calendarMode = 'days';
          let yearPageStart = currentYear - (currentYear % 15);

          const renderCalendar = () => {
              popup.innerHTML = '';
              
              const header = document.createElement('div');
              header.className = 'calendar-header';
              
              const prevBtn = document.createElement('button');
              prevBtn.innerHTML = '<i data-lucide="chevron-left"></i>';
              
              const nextBtn = document.createElement('button');
              nextBtn.innerHTML = '<i data-lucide="chevron-right"></i>';
              
              const titleSpan = document.createElement('span');
              titleSpan.className = 'calendar-month-year';
              
              if (calendarMode === 'days') {
                  titleSpan.textContent = `${monthNames[currentMonth]} ${currentYear}`;
                  titleSpan.onclick = (e) => { e.stopPropagation(); calendarMode = 'months'; renderCalendar(); };
                  prevBtn.onclick = (e) => { e.stopPropagation(); currentMonth--; if(currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); };
                  nextBtn.onclick = (e) => { e.stopPropagation(); currentMonth++; if(currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(); };
              } else if (calendarMode === 'months') {
                  titleSpan.textContent = `${currentYear}`;
                  titleSpan.onclick = (e) => { e.stopPropagation(); calendarMode = 'years'; yearPageStart = currentYear - (currentYear % 15); renderCalendar(); };
                  prevBtn.onclick = (e) => { e.stopPropagation(); currentYear--; renderCalendar(); };
                  nextBtn.onclick = (e) => { e.stopPropagation(); currentYear++; renderCalendar(); };
              } else if (calendarMode === 'years') {
                  titleSpan.textContent = `${yearPageStart} - ${yearPageStart + 14}`;
                  titleSpan.onclick = (e) => { e.stopPropagation(); calendarMode = 'days'; renderCalendar(); };
                  prevBtn.onclick = (e) => { e.stopPropagation(); yearPageStart -= 15; renderCalendar(); };
                  nextBtn.onclick = (e) => { e.stopPropagation(); yearPageStart += 15; renderCalendar(); };
              }
              
              header.appendChild(prevBtn);
              header.appendChild(titleSpan);
              header.appendChild(nextBtn);
              popup.appendChild(header);
              
              if (calendarMode === 'days') {
                  const grid = document.createElement('div');
                  grid.className = 'calendar-grid';
                  
                  days.forEach(d => {
                      const wd = document.createElement('div');
                      wd.className = 'calendar-weekday';
                      wd.textContent = d;
                      grid.appendChild(wd);
                  });
                  
                  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
                  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                  
                  for (let i = 0; i < firstDay; i++) {
                      const empty = document.createElement('div');
                      empty.className = 'calendar-day empty';
                      grid.appendChild(empty);
                  }
                  
                  const todayStr = new Date().toISOString().split('T')[0];
                  
                  for (let i = 1; i <= daysInMonth; i++) {
                      const dayEl = document.createElement('div');
                      dayEl.className = 'calendar-day';
                      dayEl.textContent = i;
                      
                      const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                      
                      if (dStr === todayStr) dayEl.classList.add('today');
                      if (dStr === selectedDateStr) dayEl.classList.add('selected');
                      
                      dayEl.onclick = (e) => {
                          e.stopPropagation();
                          selectedDateStr = dStr;
                          input.value = dStr;
                          input.dispatchEvent(new Event('change', { bubbles: true }));
                          wrapper.classList.remove('open');
                          renderCalendar();
                          if(window.playUISound) window.playUISound('tap');
                      };
                      grid.appendChild(dayEl);
                  }
                  popup.appendChild(grid);
              } 
              else if (calendarMode === 'months') {
                  const grid = document.createElement('div');
                  grid.className = 'calendar-mode-grid';
                  monthNames.forEach((m, index) => {
                      const mEl = document.createElement('div');
                      mEl.className = 'calendar-mode-item';
                      mEl.textContent = m.substring(0, 3);
                      if (index === currentMonth) mEl.classList.add('selected');
                      mEl.onclick = (e) => {
                          e.stopPropagation();
                          currentMonth = index;
                          calendarMode = 'days';
                          renderCalendar();
                          if(window.playUISound) window.playUISound('tap');
                      };
                      grid.appendChild(mEl);
                  });
                  popup.appendChild(grid);
              }
              else if (calendarMode === 'years') {
                  const grid = document.createElement('div');
                  grid.className = 'calendar-mode-grid';
                  for (let i = 0; i < 15; i++) {
                      const y = yearPageStart + i;
                      const yEl = document.createElement('div');
                      yEl.className = 'calendar-mode-item';
                      yEl.textContent = y;
                      if (y === currentYear) yEl.classList.add('selected');
                      yEl.onclick = (e) => {
                          e.stopPropagation();
                          currentYear = y;
                          calendarMode = 'months';
                          renderCalendar();
                          if(window.playUISound) window.playUISound('tap');
                      };
                      grid.appendChild(yEl);
                  }
                  popup.appendChild(grid);
              }
              
              if (window.lucide) window.lucide.createIcons({ root: popup });
          };
          
          wrapper.appendChild(popup);
          
          input.addEventListener('click', (e) => {
              e.stopPropagation();
              // close others
              document.querySelectorAll('.calendar-wrapper.open').forEach(w => {
                  if (w !== wrapper) w.classList.remove('open');
              });
              wrapper.classList.toggle('open');
              if (wrapper.classList.contains('open')) {
                  if (input.value) {
                      const d = new Date(input.value);
                      if(!isNaN(d.getTime())) {
                          currentMonth = d.getMonth();
                          currentYear = d.getFullYear();
                          selectedDateStr = input.value;
                      }
                  }
                  renderCalendar();
                  if(window.playUISound) window.playUISound('tap');
              }
          });
          
          popup.addEventListener('click', e => e.stopPropagation());
          
          document.addEventListener('click', (e) => {
              if (!wrapper.contains(e.target)) {
                  wrapper.classList.remove('open');
              }
          });
      });
  };

})();
