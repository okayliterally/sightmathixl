const $ = id => document.getElementById(id);
const $all = sel => document.querySelectorAll(sel);

const store = {
  get: key => { try { return localStorage.getItem(key); } catch(e) { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, val); } catch(e) {} }
};

const cloakConfig = {
  default: { title: 'sight.w', favicon: 'https://image2url.com/r2/default/images/1772114193046-733bfa71-77a7-4fdc-bce4-d3e8ebe17a29.png' },
  canvas: { title: 'Canvas LMS', favicon: 'https://canvas.instructure.com/favicon.ico' },
  google: { title: 'Google', favicon: 'https://www.google.com/favicon.ico' },
  drive: { title: 'Google Drive', favicon: 'https://drive.google.com/favicon.ico' },
  docs: { title: 'Google Docs', favicon: 'https://docs.google.com/favicon.ico' },
  slides: { title: 'Google Slides', favicon: 'https://slides.google.com/favicon.ico' },
  classroom: { title: 'Google Classroom', favicon: 'https://classroom.google.com/favicon.ico' },
};

const GAMES_SALMON_URL = 'https://tight-breeze-9313.brayyy316.workers.dev/';
const GN_MATH_URL = 'https://okayliterally.github.io/ixllearning/';

let currentTab = 'salmon';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCloak();
  initSettings();
  initGames();
  initNav();
  initKeys();
  initStats();
  updateTime();
  setInterval(updateTime, 1000);
  setTimeout(() => $('loadingScreen').classList.add('hidden'), 1200);
});

function initTheme() {
  const theme = store.get('theme') || 'dark';
  document.body.setAttribute('data-theme', theme);
  updateThemeBtns(theme);
  $all('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.body.setAttribute('data-theme', btn.dataset.theme);
      store.set('theme', btn.dataset.theme);
      updateThemeBtns(btn.dataset.theme);
      const iframe = $('gamesIframe');
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage({ type: 'theme', theme: btn.dataset.theme }, '*');
        } catch(e) {}
      }
    });
  });

  // sync theme to iframe after it loads
  $('gamesIframe').addEventListener('load', () => {
    try {
      $('gamesIframe').contentWindow.postMessage({ type: 'theme', theme: document.body.getAttribute('data-theme') || 'dark' }, '*');
    } catch(e) {}
  });
}

function updateThemeBtns(active) {
  $all('.theme-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === active));
}

function initCloak() {
  const cloak = store.get('cloak') || 'default';
  applyCloak(cloak);
  $all('.cloak-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.set('cloak', btn.dataset.cloak);
      applyCloak(btn.dataset.cloak);
      $all('.cloak-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function applyCloak(cloak) {
  const c = cloakConfig[cloak];
  if (!c) return;
  document.title = c.title;
  const existing = document.getElementById('favicon');
  if (existing) {
    existing.href = c.favicon;
  } else {
    const link = document.createElement('link');
    link.id = 'favicon';
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = c.favicon;
    document.head.appendChild(link);
  }
}

function initSettings() {
  // FPS Booster
  const fps = store.get('fpsBooster') !== 'false';
  $('toggleFpsBooster').classList.toggle('on', fps);
  document.body.classList.toggle('fps-boost-mode', fps);
  $('toggleFpsBooster').onclick = () => {
    const on = $('toggleFpsBooster').classList.toggle('on');
    document.body.classList.toggle('fps-boost-mode', on);
    store.set('fpsBooster', on);
  };

  // Stats
  const stats = store.get('showStats') === 'true';
  $('toggleStats').classList.toggle('on', stats);
  $('statsOverlay').classList.toggle('visible', stats);
  $('toggleStats').onclick = () => {
    const on = $('toggleStats').classList.toggle('on');
    $('statsOverlay').classList.toggle('visible', on);
    store.set('showStats', on);
  };

  // Blur
  const blur = store.get('blur') !== 'false';
  $('toggleBlur').classList.toggle('on', blur);
  document.body.setAttribute('data-blur', blur ? 'true' : 'false');
  $('toggleBlur').onclick = () => {
    const on = $('toggleBlur').classList.toggle('on');
    document.body.setAttribute('data-blur', on ? 'true' : 'false');
    store.set('blur', on);
  };

  // Bypass buttons
  $('aboutBlankBtn').onclick = () => {
    const win = window.open('about:blank', '_blank');
    if (win) {
      win.document.write(`<!DOCTYPE html><html><head><title>Classroom</title></head><body style="margin:0"><iframe src="${location.href}" style="width:100%;height:100vh;border:none"></iframe></body></html>`);
      win.document.close();
    }
  };

  $('panicBtn').onclick = () => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;font-family:Inter,sans-serif;';
    const box = document.createElement('div');
    box.style.cssText = 'background:var(--glass);border:1px solid var(--glass-border);border-radius:16px;padding:28px;text-align:center;';
    const msg = document.createElement('p');
    msg.style.cssText = 'color:var(--fg);font-size:14px;margin-bottom:8px;';
    msg.textContent = 'Press any key to set as panic key';
    const sub = document.createElement('p');
    sub.style.cssText = 'color:var(--muted);font-size:11px;';
    sub.textContent = 'Press ESC to cancel';
    box.appendChild(msg);
    box.appendChild(sub);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    const handler = (e) => {
      e.preventDefault();
      document.removeEventListener('keydown', handler);
      document.body.removeChild(overlay);
      if (e.key === 'Escape') return;
      panicKey = e.key.toUpperCase();
      store.set('panicKey', panicKey);
      $('panicKeyDisplay').textContent = panicKey;
    };
    document.addEventListener('keydown', handler);
  };

  // Animations
  const anims = store.get('animations') !== 'false';
  $('toggleAnimations').classList.toggle('on', anims);
  document.body.classList.toggle('no-animations', !anims);
  $('toggleAnimations').onclick = () => {
    const on = $('toggleAnimations').classList.toggle('on');
    document.body.classList.toggle('no-animations', !on);
    store.set('animations', on);
  };

  // Compact mode
  const compact = store.get('compact') === 'true';
  $('toggleCompact').classList.toggle('on', compact);
  document.body.classList.toggle('compact-mode', compact);
  $('toggleCompact').onclick = () => {
    const on = $('toggleCompact').classList.toggle('on');
    document.body.classList.toggle('compact-mode', on);
    store.set('compact', on);
  };

  // Clear history
  $('toggleClearHistory').onclick = () => {
    const on = $('toggleClearHistory').classList.toggle('on');
    store.set('clearHistory', on);
  };

  // Stealth mode
  const stealth = store.get('stealth') === 'true';
  $('toggleStealth').classList.toggle('on', stealth);
  document.body.classList.toggle('stealth-mode', stealth);
  $('toggleStealth').onclick = () => {
    const on = $('toggleStealth').classList.toggle('on');
    document.body.classList.toggle('stealth-mode', on);
    store.set('stealth', on);
  };

  // Reset all
  $('resetAllBtn').onclick = () => {
    if (confirm('Reset all settings?')) {
      localStorage.clear();
      location.reload();
    }
  };

  // Modals
  $('embedClose').onclick = () => $('embedModal').classList.remove('active');
  $('creditsClose').onclick = () => $('creditsModal').classList.remove('active');
  $('legalClose').onclick = () => $('legalModal').classList.remove('active');

  $('copyEmbedBtn').onclick = () => {
    navigator.clipboard.writeText($('embedCode').value);
    $('copyEmbedBtn').textContent = 'Copied!';
    setTimeout(() => $('copyEmbedBtn').textContent = 'Copy to Clipboard', 1500);
  };

  $all('.legal-tab').forEach(tab => {
    tab.onclick = () => {
      $all('.legal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $('tosContent').style.display = tab.dataset.tab === 'tos' ? 'block' : 'none';
      $('privacyContent').style.display = tab.dataset.tab === 'privacy' ? 'block' : 'none';
    };
  });
}

function triggerPanic() {
  $('panicOverlay').classList.add('active');
  setTimeout(() => location.href = 'https://classroom.google.com', 800);
}

function initGames() {
  // Tab toggle between Games (SALMON) and gn-math
  $('salmonTabBtn').onclick = () => {
    if (currentTab === 'salmon') return;
    currentTab = 'salmon';
    $('salmonTabBtn').classList.add('active');
    $('gnmathTabBtn').classList.remove('active');
    $('gamesIframe').src = GAMES_SALMON_URL;
  };

  $('gnmathTabBtn').onclick = () => {
    if (currentTab === 'gnmath') return;
    currentTab = 'gnmath';
    $('gnmathTabBtn').classList.add('active');
    $('salmonTabBtn').classList.remove('active');
    $('gamesIframe').src = GN_MATH_URL;
  };

  // Reload button
  $('gamesReload').onclick = () => {
    const src = $('gamesIframe').src;
    $('gamesIframe').src = '';
    $('gamesIframe').src = src;
  };

  // Hide bar
  $('gamesHideBar').onclick = () => {
    $('gamesHeader').style.display = 'none';
  };
}

function initNav() {
  function show(page) {
    $('homePage').style.display = 'none';
    $('gamesPage').classList.remove('active');
    $('moviesPage').classList.remove('active');
    $('chatPage').classList.remove('active');
    $('partnersPage').classList.remove('active');
    $('settingsPage').classList.remove('active');
    $all('.nav-link').forEach(l => l.classList.remove('active'));

    if (page === 'home') {
      $('homePage').style.display = 'flex';
      $('homeLink').classList.add('active');
    } else if (page === 'games') {
      $('gamesPage').classList.add('active');
      $('gamesLink').classList.add('active');
      // Show header and iframe directly, load default tab
      $('gamesHeader').style.display = 'flex';
      $('gamesIframeContainer').style.display = 'block';
      // Reset to salmon tab
      currentTab = 'salmon';
      $('salmonTabBtn').classList.add('active');
      $('gnmathTabBtn').classList.remove('active');
      $('gamesIframe').src = GAMES_SALMON_URL;
    } else if (page === 'movies') {
      $('moviesPage').classList.add('active');
      $('moviesLink').classList.add('active');
      $('moviesIframe').src = 'https://www.fmovies.gd/home';
    } else if (page === 'chat') {
      $('chatPage').classList.add('active');
      $('chatLink').classList.add('active');
    } else if (page === 'partners') {
      $('partnersPage').classList.add('active');
      $('partnersLink').classList.add('active');
    } else if (page === 'settings') {
      $('settingsPage').classList.add('active');
    }
  }

  $('homeLink').onclick = () => show('home');
  $('gamesLink').onclick = () => show('games');
  $('moviesLink').onclick = () => show('movies');
  $('chatLink').onclick = () => show('chat');
  $('partnersLink').onclick = () => show('partners');
  $('settingsLink').onclick = () => show('settings');

  $('gamesHome').onclick = () => show('home');
  $('moviesHome').onclick = () => show('home');
  $('chatHome').onclick = () => show('home');
  $('partnersBack').onclick = () => show('home');
  $('settingsBack').onclick = () => show('home');

  $('creditsLink').onclick = () => $('creditsModal').classList.add('active');
  $('legalLink').onclick = () => $('legalModal').classList.add('active');

  $('sidebarCloseBtn').onclick = () => {
    $('sidebar').classList.add('collapsed');
    $('sidebarOpenBtn').classList.add('visible');
    $('mainWrapper').classList.add('expanded');
  };
  $('sidebarOpenBtn').onclick = () => {
    $('sidebar').classList.remove('collapsed');
    $('sidebarOpenBtn').classList.remove('visible');
    $('mainWrapper').classList.remove('expanded');
  };

  if (window.innerWidth <= 768) {
    $('sidebar').classList.add('collapsed');
    $('sidebarOpenBtn').classList.add('visible');
    $('mainWrapper').classList.add('expanded');
  }
}

let panicKey = (store.get('panicKey') || 'P').toUpperCase();
$('panicKeyDisplay').textContent = panicKey;

function initKeys() {
  document.onkeydown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key.toUpperCase() === panicKey) triggerPanic();
  };
}

function initStats() {
  let last = performance.now(), frames = 0;
  function fps() {
    frames++;
    const now = performance.now();
    if (now - last >= 1000) {
      const f = Math.round(frames * 1000 / (now - last));
      $('fpsValue').textContent = f;
      $('fpsValue').className = 'stat-value ' + (f >= 50 ? 'good' : f >= 30 ? 'warn' : 'bad');
      frames = 0;
      last = now;
    }
    requestAnimationFrame(fps);
  }
  requestAnimationFrame(fps);

  setInterval(() => {
    const start = Date.now();
    fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' })
      .then(() => {
        const ping = Date.now() - start;
        $('pingValue').textContent = ping + 'ms';
        $('pingValue').className = 'stat-value ' + (ping < 100 ? 'good' : ping < 300 ? 'warn' : 'bad');
      }).catch(() => $('pingValue').textContent = '--');
  }, 5000);

  if (navigator.getBattery) {
    navigator.getBattery().then(b => {
      function bat() {
        const l = Math.round(b.level * 100);
        $('batteryValue').textContent = l + '%';
        $('batteryValue').className = 'stat-value ' + (l > 20 ? 'good' : 'bad');
      }
      bat();
      b.addEventListener('levelchange', bat);
    });
  }
}

function updateTime() {
  const now = new Date();
  $('time').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  $('date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}
