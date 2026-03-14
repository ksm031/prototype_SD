// ═══════════════════════════════════════
//  STATE — 게임 상태 변수 + 스토리지 헬퍼
// ═══════════════════════════════════════

const SK = { gold: 'cc_gold', hs: 'cc_hs', mats: 'cc_mats', stats: 'cc_stats', achieve: 'cc_achievements', runprog: 'cc_run_progress' };

// ── 캔버스 ──
const canvas = document.getElementById('gc');
const ctx    = canvas.getContext('2d');

// ── 게임 상태 ──
let gstate  = 'idle';  // idle | playing | paused | over
let grid    = [];
let char    = {};

let gameElapsed = 0;
let sGold = 0, sBlocks = 0, sMaxCombo = 0;
let sDestroyed = { red: 0, blue: 0, yellow: 0, green: 0, purple: 0 };
let slowFactor = 1.0, lastTS = 0, rafID = null;
let locked = false;
let steelSpawnTimer = 0;
let timebombSpawnTimer = 0;

// ── 기믹 상태 ──
let stageGimmicks      = new Set();
let gimmickSpawnTimers = {};
let drainStormTimer      = 0;
let drainStormActive     = false;
let drainStormRemain     = 0;
let drainStormShakeTimer = 0;
let earthquakeTimer    = 0;
let earthquakePending  = false;
let rotUpdateTimer     = 0;
let reviveQueue        = [];
let blockLockActive    = false;
let blockLockRect      = null;
let blockLockCycle     = 0;
let darkZoneRect       = null;
let darkRevealCell     = null;
let darkRevealTimer    = 0;
let timePressureActive     = false;
let timePressureTimer      = 0;
let timePressureCombo      = 0;
let timePressureTarget     = 0;
let timePressureInterval   = 30000;
let timePressureIntervalTimer = 0;
let targetChainId = -1;
let pendingTimers = new Set();
let chainIv = null;

// ── 런/노드 상태 ──
let runState = { act: 0, node: 0, artifacts: [] };
let nodeConfig = null;
let nodeClearTriggered = false;

// ── 로그라이크 확장 상태 ──
let runConsumables   = [];
let consumeEffects   = { timeStop: 0, chainSurge: 0 };
let _pendingBossEvent = null;

// ── 시각 효과 상태 ──
let shakeFr = 0, shakeAmt = 0;
let renderOx = 0, renderOy = 0;
let popups    = [];
let particles = [];
let ripples   = [];
let flashes   = [];

// ═══════════════════════════════════════
//  STORAGE
// ═══════════════════════════════════════
const getGold = () => +(localStorage.getItem(SK.gold) || 0);
const getHS   = () => +(localStorage.getItem(SK.hs)   || 0);
const saveGold = v => localStorage.setItem(SK.gold, v);
const saveHS   = v => localStorage.setItem(SK.hs,   v);

const DEFAULT_STAT_LEVELS = { recovery:0, impact:0, speed:0, vitality:0, maxhp:0, movespeed:0 };
const getStatLevels  = () => Object.assign({}, DEFAULT_STAT_LEVELS, JSON.parse(localStorage.getItem(SK.stats)||'{}'));
const saveStatLevels = v  => localStorage.setItem(SK.stats, JSON.stringify(v));
function getStatLevel(id)       { return getStatLevels()[id] || 0; }
function saveStatLevel(id, lv)  { const d = getStatLevels(); d[id] = lv; saveStatLevels(d); }
function getStatValue(id)       { const lv = getStatLevel(id); return STATS[id].tiers[lv].value; }

const DEFAULT_MATS = { red: 0, blue: 0, yellow: 0, green: 0, purple: 0 };
const getMats = () => Object.assign({}, DEFAULT_MATS, JSON.parse(localStorage.getItem(SK.mats) || '{}'));
const saveMats = v => localStorage.setItem(SK.mats, JSON.stringify(v));

function addMats(gained) {
  const cur = getMats();
  for (const k of Object.keys(DEFAULT_MATS)) cur[k] = (cur[k] || 0) + (gained[k] || 0);
  saveMats(cur);
  return cur;
}

const DEFAULT_RUN_PROG = { totalRuns:0, wins:0, act1Clears:0, act2Clears:0, maxComboEver:0, lifetimeBlocks:0, lifetimeLegendary:0, maxArtifactsInRun:0, hyperReached:0, perfectNodeClears:0, maxNodeSec:0, legendaryArtifactsEver:0 };
const getRunProg  = () => Object.assign({}, DEFAULT_RUN_PROG, JSON.parse(localStorage.getItem(SK.runprog) || '{}'));
const saveRunProg = v  => localStorage.setItem(SK.runprog, JSON.stringify(v));
const getAchievements  = () => JSON.parse(localStorage.getItem(SK.achieve) || '{}');
const saveAchievements = v  => localStorage.setItem(SK.achieve, JSON.stringify(v));

// ── 유틸 ──
function safeTimeout(fn, ms) {
  const id = setTimeout(() => { pendingTimers.delete(id); fn(); }, ms);
  pendingTimers.add(id);
  return id;
}
