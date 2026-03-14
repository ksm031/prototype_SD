// ═══════════════════════════════════════
//  RENDER — 그리드, HUD, 캐릭터, 파티클 렌더링
// ═══════════════════════════════════════

function rRect(x, y, w, h, rad) {
  const [tl, tr, br, bl] = Array.isArray(rad) ? rad : [rad, rad, rad, rad];
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}

function render(dt) {
  const now = Date.now();

  let ox = 0, oy = 0;
  if (shakeFr > 0) {
    ox = (Math.random() - 0.5) * shakeAmt;
    oy = (Math.random() - 0.5) * shakeAmt;
    shakeFr--;
  }

  if (isHyper) {
    ox += Math.sin(now / 350) * (hyperPulseActive ? 5 : 1.5);
    oy += Math.cos(now / 500) * (hyperPulseActive ? 3 : 0.6);
  }

  renderOx = ox;
  renderOy = oy;

  ctx.save();
  ctx.translate(ox, oy);

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(-20, -20, AW + 40, AH + 40);
  const bgIdx = isHyper ? 3 : Math.min(runState.act, 2);
  const bgImg = BG_IMGS[bgIdx];
  if (bgImg && bgImg.complete && bgImg.naturalWidth) {
    ctx.globalAlpha = 0.45;
    ctx.drawImage(bgImg, 0, 0, AW, AH);
    ctx.globalAlpha = 1.0;
  }
  if (isHyper) {
    const b = hyperPulseActive
      ? 20 + (Math.abs(Math.sin(now / 70)) * 35 | 0)
      : 10 + (Math.abs(Math.sin(now / 1400)) * 12 | 0);
    ctx.fillStyle = `rgba(${b + 8},8,${b | 0},0.45)`;
    ctx.fillRect(-20, -20, AW + 40, AH + 40);
  }

  drawGrid();
  drawFlashes();
  drawRipples();
  drawChar();
  drawParticles();

  ctx.restore();

  drawHUD();

  if (isHyper) {
    const alpha = hyperPulseActive
      ? Math.abs(Math.sin(now / 55)) * 0.28
      : Math.abs(Math.sin(now / 1800)) * 0.07;
    ctx.fillStyle = `rgba(255,20,55,${alpha.toFixed(3)})`;
    ctx.fillRect(0, 0, AW, AH);
  }

  drawPopups();
}

function drawHUD() {
  ctx.fillStyle = 'rgba(10,10,22,0.88)';
  ctx.fillRect(0, 0, AW, 56);

  const pct = Math.max(0, char.hp / char.maxHp);
  const BAR_X = 8, BAR_Y = 12, BAR_W = AW - 16, BAR_H = 14;

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  rRect(BAR_X, BAR_Y, BAR_W, BAR_H, 4);
  ctx.fill();

  const barColor = pct > 0.5 ? '#7ec850' : pct > 0.25 ? '#f0c040' : '#ff5555';
  const blink = pct < 0.25 && Math.floor(Date.now() / 200) % 2 === 0;
  if (!blink && pct > 0) {
    ctx.fillStyle = barColor;
    rRect(BAR_X, BAR_Y, Math.max(8, BAR_W * pct), BAR_H, 4);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  rRect(BAR_X, BAR_Y, BAR_W, BAR_H, 4);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.ceil(pct * 100) + '%', AW / 2, BAR_Y + BAR_H / 2);

  const drainRate = (10.0 + gameElapsed / 1000 * 0.20) * char.drainMult * (hyperPulseActive ? 2.0 : 1.0);

  if (isHyper) {
    ctx.save();
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const hyperFlash = hyperPulseActive ? (Math.floor(Date.now() / 100) % 2 === 0 ? '#ff2255' : '#ff8844') : '#ff3366';
    ctx.fillStyle = hyperFlash;
    ctx.fillText('⚡ HYPER', AW / 2, BAR_Y - 4);
    ctx.restore();
  }

  ctx.textBaseline = 'middle';
  ctx.font = '12px system-ui';

  const drainColor = drainRate < 1.0 ? '#7ec850' : drainRate < 1.8 ? '#f0c040' : '#ff5555';
  ctx.fillStyle = drainColor;
  ctx.textAlign = 'left';
  ctx.fillText(`🔥 ${drainRate.toFixed(1)}/s`, 50, 44);

  if (nodeConfig) {
    const elapsed = Math.floor(gameElapsed / 1000);
    const remain  = Math.max(0, nodeConfig.clearSec - elapsed);
    const nodeTypeColor = nodeConfig.type === 'boss' || nodeConfig.type === 'final' ? '#ff8844' : '#8888aa';
    ctx.fillStyle = nodeTypeColor;
    ctx.textAlign = 'center';
    ctx.font = '11px system-ui';
    ctx.fillText(`[${nodeConfig.label}]  ⏳${remain}s`, AW / 2, 44);
  }

  ctx.fillStyle = '#f0c040';
  ctx.font = 'bold 12px system-ui';
  ctx.textAlign = 'right';
  ctx.fillText(sGold + ' G', AW - BAR_X, 44);

  // 기믹 상태 표시
  const gHasColorblind   = stageGimmicks.has('colorblind');
  const gHasFog          = stageGimmicks.has('fog');
  const gHasDarkzone     = stageGimmicks.has('darkzone');
  const gHasReverse      = stageGimmicks.has('reverse_chain');
  const gHasEarthquake   = stageGimmicks.has('earthquake');
  const gHasDrainStorm   = stageGimmicks.has('drain_storm');
  const activeGimmickLabels = [];
  if (gHasColorblind)  activeGimmickLabels.push('🎨');
  if (gHasFog)         activeGimmickLabels.push('🌫️');
  if (gHasDarkzone)    activeGimmickLabels.push('🌑');
  if (gHasReverse)     activeGimmickLabels.push('🔃');
  if (gHasEarthquake)  activeGimmickLabels.push(`🌋${Math.ceil((EARTHQUAKE_INTERVAL - earthquakeTimer) / 1000)}s`);
  if (drainStormActive)         activeGimmickLabels.push(`🌪️${Math.ceil(drainStormRemain / 1000)}s`);
  else if (gHasDrainStorm)      activeGimmickLabels.push('🌪️');
  if (blockLockActive)          activeGimmickLabels.push(`🔐${Math.ceil((BLOCK_LOCK_DURATION - blockLockCycle) / 1000)}s`);
  if (timePressureActive)       activeGimmickLabels.push(`⏰${Math.ceil(timePressureTimer / 1000)}s ${timePressureCombo}/${timePressureTarget}`);

  if (activeGimmickLabels.length > 0) {
    const STRIP_Y2 = AH - 38;
    ctx.fillStyle = 'rgba(10,10,22,0.70)';
    ctx.fillRect(0, STRIP_Y2 - 2, AW, 16);
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff8844';
    ctx.fillText(activeGimmickLabels.join('  '), AW / 2, STRIP_Y2 + 6);
  }

  // 소모품 슬롯
  {
    const slotW = 26, slotH = 14, slotGap = 3;
    const totalSlotW = 3 * slotW + 2 * slotGap;
    const slotStartX = AW - 4 - totalSlotW;
    const slotY = 28;
    ctx.font = '11px system-ui';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) {
      const sx = slotStartX + i * (slotW + slotGap);
      const hasItem = i < runConsumables.length;
      ctx.fillStyle = hasItem ? 'rgba(80,120,200,0.25)' : 'rgba(255,255,255,0.05)';
      rRect(sx, slotY, slotW, slotH, 4); ctx.fill();
      ctx.strokeStyle = hasItem ? 'rgba(120,160,255,0.55)' : 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 1;
      rRect(sx, slotY, slotW, slotH, 4); ctx.stroke();
      if (hasItem) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(runConsumables[i].icon, sx + slotW / 2, slotY + slotH / 2);
      }
    }
    if (consumeEffects.timeStop > 0) {
      ctx.fillStyle = '#88aaff';
      ctx.font = 'bold 9px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(`⏸${Math.ceil(consumeEffects.timeStop/1000)}s`, slotStartX, slotY + slotH + 8);
    }
  }

  // 아티팩트 스트립
  if (runState.artifacts.length > 0) {
    const STRIP_Y = AH - 22;
    ctx.fillStyle = 'rgba(10,10,22,0.80)';
    ctx.fillRect(0, STRIP_Y - 4, AW, 26);
    ctx.font = '14px system-ui';
    ctx.textBaseline = 'middle';
    let activeSynCount = 0;
    for (const syn of SYNERGY_DEFS)
      if (runState.artifacts.includes(syn.a) && runState.artifacts.includes(syn.b)) activeSynCount++;
    const iconW = 20;
    const totalW = runState.artifacts.length * iconW;
    let ix = (AW - totalW) / 2;
    for (const artId of runState.artifacts) {
      const art = ARTIFACT_POOL.find(a => a.id === artId);
      if (art) {
        ctx.textAlign = 'center';
        ctx.fillText(art.icon, ix + iconW / 2, STRIP_Y + 9);
      }
      ix += iconW;
    }
    if (activeSynCount > 0) {
      ctx.font = 'bold 9px system-ui';
      ctx.fillStyle = '#f0c040';
      ctx.textAlign = 'right';
      ctx.fillText(`✨×${activeSynCount}`, AW - 4, STRIP_Y + 9);
    }
  }
}

function drawGimmickOverlay(blk, x, y, radii, now) {
  let strokeColor, lineWidth = 2.5, shadowColor = null, shadowBlur = 0, icon;
  if (blk.ice) {
    const p = Math.sin(now / 400);
    strokeColor = '#88ccff'; shadowColor = '#88ccff'; shadowBlur = 10 + 4 * p; icon = '🧊';
  } else if (blk.split) {
    strokeColor = '#ff88cc'; icon = '🔀';
  } else if (blk.mirror) {
    strokeColor = '#aaccff'; icon = '🪞';
  } else if (blk.petrified) {
    strokeColor = blk.cracked ? '#ff8844' : '#cc9955';
    lineWidth = blk.cracked ? 3 : 2; icon = blk.cracked ? '🪨' : '🗿';
  } else if (blk.rot) {
    const p = 0.5 + 0.4 * Math.sin(now / 500);
    strokeColor = `rgba(68,187,68,${0.6 + p * 0.4})`; shadowColor = '#44bb44'; shadowBlur = 8 + p * 8; icon = '🦠';
  } else if (blk.shield) {
    const p = 0.4 + 0.4 * Math.sin(now / 380);
    strokeColor = `rgba(96,170,221,${0.6 + p * 0.4})`; shadowColor = '#60aadd'; shadowBlur = 12 + p * 10; lineWidth = 3; icon = '🛡';
  } else if (blk.revive) {
    const p = 0.5 + 0.4 * Math.sin(now / 600);
    strokeColor = `rgba(200,68,255,${0.6 + p * 0.4})`; icon = '💀';
  } else return;

  const PAD = 3;
  ctx.save();
  if (shadowColor) { ctx.shadowColor = shadowColor; ctx.shadowBlur = shadowBlur; }
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  rRect(x + PAD, y + PAD, CELL - PAD*2, CELL - PAD*2, radii);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = 'bold 16px system-ui';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(icon, x + CELL / 2, y + CELL / 2 - 1);
  if (blk.petrified && blk.cracked) {
    ctx.fillStyle = '#ff8844';
    ctx.font = 'bold 9px system-ui';
    ctx.fillText('HP1', x + CELL / 2, y + CELL - PAD - 5);
  }
  ctx.restore();
}

function drawGrid() {
  const csz = {};
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c]) { const id = grid[r][c].chainId; csz[id] = (csz[id]||0) + 1; }

  const now = Date.now();
  const PAD = 3;
  const CR  = 9;

  function blkY(r, c) {
    const blk = grid[r][c];
    if (!blk) return GY + r * CELL;
    const ly = GY + r * CELL;
    const atRest = blk.animY === null || blk.animY >= ly - 0.5;
    const chained = (csz[blk.chainId] || 0) >= 2;
    const bob = (chained && atRest) ? Math.sin(now / 700 + blk.chainId * 0.9) * 1.8 : 0;
    return (blk.animY !== null ? blk.animY : ly) + bob;
  }
  function atRest(r, c) {
    const blk = grid[r][c];
    if (!blk) return false;
    const ly = GY + r * CELL;
    return blk.animY === null || blk.animY >= ly - 0.5;
  }
  function sameChain(r, c, r2, c2) {
    if (!inB(r2, c2)) return false;
    const a = grid[r][c], b = grid[r2][c2];
    if (!a || !b || a.chainId === -1) return false;
    return a.chainId === b.chainId && (csz[a.chainId] || 0) >= 2;
  }

  // Pass 1: 빈 슬롯
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = GX + c * CELL, ly = GY + r * CELL;
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      rRect(x + PAD, ly + PAD, CELL - PAD*2, CELL - PAD*2, 6);
      ctx.fill();
    }
  }

  // Pass 2: 브릿지
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const blk = grid[r][c];
      if (!blk) continue;
      const x  = GX + c * CELL;
      const y  = blkY(r, c);
      const ar = atRest(r, c);
      ctx.fillStyle = BCOLOR[blk.color];

      if (sameChain(r, c, r, c+1) && ar && atRest(r, c+1)) {
        ctx.fillRect(x + CELL - PAD, y + PAD, PAD * 2, CELL - PAD * 2);
      }
      if (sameChain(r, c, r+1, c) && ar && atRest(r+1, c)) {
        const y2 = blkY(r+1, c);
        const bh = y2 + PAD - (y + CELL - PAD);
        if (bh > 0 && bh <= CELL * 2) ctx.fillRect(x + PAD, y + CELL - PAD, CELL - PAD * 2, bh);
      }
      if (sameChain(r, c, r, c+1) && sameChain(r, c, r+1, c) && ar && atRest(r, c+1) && atRest(r+1, c)) {
        const y2 = blkY(r+1, c);
        const bh = y2 + PAD - (y + CELL - PAD);
        if (bh > 0 && bh <= CELL * 2) ctx.fillRect(x + CELL - PAD, y + CELL - PAD, PAD * 2, bh);
      }
    }
  }

  // Pass 3: 블록 바디
  const isColorblind = stageGimmicks.has('colorblind');
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const blk = grid[r][c];
      if (!blk) continue;

      const x  = GX + c * CELL;
      const y  = blkY(r, c);
      const useGray = isColorblind && !blk.steel && !blk.item;
      const bc = (useGray ? BGRAY : BCOLOR)[blk.color] || BCOLOR[blk.color];
      const bd = (useGray ? BGRAY : BDARK)[blk.color]  || BDARK[blk.color];
      const blt = (useGray ? BGRAY : BRIGHT)[blk.color] || BRIGHT[blk.color];
      const chained = (csz[blk.chainId] || 0) >= 2;

      const hasT = sameChain(r, c, r-1, c);
      const hasB = sameChain(r, c, r+1, c);
      const hasL = sameChain(r, c, r, c-1);
      const hasR = sameChain(r, c, r, c+1);

      const radii = [
        (hasT || hasL) ? 1 : CR,
        (hasT || hasR) ? 1 : CR,
        (hasB || hasR) ? 1 : CR,
        (hasB || hasL) ? 1 : CR,
      ];

      ctx.fillStyle = bc;
      rRect(x + PAD, y + PAD, CELL - PAD*2, CELL - PAD*2, radii);
      ctx.fill();

      if (blk.color === 'legendary') {
        const glowAlpha = 0.18 + 0.12 * Math.sin(now / 300);
        ctx.save();
        ctx.shadowColor = '#ffe066';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = `rgba(255,224,102,${glowAlpha + 0.4})`;
        ctx.lineWidth = 2.5;
        rRect(x + PAD, y + PAD, CELL - PAD*2, CELL - PAD*2, radii);
        ctx.stroke();
        ctx.restore();
      }

      if (blk.timebomb) {
        const secLeft = Math.ceil(blk.timer / 1000);
        const urgency = 1 - blk.timer / TIMEBOMB_FUSE;
        const pulse = 0.5 + 0.5 * Math.sin(now / (300 - urgency * 200));
        ctx.save();
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 8 + urgency * 16;
        ctx.strokeStyle = `rgba(255,${Math.round(34 + (1-urgency)*100)},0,${0.6 + pulse * 0.4})`;
        ctx.lineWidth = 2.5 + urgency * 2;
        rRect(x + PAD, y + PAD, CELL - PAD*2, CELL - PAD*2, radii);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = `bold ${urgency > 0.7 ? 16 : 14}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = urgency > 0.5 ? '#ff2200' : '#ffffff';
        ctx.globalAlpha = urgency > 0.7 ? (0.7 + pulse * 0.3) : 1.0;
        ctx.fillText(secLeft, x + CELL / 2, y + CELL / 2);
        ctx.restore();
      }

      if (blk.steel) {
        ctx.save();
        ctx.strokeStyle = 'rgba(170,180,194,0.25)';
        ctx.lineWidth = 1.5;
        for (let d = -CELL; d < CELL * 2; d += 7) {
          ctx.beginPath();
          ctx.moveTo(x + PAD + d, y + PAD);
          ctx.lineTo(x + PAD + d + CELL, y + PAD + CELL - PAD * 2);
          ctx.stroke();
        }
        ctx.strokeStyle = '#aab4c2';
        ctx.lineWidth = 2;
        rRect(x + PAD, y + PAD, CELL - PAD*2, CELL - PAD*2, radii);
        ctx.stroke();
        ctx.font = 'bold 18px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚙️', x + CELL / 2, y + CELL / 2);
        ctx.restore();
      }

      if (isColorblind && !blk.steel && !blk.item && !blk.rot && !blk.shield) {
        const shape = COLOR_SHAPE[blk.color];
        if (shape) {
          ctx.save();
          ctx.font = 'bold 18px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.85;
          ctx.fillText(shape, x + CELL / 2, y + CELL / 2);
          ctx.restore();
        }
      }

      drawGimmickOverlay(blk, x, y, radii, now);

      if (blk.item) {
        const glowColor = blk.item === 'firework' ? '#ff7f2a' : '#e05c00';
        const pulse = 0.5 + 0.3 * Math.sin(now / 220);
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14;
        ctx.strokeStyle = glowColor;
        ctx.globalAlpha = pulse;
        ctx.lineWidth = 2.5;
        rRect(x + PAD, y + PAD, CELL - PAD*2, CELL - PAD*2, radii);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.font = 'bold 20px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(blk.item === 'firework' ? '🧨' : '💣', x + CELL / 2, y + CELL / 2);
        ctx.restore();
      }

      if (!hasT) {
        ctx.fillStyle = blt;
        rRect(x + PAD, y + PAD, CELL - PAD*2, 7, [radii[0], radii[1], 0, 0]);
        ctx.fill();
      }
      if (!hasB) {
        ctx.fillStyle = bd;
        rRect(x + PAD, y + CELL - PAD - 6, CELL - PAD*2, 6, [0, 0, radii[2], radii[3]]);
        ctx.fill();
      }

      if (blk.color === 'legendary') {
        ctx.save();
        ctx.font = 'bold 22px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', x + CELL / 2, y + CELL / 2);
        ctx.restore();
      }

      if (chained) {
        const pulse = 0.3 + 0.18 * Math.sin(now / 380 + blk.chainId * 1.1);
        ctx.strokeStyle = `rgba(255,255,255,${pulse})`;
        ctx.lineWidth = 2;
        rRect(x + PAD, y + PAD, CELL - PAD*2, CELL - PAD*2, radii);
        ctx.stroke();
      }
    }
  }

  // Pass 4: 타겟 체인 하이라이트
  if (targetChainId !== -1) {
    const pulse = 0.55 + 0.3 * Math.sin(Date.now() / 120);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const blk = grid[r][c];
        if (!blk || blk.chainId !== targetChainId) continue;
        const x  = GX + c * CELL;
        const y  = blkY(r, c);
        ctx.save();
        ctx.globalAlpha = pulse * 0.55;
        ctx.fillStyle = '#ffffff';
        rRect(x + PAD, y + PAD, CELL - PAD * 2, CELL - PAD * 2, 6);
        ctx.fill();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        rRect(x + PAD, y + PAD, CELL - PAD * 2, CELL - PAD * 2, 6);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Pass 5: 스테이지 기믹 오버레이
  if (stageGimmicks.has('fog')) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(GX, GY, COLS * CELL, ROWS * CELL);
    ctx.clip();
    const GW = COLS * CELL, GH = ROWS * CELL;
    const clouds = [
      { ox: 0.00, oy: 0.12, r: GW * 0.44, spd: 0.000035, alpha: 0.88 },
      { ox: 0.40, oy: 0.52, r: GW * 0.50, spd: 0.000022, alpha: 0.82 },
      { ox: 0.70, oy: 0.78, r: GW * 0.38, spd: 0.000048, alpha: 0.80 },
      { ox: 0.20, oy: 0.35, r: GW * 0.35, spd: 0.000028, alpha: 0.76 },
      { ox: 0.55, oy: 0.02, r: GW * 0.52, spd: 0.000018, alpha: 0.84 },
    ];
    for (const cl of clouds) {
      const loopW = GW + cl.r * 2;
      const cx = GX + ((cl.ox * GW + now * cl.spd * GW) % loopW) - cl.r * 0.5;
      const cy = GY + cl.oy * GH;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cl.r);
      grad.addColorStop(0,   `rgba(215,225,255,${cl.alpha})`);
      grad.addColorStop(0.45,`rgba(200,210,250,${cl.alpha * 0.5})`);
      grad.addColorStop(1,   'rgba(190,205,245,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, cl.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (darkZoneRect) {
    const { r1, c1, r2, c2 } = darkZoneRect;
    ctx.save();
    ctx.fillStyle = 'rgba(5,5,18,0.92)';
    ctx.fillRect(GX + c1 * CELL, GY + r1 * CELL,
                 (c2 - c1 + 1) * CELL, (r2 - r1 + 1) * CELL);
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(100,100,180,0.6)';
    ctx.fillText('🌑', GX + (c1 + (c2 - c1) / 2 + 0.5) * CELL,
                 GY + (r1 + (r2 - r1) / 2 + 0.5) * CELL);
    if (darkRevealCell) {
      const { r: rr, c: cc } = darkRevealCell;
      if (rr >= r1 && rr <= r2 && cc >= c1 && cc <= c2) {
        const blk = grid[rr][cc];
        if (blk) {
          const rc = BCOLOR[blk.color] || '#888';
          ctx.globalAlpha = (darkRevealTimer / 800) * 0.9;
          ctx.fillStyle = rc;
          rRect(GX + cc * CELL + PAD, GY + rr * CELL + PAD, CELL - PAD*2, CELL - PAD*2, 8);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  if (blockLockActive && blockLockRect) {
    const { r1, c1, r2, c2 } = blockLockRect;
    const remain = BLOCK_LOCK_DURATION - blockLockCycle;
    ctx.save();
    ctx.fillStyle = `rgba(255,50,50,${0.12 + 0.06 * Math.sin(now / 300)})`;
    ctx.fillRect(GX + c1 * CELL, GY + r1 * CELL,
                 (c2 - c1 + 1) * CELL, (r2 - r1 + 1) * CELL);
    ctx.strokeStyle = `rgba(255,80,80,0.7)`;
    ctx.lineWidth = 2;
    ctx.strokeRect(GX + c1 * CELL + 1, GY + r1 * CELL + 1,
                   (c2 - c1 + 1) * CELL - 2, (r2 - r1 + 1) * CELL - 2);
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🔐 ' + Math.ceil(remain / 1000) + 's',
                 GX + (c1 + (c2 - c1) / 2 + 0.5) * CELL,
                 GY + (r1 + (r2 - r1) / 2 + 0.5) * CELL);
    ctx.restore();
  }

  if (drainStormActive) {
    ctx.save();
    const pulse = 0.5 + 0.5 * Math.sin(now / 350);
    const edgeAlpha = 0.35 + 0.35 * pulse;
    const grd = ctx.createRadialGradient(AW/2, AH/2, AH*0.28, AW/2, AH/2, AH*0.78);
    grd.addColorStop(0,   'rgba(220,0,0,0)');
    grd.addColorStop(0.55, `rgba(220,0,0,${edgeAlpha * 0.25})`);
    grd.addColorStop(1,   `rgba(220,0,0,${edgeAlpha})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, AW, AH);
    ctx.restore();
  }

  if (stageGimmicks.has('reverse_chain')) {
    ctx.save();
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#ff8844';
    ctx.fillText('🔃 역체인', GX + COLS * CELL - 2, GY + 2);
    ctx.restore();
  }
}

function drawChar() {
  const img = SPR[char.sprFrame];
  if (!img || !img.complete) return;

  const SIZE = 56 * (char.charScale || 1.0);
  const sc = char.sc;
  ctx.save();
  ctx.translate(char.x, char.y);
  ctx.scale(sc, sc);
  ctx.drawImage(img, -SIZE / 2, -SIZE / 2, SIZE, SIZE);

  if (char.state === 'stunned') {
    const t = Date.now() / 180;
    ctx.font = '13px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) {
      const a = t + (i / 3) * Math.PI * 2;
      ctx.fillText('⭐', Math.cos(a) * 26, Math.sin(a) * 16 - 30);
    }
  }
  ctx.restore();
}

function drawParticles() {
  particles = particles.filter(p => p.life > 0);
  if (particles.length > MAX_PARTICLES) particles = particles.slice(-MAX_PARTICLES);
  for (const p of particles) {
    p.x  += p.vx * slowFactor;
    p.y  += p.vy * slowFactor;
    p.vy += 0.18 * slowFactor;
    p.life -= 0.04 * slowFactor;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    if (p.isStar) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * p.r, Math.sin(a) * p.r);
        const b = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
        ctx.lineTo(Math.cos(b) * p.r * 0.4, Math.sin(b) * p.r * 0.4);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawFlashes() {
  flashes = flashes.filter(f => f.life > 0);
  for (const f of flashes) {
    f.life -= 0.045 * slowFactor;
    const t = Math.max(0, f.life);
    ctx.save();
    ctx.globalAlpha = t * t * 0.35;
    ctx.fillStyle = f.color;
    ctx.fillRect(f.x, f.y, f.w, f.h);
    ctx.globalAlpha = t * 0.9;
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 12;
    ctx.strokeRect(f.x + 1.5, f.y + 1.5, f.w - 3, f.h - 3);
    ctx.restore();
  }
}

function drawRipples() {
  ripples = ripples.filter(r => r.life > 0);
  if (ripples.length > MAX_RIPPLES) ripples = ripples.slice(-MAX_RIPPLES);
  for (const rpl of ripples) {
    rpl.rad  += 2.8 * slowFactor;
    rpl.life -= 0.06 * slowFactor;
    ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, rpl.life) * 0.7})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rpl.x, rpl.y, rpl.rad, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPopups() {
  popups = popups.filter(p => p.life > 0);
  if (popups.length > MAX_POPUPS) popups = popups.slice(-MAX_POPUPS);
  for (const p of popups) {
    p.y    += p.vy * slowFactor;
    p.life -= 0.028 * slowFactor;
    ctx.globalAlpha = Math.min(1, p.life);
    ctx.font = p.big ? 'bold 40px system-ui' : 'bold 21px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth   = p.big ? 6 : 3;
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
}

function drawPauseOverlay() {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 10, 30, 0.72)';
  ctx.fillRect(0, 0, AW, AH);
  ctx.fillStyle = '#fff';
  ctx.font = '700 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('일시정지', AW / 2, AH / 2 - 16);
  ctx.font = '400 14px sans-serif';
  ctx.fillStyle = 'rgba(200,200,220,0.7)';
  ctx.fillText('버튼을 눌러 재개', AW / 2, AH / 2 + 22);
  ctx.restore();
}
