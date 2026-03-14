// ═══════════════════════════════════════
//  MAIN — 부팅, 리사이즈
// ═══════════════════════════════════════

function resizeApp() {
  const scale = Math.min(window.innerWidth / AW, window.innerHeight / AH);
  const app = document.getElementById('app');
  const left = (window.innerWidth  - AW * scale) / 2;
  const top  = (window.innerHeight - AH * scale) / 2;
  app.style.transform = `scale(${scale})`;
  app.style.left = Math.max(0, left) + 'px';
  app.style.top  = Math.max(0, top)  + 'px';
}

resizeApp();
window.addEventListener('resize', resizeApp);

// ── BOOT ──
showMain();
