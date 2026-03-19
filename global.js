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
    const activeItem = document.querySelector('.dock-item.active');
    const indicator = document.querySelector('.dock-liquid-indicator');
    
    if(activeItem && indicator) {
      const updateIndicator = (el) => {
        const rect = el.getBoundingClientRect();
        const navRect = el.parentElement.getBoundingClientRect();
        indicator.style.transform = `translateX(${rect.left - navRect.left}px)`;
        indicator.style.width = `${rect.width}px`;
      };

      // INIT
      setTimeout(() => updateIndicator(activeItem), 100);

      // CLICK
      document.querySelectorAll('.dock-item').forEach(item => {
        item.addEventListener('click', function(e) {
          // It will navigate anyway since they are anchor tags, but we animate before page unload
          updateIndicator(this);
        });
      });
    }
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
    // 5. Global Haptics (10ms light tap)
    document.body.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, .list-item, select, input, .ag-card-reveal');
      if (target) {
        if (localStorage.getItem('fin_haptic') !== 'false' && navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
    });
  });

})();
