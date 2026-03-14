// ═══════════════════════════════════════
//  LOOP — 게임 루프
// ═══════════════════════════════════════

function loop(ts) {
  if (gstate === 'idle') return;
  rafID = requestAnimationFrame(loop);

  if (gstate === 'paused') {
    drawPauseOverlay();
    return;
  }

  const raw = ts - (lastTS || ts);
  const dt  = raw * slowFactor;
  lastTS = ts;

  if (gstate === 'playing') {
    gameElapsed += raw;
    updateHyper();

    // HYPER 펄스 타이머
    if (isHyper) {
      if (hyperPulseActive) {
        hyperPulseRemain -= raw;
        if (hyperPulseRemain <= 0) { hyperPulseActive = false; hyperPulseTimer = 0; }
      } else {
        hyperPulseTimer += raw;
        if (hyperPulseTimer >= PULSE_INTERVAL) {
          hyperPulseActive = true;
          hyperPulseRemain = PULSE_DURATION;
          bigPopup('PANIC!', '#ff2255');
          shake(12, 14);
        }
      }
    }

    // 강철 블럭 스폰
    steelSpawnTimer -= raw;
    if (steelSpawnTimer <= 0) {
      spawnSteel();
      steelSpawnTimer = nodeConfig.steelMs || 20000;
    }

    // 시한폭탄 스폰
    timebombSpawnTimer -= raw;
    if (timebombSpawnTimer <= 0) {
      spawnTimebomb();
      timebombSpawnTimer = (nodeConfig.steelMs || 20000) * 1.8;
    }

    // 시한폭탄 카운트다운
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const blk = grid[r][c];
        if (blk?.timebomb) {
          blk.timer -= raw;
          if (blk.timer <= 0) explodeTimebomb(r, c);
        }
      }

    // 소모품: 시간 정지
    if (consumeEffects.timeStop > 0) consumeEffects.timeStop -= raw;

    // HP 드레인
    const pulseMult  = (hyperPulseActive ? 2.0 : 1.0) * (drainStormActive ? 2.0 : 1.0);
    let drainMultFinal = char.drainMult * pulseMult;
    if (char.lowHpShield && char.hp / char.maxHp < 0.30) drainMultFinal *= 0.7;
    if (consumeEffects.timeStop > 0) drainMultFinal = 0;
    const drainRate  = (10.0 + gameElapsed / 1000 * 0.20) * drainMultFinal;
    char.hp -= drainRate * raw / 1000;
    if (char.hp <= 0) { char.hp = 0; endGame('hp'); }

    // 노드 클리어
    if (!nodeClearTriggered && nodeConfig && gameElapsed >= nodeConfig.clearSec * 1000) {
      nodeClearTriggered = true;
      nodeCleared();
    }

    // 기믹 블록 스폰
    for (const g of Object.keys(gimmickSpawnTimers)) {
      gimmickSpawnTimers[g] -= raw;
      if (gimmickSpawnTimers[g] <= 0) {
        spawnGimmickBlock(g);
        gimmickSpawnTimers[g] = GIMMICK_SPAWN_INTERVALS[g][nodeConfig.tier || 0];
      }
    }

    // 부패 확산
    if (stageGimmicks.has('rot')) {
      rotUpdateTimer += raw;
      if (rotUpdateTimer >= ROT_SPREAD_INTERVAL) { rotUpdateTimer = 0; spreadRot(); }
    }

    // 부활 큐
    for (const rv of reviveQueue) {
      rv.timer -= raw;
      if (rv.timer <= 0 && !grid[rv.r][rv.c]) {
        grid[rv.r][rv.c] = { color: rv.color, revive: true, origColor: rv.color, chainId: -1, hp: 1, animY: GY + rv.r * CELL - CELL, fallV: 0 };
        popup(GX + rv.c * CELL + CELL / 2, GY + rv.r * CELL - 8, '💀 REVIVE', '#cc44ff', true);
        buildChains();
      }
    }
    reviveQueue = reviveQueue.filter(rv => rv.timer > 0 || !grid[rv.r]?.[rv.c]);

    // 드레인 폭풍
    if (stageGimmicks.has('drain_storm')) {
      if (drainStormActive) {
        drainStormRemain -= raw;
        if (drainStormRemain <= 0) { drainStormActive = false; drainStormTimer = 0; }
        drainStormShakeTimer -= raw;
        if (drainStormShakeTimer <= 0) { shake(3, 5); drainStormShakeTimer = 1200; }
      } else {
        drainStormTimer += raw;
        if (drainStormTimer >= DRAIN_STORM_COOLDOWN) {
          drainStormActive = true; drainStormRemain = DRAIN_STORM_ACTIVE_MS;
          drainStormShakeTimer = 600;
          bigPopup('🌪️ DRAIN STORM!', '#ff8844');
        }
      }
    }

    // 지진
    if (stageGimmicks.has('earthquake')) {
      earthquakeTimer += raw;
      if (earthquakeTimer >= EARTHQUAKE_INTERVAL) { earthquakeTimer = 0; triggerEarthquake(); }
    }
    if (earthquakePending && !locked && char.state === 'idle' && !blocksFalling()) {
      triggerEarthquake();
    }

    // 블록 잠금
    if (stageGimmicks.has('block_lock')) {
      blockLockCycle += raw;
      if (!blockLockActive && blockLockCycle >= BLOCK_LOCK_COOLDOWN) {
        blockLockActive = true; blockLockRect = pickRect(); blockLockCycle = 0;
        bigPopup('🔐 LOCKED!', '#ff5555');
      } else if (blockLockActive && blockLockCycle >= BLOCK_LOCK_DURATION) {
        blockLockActive = false; blockLockRect = null; blockLockCycle = 0;
        bigPopup('🔓 OPEN!', '#7ec850');
      }
    }

    // 어둠 구역
    if (darkRevealTimer > 0) {
      darkRevealTimer -= raw;
      if (darkRevealTimer <= 0) darkRevealCell = null;
    }

    // 시간 압박
    if (stageGimmicks.has('time_pressure') && timePressureTarget > 0) {
      if (!timePressureActive) {
        timePressureIntervalTimer -= raw;
        if (timePressureIntervalTimer <= 0) {
          timePressureActive = true;
          timePressureTimer = 20000;
          timePressureCombo = 0;
          timePressureIntervalTimer = timePressureInterval;
          bigPopup('⏰ COMBO RUSH!', '#ff8844');
        }
      } else {
        timePressureTimer -= raw;
        if (timePressureTimer <= 0) {
          timePressureActive = false;
          if (timePressureCombo < timePressureTarget) {
            const dmg = 20;
            char.hp = Math.max(0, char.hp - dmg);
            shake(10, 16);
            bigPopup('⏰ FAILED! -' + dmg + 'HP', '#ff5555');
            if (char.hp <= 0) endGame('hp');
          } else {
            bigPopup('⏰ CLEAR! +30G', '#7ec850');
            sGold += 30;
          }
        }
      }
    }

    // 초신성 아티팩트
    if (char.supernova && gstate === 'playing') {
      char.supernovaTimer += raw;
      if (char.supernovaTimer >= 15000) {
        char.supernovaTimer = 0;
        triggerBomb(Math.floor(ROWS / 2), Math.floor(COLS / 2));
      }
    }
  }

  updateChar(dt);
  updateBlockAnims(dt);
  render(dt);
}
