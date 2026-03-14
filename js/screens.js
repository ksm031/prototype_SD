// ═══════════════════════════════════════
//  SCREENS — 화면 전환, 상점, 결과, 아티팩트, 도전과제
// ═══════════════════════════════════════

function showScreen(id) {
  ['ms','rs','ss','af','cs','be','si'].forEach(s => {
    const el = document.getElementById(s);
    if (!el) return;
    el.style.display = 'none';
    el.classList.remove('active');
  });
  canvas.style.display = 'none';
  document.getElementById('pause-btn').style.display = 'none';
  if (id === 'gc') {
    canvas.style.display = 'block';
    document.getElementById('pause-btn').style.display = 'flex';
    document.getElementById('pause-btn').style.alignItems = 'center';
    document.getElementById('pause-btn').style.justifyContent = 'center';
  } else {
    const el = document.getElementById(id);
    el.style.display = 'flex';
    el.classList.add('active');
  }
}

function showMain() {
  stopGame();
  document.getElementById('m-hs').textContent   = getHS() + '초';
  document.getElementById('m-gold').textContent = getGold() + ' G';

  const mats = getMats();
  const parts = Object.entries(mats).filter(([k, v]) => k !== 'rare' && v > 0).map(([k, v]) => `${COLOR_ICON[k]}${v}`);
  if (mats.rare > 0) parts.push(`⭐${mats.rare}`);
  document.getElementById('m-mats').textContent = parts.length ? parts.join(' ') : '—';

  showScreen('ms');
  setColors(colorCount);
}

function stopGame() {
  cancelAnimationFrame(rafID);
  for (const id of pendingTimers) clearTimeout(id);
  pendingTimers.clear();
  if (chainIv !== null) { clearInterval(chainIv); chainIv = null; }
  locked = false;
  gstate = 'idle';
  document.getElementById('pause-btn').textContent = '⏸';
}

// ── 런/노드 플로우 ──
function startRun() {
  runState = { act: 0, node: 0, artifacts: [], _devilDeal: false };
  runConsumables = [];
  consumeEffects = { timeStop: 0, chainSurge: 0 };
  const prog = getRunProg(); prog.totalRuns++; saveRunProg(prog);
  startNode(0, 0);
}

function startNode(act, nodeIdx) {
  runState.act  = act;
  runState.node = nodeIdx;
  nodeConfig = NODE_DEFS[act][nodeIdx];
  nodeClearTriggered = false;

  stopGame();
  gstate = 'playing';
  sGold = 0; sBlocks = 0; sMaxCombo = 0; gameElapsed = 0;
  sDestroyed = { red: 0, blue: 0, yellow: 0, green: 0, purple: 0 };
  colorCount = nodeConfig.colors || 3; COLORS = ALL_COLORS.slice(0, colorCount);
  isHyper = false; hyperPulseTimer = 0; hyperPulseActive = false; hyperPulseRemain = 0;
  steelSpawnTimer = nodeConfig.steelMs || 20000;
  timebombSpawnTimer = (nodeConfig.steelMs || 20000) * 1.8;
  slowFactor = 1.0; lastTS = 0; locked = false;
  consumeEffects = { timeStop: 0, chainSurge: 0 };
  particles = []; popups = []; ripples = []; flashes = []; pendingTimers = new Set();
  shakeFr = 0; shakeAmt = 0;

  // 기믹 초기화
  stageGimmicks = new Set(nodeConfig.gimmicks || []);
  gimmickSpawnTimers = {};
  const _tier = nodeConfig.tier || 0;
  for (const g of ['ice','split','mirror','petrified','shield','rot','revive']) {
    if (stageGimmicks.has(g)) gimmickSpawnTimers[g] = GIMMICK_SPAWN_INTERVALS[g][_tier];
  }
  drainStormTimer = 0; drainStormActive = false; drainStormRemain = 0; drainStormShakeTimer = 0;
  earthquakeTimer = 0; earthquakePending = false; rotUpdateTimer = 0; reviveQueue = [];
  blockLockActive = false; blockLockRect = null; blockLockCycle = 0;
  darkZoneRect = stageGimmicks.has('darkzone') ? pickRect() : null;
  darkRevealCell = null; darkRevealTimer = 0;
  timePressureActive = false; timePressureTimer = 0; timePressureCombo = 0;
  timePressureTarget = nodeConfig.timePressure ? nodeConfig.timePressure.combo : 0;
  timePressureInterval = nodeConfig.timePressure ? nodeConfig.timePressure.interval : 30000;
  timePressureIntervalTimer = timePressureInterval;

  initGrid();
  initChar();
  showNodeIntro();
}

function showNodeIntro() {
  const nc = nodeConfig;
  const actLabel = ACT_LABELS[runState.act] || ('Act ' + (runState.act + 1));
  const typeColor = nc.type === 'boss' ? '#ff8844' : nc.type === 'final' ? '#c084fc' : '#7ec850';

  document.getElementById('si-act-label').textContent = actLabel;
  document.getElementById('si-act-label').style.color = typeColor;
  document.getElementById('si-node-label').textContent =
    (nc.type === 'boss' ? '⚔️ ' : nc.type === 'final' ? '🏆 ' : '') + nc.label;
  document.getElementById('si-time-label').textContent = '제한 시간 ' + nc.clearSec + '초';

  const gList = document.getElementById('si-gimmick-list');
  const gimmicks = nc.gimmicks || [];
  if (gimmicks.length === 0) {
    gList.innerHTML = '<div style="text-align:center;font-size:12px;color:#505070">이 스테이지에는 방해 기믹이 없습니다</div>';
  } else {
    gList.innerHTML = gimmicks.map(g => {
      const d = GIMMICK_DESCS[g];
      if (!d) return '';
      return `<div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border-radius:10px;padding:8px 12px">
        <span style="font-size:22px;line-height:1">${d[0]}</span>
        <div>
          <div style="font-size:13px;font-weight:700;color:#dde">${d[1]}</div>
          <div style="font-size:11px;color:#7a7a9a;margin-top:2px">${d[2]}</div>
        </div>
      </div>`;
    }).join('');
  }

  showScreen('si');
}

function beginNode() {
  showScreen('gc');
  rafID = requestAnimationFrame(loop);
}

function nodeCleared() {
  if (gstate !== 'playing') return;
  gstate = 'over';
  const isFinal = nodeConfig.type === 'final';
  if (isFinal) {
    shake(18, 50);
    bigPopup('🏆 CLEAR!!', '#f0c040');
    const prog = getRunProg(); prog.wins++; saveRunProg(prog);
  } else {
    const isBoss = nodeConfig.type === 'boss';
    shake(isBoss ? 14 : 8, isBoss ? 30 : 16);
    bigPopup(nodeConfig.label + ' CLEAR!', isBoss ? '#ff8844' : '#7ec850');
    if (nodeConfig.type === 'boss') {
      const prog = getRunProg();
      if (runState.act === 0) prog.act1Clears++;
      if (runState.act === 1) prog.act2Clears++;
      saveRunProg(prog);
    }
  }
  if (Math.ceil(char.hp) >= char.maxHp) {
    const prog = getRunProg(); prog.perfectNodeClears++; saveRunProg(prog);
  }
  const nodeSec = Math.floor(gameElapsed / 1000);
  const prog2 = getRunProg();
  if (nodeSec > prog2.maxNodeSec) { prog2.maxNodeSec = nodeSec; saveRunProg(prog2); }

  if (!isFinal) {
    const earned = Math.max(10, sGold);
    saveGold(getGold() + earned);
    const matEvery = (char && char.matDropEvery) ? char.matDropEvery : 5;
    const gainedMats = {};
    for (const [color, cnt] of Object.entries(sDestroyed)) {
      const g = Math.floor(cnt / matEvery);
      if (g > 0) gainedMats[color] = g;
    }
    addMats(gainedMats);
    const p3 = getRunProg(); p3.lifetimeBlocks += sBlocks; if (sMaxCombo > p3.maxComboEver) p3.maxComboEver = sMaxCombo; saveRunProg(p3);
  }

  slowFactor = 0.2;
  safeTimeout(() => {
    slowFactor = 1.0;
    if (isFinal) {
      showResult(true);
    } else if (nodeConfig.type === 'boss') {
      grantConsumable();
      showBossEvent(() => showArtifactChoice());
    } else {
      showArtifactChoice();
    }
  }, 1600);
}

// ── 보스 이벤트 ──
let _currentBossEvent = null;

function showBossEvent(afterFn) {
  _pendingBossEvent = afterFn;
  _currentBossEvent = BOSS_EVENT_POOL[Math.floor(Math.random() * BOSS_EVENT_POOL.length)];
  const event = _currentBossEvent;
  const isDevil = event.type === 'devil';
  document.getElementById('be-type-label').textContent = isDevil ? '👹 악마의 제안' : '😇 천사의 선물';
  document.getElementById('be-type-label').style.color = isDevil ? '#ff5555' : '#88aaff';
  document.getElementById('be-title').textContent = event.icon + ' ' + event.title;
  document.getElementById('be-desc').textContent = event.desc;

  const list = document.getElementById('be-list');
  list.innerHTML = event.choices.map((ch, i) => `
    <div class="event-card ${event.type}" onclick="selectBossEventChoice(${i})">
      <div class="event-label">${ch.label}</div>
      <div class="event-sub">${ch.sub}</div>
    </div>
  `).join('');
  showScreen('be');
}

function selectBossEventChoice(idx) {
  if (_currentBossEvent && _currentBossEvent.choices[idx]) {
    _currentBossEvent.choices[idx].fn();
  }
  _currentBossEvent = null;
  skipBossEvent();
}

function skipBossEvent() {
  const fn = _pendingBossEvent;
  _pendingBossEvent = null;
  if (fn) fn();
}

// ── 아티팩트 선택 ──
function getArtifactChoices(pool) {
  let effectivePool = pool;
  if (runState._devilDeal) { if (effectivePool !== 'legendary') effectivePool = 'rare'; runState._devilDeal = false; }
  const rarities = effectivePool === 'common'    ? ['common']
                 : effectivePool === 'rare'      ? ['common', 'rare']
                 : ['common', 'rare', 'legendary'];
  const available = ARTIFACT_POOL.filter(a => rarities.includes(a.rarity) && !runState.artifacts.includes(a.id));
  const shuffled  = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(3, shuffled.length));
}

function showArtifactChoice() {
  stopGame();
  const choices = getArtifactChoices(nodeConfig.pool);
  const actLabel = ACT_LABELS[runState.act] || '';
  document.getElementById('af-node-label').textContent =
    `${actLabel}  ·  노드 ${nodeConfig.label} 클리어!`;

  const rarityLabel = { common: '일반', rare: '희귀', legendary: '전설' };
  const list = document.getElementById('af-list');
  list.innerHTML = choices.map(art => {
    const synMatches = SYNERGY_DEFS.filter(s =>
      (s.a === art.id && runState.artifacts.includes(s.b)) ||
      (s.b === art.id && runState.artifacts.includes(s.a))
    );
    const synBadge = synMatches.length > 0
      ? `<span class="syn-badge">✨ 시너지: ${synMatches.map(s => s.desc).join(' / ')}</span>` : '';
    return `
    <div class="art-card ${art.rarity}" onclick="selectArtifact('${art.id}')">
      <div class="art-icon">${art.icon}</div>
      <div class="art-info">
        <div class="art-name">${art.name}</div>
        <div class="art-desc">${art.desc}</div>
        <span class="art-badge ${art.rarity}">${rarityLabel[art.rarity] || art.rarity}</span>
        ${synBadge}
      </div>
    </div>
  `}).join('');

  const activeSyns = SYNERGY_DEFS.filter(s =>
    runState.artifacts.includes(s.a) && runState.artifacts.includes(s.b));
  const synRow = document.getElementById('af-synergy-row');
  if (activeSyns.length > 0) {
    synRow.style.display = 'block';
    synRow.innerHTML = '✨ 활성 시너지: ' + activeSyns.map(s => `${s.icons} ${s.desc}`).join('  |  ');
  } else {
    synRow.style.display = 'none';
  }

  showScreen('af');
}

function selectArtifact(id) {
  runState.artifacts.push(id);
  const art = ARTIFACT_POOL.find(a => a.id === id);
  if (art && art.rarity === 'legendary') {
    const prog = getRunProg(); prog.legendaryArtifactsEver++; saveRunProg(prog);
  }
  const prog = getRunProg();
  if (runState.artifacts.length > prog.maxArtifactsInRun) {
    prog.maxArtifactsInRun = runState.artifacts.length; saveRunProg(prog);
  }
  nextNode();
}

function nextNode() {
  const actNodes = NODE_DEFS[runState.act];
  const nextNodeIdx = runState.node + 1;
  if (nextNodeIdx < actNodes.length) {
    startNode(runState.act, nextNodeIdx);
  } else {
    const nextAct = runState.act + 1;
    if (nextAct < NODE_DEFS.length) {
      startNode(nextAct, 0);
    } else {
      showResult(true);
    }
  }
}

function startGame() { startRun(); }

// ── 결과 화면 ──
function showResult(fromNodeClear) {
  const earned  = Math.max(10, sGold);
  const survived = Math.floor(gameElapsed / 1000);
  const newBest  = Math.max(getHS(), survived);
  if (!fromNodeClear) {
    saveGold(getGold() + earned);
  } else {
    saveGold(getGold() + earned);
  }
  saveHS(newBest);

  const matEvery = (char && char.matDropEvery) ? char.matDropEvery : 5;
  const gainedMats = {};
  for (const [color, cnt] of Object.entries(sDestroyed)) {
    const g = Math.floor(cnt / matEvery);
    if (g > 0) gainedMats[color] = g;
  }
  addMats(gainedMats);

  const prog = getRunProg();
  if (sMaxCombo > prog.maxComboEver) prog.maxComboEver = sMaxCombo;
  prog.lifetimeBlocks += sBlocks;
  saveRunProg(prog);

  const nodeLabel = nodeConfig ? `[${nodeConfig.label}] ${ACT_LABELS[runState.act] || ''}` : '—';
  document.getElementById('r-node').textContent     = nodeLabel;
  document.getElementById('r-time').textContent     = survived;
  document.getElementById('r-blk').textContent      = sBlocks;
  document.getElementById('r-combo').textContent    = sMaxCombo;
  document.getElementById('r-artifacts').textContent = runState.artifacts.length;
  document.getElementById('r-best').textContent     = newBest;
  document.getElementById('r-title').textContent    = fromNodeClear ? '🏆 런 클리어!' : '세션 종료!';

  const matParts = [];
  for (const [color, cnt] of Object.entries(gainedMats))
    if (cnt > 0) matParts.push(`${COLOR_ICON[color]}+${cnt}`);
  const matsRow = document.getElementById('r-mats-row');
  if (matParts.length > 0) {
    document.getElementById('r-mats').textContent = matParts.join('  ');
    matsRow.style.display = 'flex';
  } else {
    matsRow.style.display = 'none';
  }

  let d = 0;
  const step = Math.max(1, Math.ceil(earned / 40));
  const gel  = document.getElementById('r-gold');
  const anim = setInterval(() => {
    d = Math.min(d + step, earned);
    gel.textContent = d;
    if (d >= earned) { clearInterval(anim); }
  }, 40);

  const newlyDone = checkAchievements();
  const achRow = document.getElementById('r-ach-row');
  if (newlyDone.length > 0) {
    document.getElementById('r-ach-list').textContent = newlyDone.map(a => `${a.icon} ${a.name}`).join('  ');
    achRow.style.display = 'flex';
  } else {
    achRow.style.display = 'none';
  }

  showScreen('rs');
}

// ── 도전 과제 ──
function checkAchievements() {
  const prog = getRunProg();
  const done = getAchievements();
  const newlyDone = [];
  for (const def of ACHIEVEMENT_DEFS) {
    if (done[def.id]) continue;
    try {
      if (def.check(prog)) {
        done[def.id] = true;
        newlyDone.push(def);
        if (def.rewardGold > 0) saveGold(getGold() + def.rewardGold);
        if (def.rewardRare  > 0) { const m = getMats(); m.rare = (m.rare||0) + def.rewardRare; saveMats(m); }
      }
    } catch(e) {}
  }
  if (newlyDone.length) saveAchievements(done);
  return newlyDone;
}

function renderAchievements() {
  const done = getAchievements();
  const prog = getRunProg();
  const container = document.getElementById('sh-achieve');
  const completedCount = Object.values(done).filter(Boolean).length;
  container.innerHTML = `
    <div style="text-align:center;font-size:12px;color:#606080;padding:4px 0 8px">
      달성 ${completedCount} / ${ACHIEVEMENT_DEFS.length}
    </div>
    ${ACHIEVEMENT_DEFS.map(def => {
      const isDone = !!done[def.id];
      const rewardStr = def.rewardGold > 0 ? `💰${def.rewardGold}G` : '';
      const rareStr   = def.rewardRare  > 0 ? `⭐${def.rewardRare}` : '';
      return `
        <div class="ach-item ${isDone ? 'done' : ''}">
          <div class="ach-icon">${def.icon}</div>
          <div class="ach-info">
            <div class="ach-name">${def.name}</div>
            <div class="ach-desc">${def.desc}</div>
            ${rewardStr || rareStr ? `<div class="ach-reward">${[rewardStr,rareStr].filter(Boolean).join(' ')}</div>` : ''}
          </div>
          <div class="ach-check">${isDone ? '✅' : '⬜'}</div>
        </div>
      `;
    }).join('')}
  `;
}

// ── 상점 / 업그레이드 ──
function canUpgradeStat(id) {
  const lv    = getStatLevel(id);
  const tiers = STATS[id].tiers;
  if (lv >= tiers.length - 1) return { ok: false, reason: 'MAX' };
  const next = tiers[lv + 1];
  const gold = getGold(), mats = getMats();
  if (gold < next.gold) return { ok: false, reason: `골드 부족 (${next.gold - gold}G)` };
  for (const [k, need] of Object.entries(next.mat)) {
    const have = k === 'rare' ? (mats.rare || 0) : (mats[k] || 0);
    if (have < need) return { ok: false, reason: `${COLOR_ICON[k]||'⭐'} 부족` };
  }
  return { ok: true };
}

function doUpgradeStat(id) {
  const chk = canUpgradeStat(id);
  if (!chk.ok) return;
  const lv   = getStatLevel(id);
  const next = STATS[id].tiers[lv + 1];
  const mats = getMats();
  saveGold(getGold() - next.gold);
  for (const [k, need] of Object.entries(next.mat)) {
    if (k === 'rare') mats.rare = (mats.rare || 0) - need;
    else mats[k] = (mats[k] || 0) - need;
  }
  saveMats(mats);
  saveStatLevel(id, lv + 1);
  renderUpgradeTab();
}

function shopTab(tab) {
  document.getElementById('sh-upgrade').style.display = tab === 'upgrade' ? 'flex'  : 'none';
  document.getElementById('sh-achieve').style.display = tab === 'achieve' ? 'flex'  : 'none';
  document.getElementById('sh-deco').style.display    = tab === 'deco'    ? 'block' : 'none';
  document.getElementById('tab-up').classList.toggle('shop-tab-active',  tab === 'upgrade');
  document.getElementById('tab-ach').classList.toggle('shop-tab-active', tab === 'achieve');
  document.getElementById('tab-dec').classList.toggle('shop-tab-active', tab === 'deco');
  if (tab === 'achieve') renderAchievements();
}

function renderUpgradeTab() {
  const gold = getGold(), mats = getMats();

  document.getElementById('sh-gold').textContent = gold.toLocaleString() + ' G 🪙';
  const matStr = Object.entries(mats).filter(([k,v])=>k!=='rare'&&v>0).map(([k,v])=>`${COLOR_ICON[k]}${v}`).join(' ');
  document.getElementById('sh-mats-line').textContent = (matStr||'재료 없음') + (mats.rare>0 ? '  ⭐'+mats.rare : '');

  const container = document.getElementById('sh-upgrade');

  function statCard(id) {
    const s    = STATS[id];
    const lv   = getStatLevel(id);
    const cur  = s.tiers[lv];
    const max  = lv >= s.tiers.length - 1;
    const next = max ? null : s.tiers[lv + 1];
    const chk  = max ? { ok: false, reason: 'MAX' } : canUpgradeStat(id);

    const isSpeed     = id === 'speed';
    const isVitality  = id === 'vitality';
    const isMaxhp     = id === 'maxhp';
    const isMoveSpeed = id === 'movespeed';
    let curVal  = isVitality  ? Math.round((1 - cur.value) * 100) + '% 저항'
                : isSpeed     ? cur.value + 'ms'
                : isMaxhp     ? cur.value + ' HP'
                : isMoveSpeed ? cur.value + 'ms'
                : cur.value;
    let nextVal = '';
    if (next) {
      nextVal = isVitality  ? Math.round((1 - next.value) * 100) + '% 저항'
              : isSpeed     ? next.value + 'ms'
              : isMaxhp     ? next.value + ' HP'
              : isMoveSpeed ? next.value + 'ms'
              : next.value;
    }

    let reqHtml = '';
    if (next) {
      reqHtml += `<span style="color:${gold>=next.gold?'#7ec850':'#ff5555'}">💰${next.gold}G</span>`;
      for (const [k, need] of Object.entries(next.mat)) {
        const have = k === 'rare' ? (mats.rare||0) : (mats[k]||0);
        const ok = have >= need;
        reqHtml += ` <span style="color:${ok?'#7ec850':'#ff5555'}">${COLOR_ICON[k]||'⭐'}${need}</span>`;
      }
    }

    const tierDots = s.tiers.map((_,i) =>
      `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${i<=lv?'#f0c040':'rgba(255,255,255,0.15)'};margin:0 2px"></span>`
    ).join('');

    return `<div class="stats-box" style="padding:12px 15px;gap:6px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:15px;font-weight:700;color:#e0e0f0">${s.icon} ${s.name}</span>
        <span style="font-size:11px;color:#606080">${tierDots}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px">
        <span style="color:#9090b0">${s.desc}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:14px">
        <span style="color:#ccc">${curVal}</span>
        ${next ? `<span style="color:#505070">→</span><span style="color:#7ec850;font-weight:700">${nextVal}</span>` : ''}
      </div>
      ${next ? `<div style="font-size:12px;color:#9090b0;margin-top:2px">${reqHtml}</div>` : ''}
      ${max
        ? `<div style="text-align:center;color:#f0c040;font-size:12px;font-weight:700;padding:4px 0">✅ MAX</div>`
        : `<button class="btn ${chk.ok?'btn-p':'btn-s'}" onclick="doUpgradeStat('${id}')"
             style="padding:8px;font-size:13px${chk.ok?'':';opacity:.5;cursor:not-allowed'}">
             ${chk.ok ? '업그레이드' : chk.reason}
           </button>`
      }
    </div>`;
  }

  container.innerHTML = Object.keys(STATS).map(statCard).join('');
}

function showShop() {
  stopGame();
  showScreen('ss');
  shopTab('upgrade');
  renderUpgradeTab();
}

function openResetPopup()  { document.getElementById('reset-popup').classList.remove('hidden'); }
function closeResetPopup() { document.getElementById('reset-popup').classList.add('hidden'); }

function doReset(type) {
  closeResetPopup();
  if (type === 'all') {
    Object.values(SK).forEach(k => localStorage.removeItem(k));
  } else {
    [SK.gold, SK.mats, SK.stats].forEach(k => localStorage.removeItem(k));
  }
  renderUpgradeTab();
  showMain();
}
