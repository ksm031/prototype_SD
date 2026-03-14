// ═══════════════════════════════════════
//  GRID — 그리드 시스템 (블록 생성, 체인, 중력, 애니메이션)
// ═══════════════════════════════════════

function mkBlock(color) {
  const legendRate = (char && char.legendSpawnRate) ? char.legendSpawnRate : 0.002;
  if (!color && Math.random() < legendRate) color = 'legendary';
  return { color: color || COLORS[Math.floor(Math.random() * COLORS.length)], chainId: -1, hp: 1, animY: null, fallV: 0 };
}

function initGrid() {
  grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => mkBlock())
  );
  buildChains();
}

function buildChains() {
  const vis = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  let id = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!vis[r][c] && grid[r][c]) {
        bfs(r, c, id++, vis);
      }
    }
  }
}

function bfs(sr, sc, id, vis) {
  const color = grid[sr][sc].color;
  const q = [[sr, sc]];
  while (q.length) {
    const [r, c] = q.shift();
    if (vis[r][c]) continue;
    vis[r][c] = true;
    grid[r][c].chainId = id;
    if (color === 'legendary' || grid[r][c].item || grid[r][c].steel || grid[r][c].ice || grid[r][c].rot || grid[r][c].shield) continue;
    for (const [nr, nc] of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]) {
      if (inB(nr, nc) && !vis[nr][nc] && grid[nr][nc]?.color === color)
        q.push([nr, nc]);
    }
  }
}

function getChain(id) {
  const res = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c]?.chainId === id) res.push({ r, c });
  return res;
}

function inB(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }

function isProtectedByShield(r, c) {
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nr = r + dr, nc = c + dc;
    if (inB(nr, nc) && grid[nr][nc]?.shield) return true;
  }
  return false;
}

function isPlainBlock(b) {
  return b && !b.steel && !b.item && !b.timebomb &&
         !b.ice && !b.split && !b.mirror && !b.petrified &&
         !b.shield && !b.rot && !b.revive && b.color !== 'legendary';
}

function removeBlock(r, c, byExplosion) {
  if (!grid[r][c]) return false;
  const blk = grid[r][c];
  const color = blk.color;
  const bx = GX + c * CELL + CELL / 2, by = GY + r * CELL;

  if (!blk.shield && isProtectedByShield(r, c)) {
    ripples.push({ x: bx, y: by + CELL / 2, rad: CELL * 0.4, life: 0.6 });
    popup(bx, by - 4, '🛡', '#88aaff');
    return false;
  }

  if (blk.steel) {
    if (char.steelBreaker || byExplosion) {
      burstParticles(r, c, '#aab4c2');
      grid[r][c] = null;
      return true;
    }
    ripples.push({ x: bx, y: by + CELL / 2, rad: CELL * 0.4, life: 0.6 });
    shake(3, 4);
    popup(bx, by - 4, '🔒', '#aab4c2');
    return false;
  }

  if (blk.ice && !byExplosion) {
    ripples.push({ x: bx, y: by + CELL / 2, rad: CELL * 0.4, life: 0.6 });
    popup(bx, by - 4, '🧊', '#88ccff');
    return false;
  }

  if (blk.petrified && blk.hp > 1) {
    blk.hp = 1;
    blk.cracked = true;
    shake(2, 3);
    burstParticles(r, c, '#cc9955');
    popup(bx, by - 4, '💥', '#cc9955');
    return false;
  }

  // ── 실제 파괴 ──
  burstParticles(r, c, BCOLOR[color] || '#ffffff');

  if (blk.ice) {
    slowFactor = 0.4;
    safeTimeout(() => { if (gstate === 'playing') slowFactor = 1.0; }, 2000);
    bigPopup('❄️ FREEZE!', '#88ccff');
  }

  if (blk.split) {
    const empties = [];
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r + dr, nc = c + dc;
      if (inB(nr, nc) && !grid[nr][nc]) empties.push([nr, nc]);
    }
    empties.sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(2, empties.length); i++) {
      const [nr, nc] = empties[i];
      grid[nr][nc] = mkBlock(COLORS[Math.floor(Math.random() * COLORS.length)]);
      grid[nr][nc].animY = GY + nr * CELL;
    }
    popup(bx, by - 4, '🔀 SPLIT', '#ff88cc', true);
  }

  if (blk.revive) {
    reviveQueue.push({ r, c, color: blk.origColor || color, timer: REVIVE_DELAY });
    popup(bx, by - 4, '💀 +15s', '#cc44ff');
  }

  if (blk.item === 'firework') { grid[r][c] = null; triggerFirework(r, c); return true; }
  if (blk.item === 'bomb')     { grid[r][c] = null; triggerBomb(r, c);     return true; }

  if (color === 'legendary') {
    const bonus = (char && char.legendMatBonus) ? char.legendMatBonus : 0;
    const rareGain = 1 + bonus;
    const m = getMats(); m.rare = (m.rare || 0) + rareGain; saveMats(m);
    const prog = getRunProg(); prog.lifetimeLegendary++; saveRunProg(prog);
    spawnStarBurst(bx, by + CELL / 2);
    popups.push({ x: bx, y: by, text: '⭐ +' + rareGain, color: '#ffe066', life: 1.0, vy: -1.8, big: true });
    if (char && char.legendHeal > 0) {
      const healAmt = Math.round(char.maxHp * char.legendHeal);
      char.hp = Math.min(char.maxHp, char.hp + healAmt);
      popups.push({ x: bx, y: by - 20, text: '💎 +' + healAmt + 'HP', color: '#88eeff', life: 1.0, vy: -1.5, big: false });
    }
  } else if (sDestroyed[color] !== undefined) {
    sDestroyed[color]++;
  }
  grid[r][c] = null;
  return true;
}

function gravity() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] && grid[r][c].animY === null)
        grid[r][c].animY = GY + r * CELL;

  for (let c = 0; c < COLS; c++) {
    let empty = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c]) {
        grid[empty][c] = grid[r][c];
        if (empty !== r) grid[r][c] = null;
        empty--;
      }
    }
    let spawnY = GY - CELL;
    for (let r = empty; r >= 0; r--) {
      const blk = mkBlock();
      blk.animY = spawnY;
      spawnY -= CELL;
      grid[r][c] = blk;
    }
  }
  buildChains();
}

function updateBlockAnims(dt) {
  const spd = dt / 16.67;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const blk = grid[r][c];
      if (!blk) continue;
      const targetY = GY + r * CELL;
      if (blk.animY === null) { blk.animY = targetY; continue; }
      if (blk.animY >= targetY - 0.5) { blk.animY = targetY; blk.fallV = 0; continue; }
      blk.fallV += 0.65 * spd;
      blk.animY = Math.min(targetY, blk.animY + blk.fallV * spd);
    }
  }
}

function blocksFalling() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const blk = grid[r][c];
      if (blk && blk.animY !== null && blk.animY < GY + r * CELL - 0.5) return true;
    }
  return false;
}

function pickRect() {
  const r1 = 1 + Math.floor(Math.random() * (ROWS - 3));
  const c1 = Math.floor(Math.random() * (COLS - 2));
  return { r1, c1, r2: Math.min(ROWS - 1, r1 + 2), c2: Math.min(COLS - 1, c1 + 2) };
}
