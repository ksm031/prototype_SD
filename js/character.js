// ═══════════════════════════════════════
//  CHARACTER — 캐릭터 초기화, 이동, 아티팩트 적용
// ═══════════════════════════════════════

function initChar() {
  const baseMaxHp = getStatValue('maxhp');
  char = {
    x: BASE_X, y: BASE_Y,
    tx: BASE_X, ty: BASE_Y,
    state: 'idle',
    maxHp: baseMaxHp,
    hp:    baseMaxHp,
    hpPerBlock:  getStatValue('recovery') * baseMaxHp / 100,
    impactRange: getStatValue('impact'),
    chainDelay:  getStatValue('speed'),
    drainMult:   getStatValue('vitality'),
    travelMs:    getStatValue('movespeed'),
    moveSpd:     0,
    charScale:   1.0,
    tr: -1, tc: -1,
    sc: 1.0,
    sprFrame: 'idle_01',
    frameT: 0,
    goldPerBlock:       10,
    goldMult:           1.0,
    comboGoldBonus:     0,
    legendSpawnRate:    0.002,
    legendMatBonus:     0,
    matDropEvery:       5,
    hyperHealAmt:       0,
    hyperStartBonus:    0,
    chainHealBonus:     0,
    bombRadius:         BOMB_RADIUS,
    bombThreshold:      22,
    fireworkThreshold:  12,
    steelBreaker:       false,
    lowHpShield:        false,
    lowHpHealBonus:     0,
    hyperHeal:          false,
    supernova:          false,
    supernovaTimer:     0,
    legendHeal:         0,
    hungerActive:       false,
    hungerCombo:        0,
    chainOverflow:      false,
  };
  applyArtifacts();
  if (runState._nextNodeHpMult) {
    char.maxHp = Math.max(30, Math.round(char.maxHp * runState._nextNodeHpMult));
    char.hp = char.maxHp;
    delete runState._nextNodeHpMult;
  }
  if (nodeConfig) char.drainMult *= nodeConfig.drainMult;
}

function applyArtifacts() {
  const nonResonance = runState.artifacts.filter(id => id !== 'resonance');
  const hasResonance = runState.artifacts.includes('resonance');
  for (const artId of nonResonance) {
    const art = ARTIFACT_POOL.find(a => a.id === artId);
    if (art && art.apply) art.apply(char);
  }
  if (hasResonance) {
    const art = ARTIFACT_POOL.find(a => a.id === 'resonance');
    if (art && art.apply) art.apply(char);
  }
  applySynergies(char);
}

function applySynergies(c) {
  for (const syn of SYNERGY_DEFS) {
    if (runState.artifacts.includes(syn.a) && runState.artifacts.includes(syn.b)) {
      syn.apply(c);
    }
  }
}

function goBase() {
  char.tx = BASE_X;
  char.ty = BASE_Y;
  const d0 = Math.sqrt((char.tx - char.x) ** 2 + (char.ty - char.y) ** 2);
  char.moveSpd = d0 / char.travelMs * 16.67;
  char.state = 'returning';
}

function updateChar(dt) {
  if (char.sc > 1.0) char.sc = Math.max(1.0, char.sc - 0.05);
  const s = char.state;

  char.frameT += dt;
  if (s === 'idle' || s === 'stunned') {
    char.sprFrame = 'idle_01';
    char.frameT = 0;
  } else if (s === 'moving') {
    const fi = Math.min(3, Math.floor(char.frameT / FRAME_MS));
    char.sprFrame = `jump0${fi + 1}`;
  } else if (s === 'eating') {
    char.sprFrame = 'jump04';
  } else if (s === 'returning') {
    const fi = Math.min(1, Math.floor(char.frameT / FRAME_MS));
    char.sprFrame = `jump0${fi + 5}`;
  } else if (s === 'landing') {
    const fi = Math.min(1, Math.floor(char.frameT / FRAME_MS));
    char.sprFrame = fi === 0 ? 'jump07' : 'jump08';
  }

  if (s === 'idle' || s === 'eating' || s === 'stunned' || s === 'landing') return;

  const dx = char.tx - char.x;
  const dy = char.ty - char.y;
  const d  = Math.sqrt(dx * dx + dy * dy);
  const spd = char.moveSpd * (dt / 16.67);

  if (d < spd) {
    char.x = char.tx; char.y = char.ty;
    if (s === 'moving') {
      char.state = 'eating';
      char.frameT = 0;
      startEat(char.tr, char.tc);
    } else if (s === 'returning') {
      char.state = 'landing';
      char.frameT = 0;
      safeTimeout(() => {
        char.state = 'idle';
        char.frameT = 0;
        locked = false;
      }, FRAME_MS * 2 + 40);
    }
  } else {
    char.x += (dx / d) * spd;
    char.y += (dy / d) * spd;
  }
}

function updateHyper() {
  const hyperSec = (nodeConfig && nodeConfig.hyperStart) ? nodeConfig.hyperStart + (char.hyperStartBonus || 0) : 999;
  const wasHyper = isHyper;
  isHyper = gameElapsed / 1000 >= hyperSec;
  if (isHyper && !wasHyper) {
    bigPopup('⚡ HYPER!', '#ff3366');
    shake(12, 20);
    if (char.hyperHealAmt > 0) {
      char.hp = Math.min(char.maxHp, char.hp + char.hyperHealAmt);
      popup(AW / 2, AH / 2 - 30, '+' + Math.round(char.hyperHealAmt) + ' HP', '#7ec850');
    }
    if (char.hyperHeal) {
      char.hp = char.maxHp;
      bigPopup('♾️ FULL HEAL!', '#3498db');
    }
    const prog = getRunProg(); prog.hyperReached++; saveRunProg(prog);
  }
  if (!isHyper) {
    hyperPulseTimer = 0; hyperPulseActive = false; hyperPulseRemain = 0;
  }
}

// ── 소모품 유틸 ──
function grantConsumableQuiet() {
  if (runConsumables.length >= 3) return;
  const available = CONSUMABLE_POOL.filter(c => !runConsumables.find(r => r.id === c.id));
  if (!available.length) return;
  runConsumables.push(available[Math.floor(Math.random() * available.length)]);
}

function grantConsumable() {
  if (runConsumables.length >= 3) return;
  const available = CONSUMABLE_POOL.filter(c => !runConsumables.find(r => r.id === c.id));
  if (!available.length) return;
  const pick = available[Math.floor(Math.random() * available.length)];
  runConsumables.push(pick);
  bigPopup(pick.icon + ' ' + pick.name + ' 획득!', '#aaddff');
}

function useConsumable(idx) {
  if (idx < 0 || idx >= runConsumables.length) return;
  if (gstate !== 'playing') return;
  const c = runConsumables.splice(idx, 1)[0];
  c.use();
  haptic([20, 10, 40]);
}
