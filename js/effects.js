// ═══════════════════════════════════════
//  EFFECTS — 시각 효과 (파티클, 팝업, 쉐이크, 리플, 플래시)
// ═══════════════════════════════════════

function shake(amt, fr) { shakeAmt = amt; shakeFr = fr; }
function haptic(ms = 10) { navigator.vibrate?.(ms); }

function popup(x, y, text, color, big) {
  const lineH = big ? 48 : 26;
  let startY = y;
  for (const p of popups) {
    if (Math.abs(p.x - x) < 72) startY = Math.min(startY, p.y - lineH);
  }
  popups.push({ x, y: startY, text, color, life: 1.2, vy: -1.0, big: !!big });
}

function bigPopup(text, color) {
  const baseY = AH / 2 - 70;
  let startY = baseY;
  for (const p of popups) {
    if (Math.abs(p.x - AW / 2) < 120) startY = Math.min(startY, p.y - 52);
  }
  popups.push({ x: AW / 2, y: startY, text, color, life: 1.8, vy: -0.4, big: true });
}

function burstStar(x, y) {
  const colors = ['#c084fc', '#f0c040', '#ff4444', '#7ec850', '#3498db'];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2 + Math.random() * 0.4;
    const spd = 3 + Math.random() * 5;
    particles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
                     r: 4 + Math.random() * 4, color: colors[i % colors.length], life: 1.4 });
  }
}

function spawnStarBurst(x, y) {
  const colors = ['#ffe066', '#ffcc00', '#fff5a0', '#ffaa00', '#ffffff'];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const spd = 3 + Math.random() * 6;
    particles.push({
      x, y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd - 2,
      r: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1.0,
      isStar: Math.random() < 0.5,
    });
  }
}

function burstParticles(r, c, color) {
  const x = GX + c * CELL + CELL / 2;
  const y = GY + r * CELL + CELL / 2;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const spd = 2 + Math.random() * 3.5;
    particles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
                     r: 3 + Math.random() * 3, color, life: 1.0 });
  }
}
