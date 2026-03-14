// ═══════════════════════════════════════
//  COMBAT — 먹기, 체인, 아이템, 전투 로직
// ═══════════════════════════════════════

function startEat(r, c) {
  targetChainId = -1;
  char.sc = 1.5;
  const block = grid[r][c];

  if (!block) {
    char.hp = Math.max(0, char.hp - 10);
    char.state = 'stunned';
    shake(6, 18);
    haptic([15, 5, 15]);
    popup(char.x, char.y - 44, 'OW!', '#ff5555');
    safeTimeout(() => {
      goBase();
      checkOver();
    }, 750);
    return;
  }

  const chain = getChain(block.chainId);

  if (chain.length === 1) {
    removeBlock(r, c);
    sBlocks++;
    sGold += Math.round(char.goldPerBlock * char.goldMult);
    healFromBlock(1);
    popup(char.x, char.y - 44, '…', '#888899');
    char.state = 'returning';
    safeTimeout(() => { gravity(); goBase(); checkOver(); }, 300);
    return;
  }

  runChain(chain, r, c);
}

function byDist(blocks, sr, sc) {
  const sign = stageGimmicks.has('reverse_chain') ? -1 : 1;
  return [...blocks].sort((a, b) =>
    sign * ((Math.abs(a.r - sr) + Math.abs(a.c - sc)) - (Math.abs(b.r - sr) + Math.abs(b.c - sc)))
  );
}

function healFromBlock(chainSize) {
  const bonus = Math.max(1.0, 1 + (chainSize - 2) * 0.1);
  let hpPerBlock = char.hpPerBlock;
  if (char.lowHpHealBonus > 0 && char.hp / char.maxHp < 0.30) {
    hpPerBlock *= (1 + char.lowHpHealBonus);
  }
  let heal = hpPerBlock * bonus;
  if (char.chainHealBonus > 0 && chainSize >= 5 && Math.floor(chainSize / 5) > 0) {
    const rangeMult = 1 + char.impactRange * 0.1;
    heal += char.chainHealBonus * rangeMult;
  }
  char.hp = Math.min(char.maxHp, char.hp + heal);
}

function runChain(chainBlocks, sr, sc) {
  const surgeBonus = consumeEffects.chainSurge || 0;
  if (surgeBonus > 0) { char.impactRange += surgeBonus; consumeEffects.chainSurge = 0; }

  const ordered = byDist(chainBlocks, sr, sc);
  const chainSet = new Set(chainBlocks.map(b => b.r * COLS + b.c));
  const waveMap  = new Map();
  const chainSize = chainBlocks.length;
  let combo = 0;
  char.state = 'eating';

  if (chainIv !== null) { clearInterval(chainIv); chainIv = null; }
  const iv = setInterval(() => {
    if (gstate !== 'playing') { clearInterval(iv); chainIv = null; return; }
    if (!ordered.length) {
      clearInterval(iv); chainIv = null;
      for (const { r, c } of waveMap.values()) {
        if (!grid[r][c]) continue;
        const wBlk = grid[r][c];
        const wMirror = !!wBlk.mirror;
        ripples.push({ x: GX + c * CELL + CELL / 2, y: GY + r * CELL + CELL / 2, rad: 4, life: 0.8 });
        if (!removeBlock(r, c)) continue;
        if (!wMirror) healFromBlock(chainSize);
        combo++;
        sBlocks++;
        sGold += Math.round(char.goldPerBlock * char.goldMult * (wMirror ? 2 : 1));
        if (timePressureActive) timePressureCombo++;
      }
      finishChain(combo, surgeBonus);
      return;
    }

    const { r, c } = ordered.shift();
    if (!grid[r][c]) return;
    const blkRef = grid[r][c];
    const isMirror = !!blkRef.mirror;
    const destroyed = removeBlock(r, c);
    if (!destroyed) return;
    if (!isMirror) healFromBlock(chainSize);
    combo++;
    sBlocks++;
    sGold += Math.round(char.goldPerBlock * char.goldMult * (isMirror ? 2 : 1));
    if (timePressureActive) timePressureCombo++;
    shake(2, 3);
    haptic(8);
    ripples.push({ x: GX + c * CELL + CELL / 2, y: GY + r * CELL + CELL / 2, rad: CELL * 0.25, life: 1.0 });

    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      for (let i = 1; i <= char.impactRange; i++) {
        const nr = r + dr*i, nc = c + dc*i;
        if (!inB(nr, nc) || !grid[nr][nc]) break;
        if (isProtectedByShield(nr, nc) && !grid[nr][nc].shield) break;
        const key = nr * COLS + nc;
        if (!chainSet.has(key)) waveMap.set(key, { r: nr, c: nc });
      }
    }

    if (combo >= 5) {
      popup(GX + c * CELL + CELL / 2, GY + r * CELL - 8, combo + '!', '#f0c040');
    }
  }, char.chainDelay);
  chainIv = iv;
}

// ── 아이템 블록 ──
function clearCells(cells, color) {
  let destroyed = 0;
  for (const [r, c] of cells) {
    if (!inB(r, c) || !grid[r][c]) continue;
    if (removeBlock(r, c, true)) destroyed++;
  }
  return destroyed;
}

function triggerFirework(r, c) {
  shake(8, 18);
  haptic([20, 10, 40]);
  bigPopup('🧨 BANG!', '#ff7f2a');
  flashes.push({ x: GX, y: GY + r * CELL, w: COLS * CELL, h: CELL,
                 color: '#ff7f2a', life: 1.0, type: 'row' });
  const cells = Array.from({ length: COLS }, (_, cc) => [r, cc]);
  const destroyed = clearCells(cells, '#ff7f2a');
  for (let i = 0; i < destroyed; i++) healFromBlock(destroyed);
}

function triggerBomb(r, c) {
  const bRad = (char && char.bombRadius) ? char.bombRadius : BOMB_RADIUS;
  shake(16, 32);
  haptic([30, 10, 60, 10, 30]);
  bigPopup('💣 BOOM!!', '#a855f7');
  const x1 = GX + Math.max(0, c - bRad) * CELL;
  const y1 = GY + Math.max(0, r - bRad) * CELL;
  const x2 = GX + (Math.min(COLS - 1, c + bRad) + 1) * CELL;
  const y2 = GY + (Math.min(ROWS - 1, r + bRad) + 1) * CELL;
  flashes.push({ x: x1, y: y1, w: x2 - x1, h: y2 - y1,
                 color: '#a855f7', life: 1.0, type: 'area' });
  const cells = [];
  for (let dr = -bRad; dr <= bRad; dr++)
    for (let dc = -bRad; dc <= bRad; dc++)
      cells.push([r + dr, c + dc]);
  const destroyed = clearCells(cells, '#a855f7');
  for (let i = 0; i < destroyed; i++) healFromBlock(destroyed);
}

function dropItemBlock(combo) {
  const bombThr = (char && char.bombThreshold) ? char.bombThreshold : 22;
  const fwThr   = (char && char.fireworkThreshold) ? char.fireworkThreshold : 12;
  const type = combo >= bombThr ? 'bomb' : combo >= fwThr ? 'firework' : null;
  if (!type) return;

  const candidates = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] && !grid[r][c].item && !grid[r][c].steel && grid[r][c].color !== 'legendary') candidates.push({ r, c });
  if (!candidates.length) return;

  const { r, c } = candidates[Math.floor(Math.random() * candidates.length)];
  grid[r][c].item = type;
  grid[r][c].color = type;
  buildChains();
  popup(GX + c * CELL + CELL / 2, GY + r * CELL - 8, type === 'bomb' ? '💣' : '🧨', '#ffffff', true);
}

function finishChain(combo, surgeUsed) {
  if (surgeUsed > 0) char.impactRange -= surgeUsed;

  if (combo > sMaxCombo) sMaxCombo = combo;
  if (combo >= 5) {
    const bonusGold = Math.round((combo * 5 + char.comboGoldBonus) * char.goldMult);
    sGold += bonusGold;
  }

  if (char.hungerActive) {
    char.hungerCombo += combo;
    while (char.hungerCombo >= 20) {
      char.hungerCombo -= 20;
      char.impactRange++;
      bigPopup('🍽️ HUNGER!', '#ff9944');
    }
  }

  if (char.chainOverflow && combo >= 10) {
    const remaining = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const b = grid[r][c];
        if (b && !b.steel && !b.item && !b.ice && !isProtectedByShield(r, c)) remaining.push({ r, c });
      }
    if (remaining.length) {
      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      const removed = removeBlock(pick.r, pick.c);
      if (removed) {
        burstParticles(pick.r, pick.c, '#44aaff');
        sBlocks++;
        sGold += Math.round(char.goldPerBlock * char.goldMult);
        popups.push({ x: GX + pick.c * CELL + CELL / 2, y: GY + pick.r * CELL, text: '💦 OVERFLOW', color: '#44aaff', life: 1.0, vy: -1.8, big: true });
      }
    }
  }

  const milestone = COMBO_MILESTONES.find(m => combo >= m.threshold);
  if (milestone) {
    shake(milestone.shakeAmt, milestone.shakeFr);
    haptic(milestone.haptic);
    bigPopup(milestone.text, milestone.color);
    if (milestone.isStar) burstStar(AW / 2, AH / 2 - 40);
  }

  safeTimeout(() => {
    gravity();
    dropItemBlock(combo);
    goBase();
    checkOver();
  }, 200);
}

// ── 게임 오버 ──
function checkOver() {
  if (gstate !== 'playing') return;
  if (char.hp <= 0) { endGame('hp'); return; }
  if (grid.flat().every(b => !b)) endGame('clear');
}

function endGame(reason) {
  if (gstate !== 'playing') return;
  gstate = 'over';

  if (reason === 'clear') {
    sGold += 100;
    bigPopup('PERFECT!!', '#7ec850');
  } else if (reason === 'hp') {
    shake(14, 30);
    bigPopup('GAME OVER', '#ff5555');
  }
  slowFactor = 0.2;
  safeTimeout(() => { slowFactor = 1.0; showResult(); }, 1600);
}

// ── 특수 블록 정리 (소모품용) ──
function purgeSpecialBlocks() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const blk = grid[r][c];
      if (!blk) continue;
      if (blk.steel || blk.ice || blk.timebomb) {
        burstParticles(r, c, '#ff8844');
        grid[r][c] = null;
      }
    }
  gravity();
}

function triggerMegaBomb() {
  const cr = Math.floor(ROWS / 2), cc = Math.floor(COLS / 2);
  const rad = 2;
  for (let r = cr - rad; r <= cr + rad; r++)
    for (let c = cc - rad; c <= cc + rad; c++) {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || !grid[r][c]) continue;
      burstParticles(r, c, '#ff4444');
      const destroyed = removeBlock(r, c, true);
      if (destroyed) { sBlocks++; sGold += Math.round(char.goldPerBlock * char.goldMult); }
    }
  gravity();
}
