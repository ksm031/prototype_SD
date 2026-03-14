// ═══════════════════════════════════════
//  CONFIG — 상수, 색상, 그리드 설정, 스프라이트
// ═══════════════════════════════════════
const AW = 360, AH = 520;
const COLS = 6, ROWS = 7, CELL = 50;
const GX = (AW - COLS * CELL) / 2;   // grid offset X = 40
const GY = 64;                         // grid offset Y

const ALL_COLORS = ['red', 'blue', 'yellow', 'green', 'purple'];
const BCOLOR = { red: '#e74c3c', blue: '#3498db', yellow: '#f1c40f', green: '#2ecc71', purple: '#9b59b6', legendary: '#f0c040', firework: '#ff7f2a', bomb: '#e05c00', steel: '#5a6473', rot: '#2d7a2d', shield: '#2e6ba0' };
const BDARK  = { red: '#922b21', blue: '#1a5276', yellow: '#9a7d0a', green: '#1a7a43', purple: '#5b2c6f', legendary: '#a07010', firework: '#b35000', bomb: '#8b3900', steel: '#2e3440', rot: '#1a4a1a', shield: '#1a3d5c' };
const BRIGHT = { red: '#f1948a', blue: '#7fb3d3', yellow: '#f9e79f', green: '#a9dfbf', purple: '#d2b4de', legendary: '#fffacc', firework: '#ffb87a', bomb: '#ffaa55', steel: '#aab4c2', rot: '#5db85d', shield: '#60aadd' };
const BGRAY  = { red: '#9a9a9a', blue: '#cccccc', yellow: '#e8e8e8', green: '#b5b5b5', purple: '#777777', legendary: '#d4d4d4', firework: '#aaaaaa', bomb: '#888888', steel: '#5a6473', rot: '#999999', shield: '#aaaaaa' };
const COLOR_SHAPE = { red: '♦', blue: '●', yellow: '★', green: '▲', purple: '■' };
const COLOR_ICON  = { red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', purple: '🟣' };

let colorCount = 3;
let COLORS = ALL_COLORS.slice(0, colorCount);

function setColors(count) {
  colorCount = count;
  COLORS = ALL_COLORS.slice(0, colorCount);
}

// 배경 이미지 (act별 + HYPER)
const BG_IMGS = ['res/bg/phase1.png','res/bg/phase2.png','res/bg/phase3.png','res/bg/phase4.png'].map(src => {
  const img = new Image(); img.src = src; return img;
});

const BASE_X   = AW / 2;
const BASE_Y   = GY + ROWS * CELL + 55;   // ≈ 449
const CHAIN_MS = 50;       // ms between block pops
const FRAME_MS = 80;       // ms per sprite frame

const MAX_PARTICLES = 300;
const MAX_RIPPLES   = 40;
const MAX_POPUPS    = 20;
const BOMB_RADIUS   = 2;

const COMBO_MILESTONES = [
  { threshold: 30, shakeAmt: 18, shakeFr: 40, haptic: [50, 15, 80, 15, 50], text: 'LEGENDARY!!', color: '#c084fc', isStar: true },
  { threshold: 10, shakeAmt: 12, shakeFr: 28, haptic: [30, 10, 50],          text: 'CHOMP!!',     color: '#ff4444' },
  { threshold:  5, shakeAmt:  5, shakeFr: 14, haptic: [20, 10, 30],          text: 'COMBO!',      color: '#f0c040' },
];

const ITEM_DROP_TIERS = [
  { threshold: 22, type: 'bomb'     },
  { threshold: 12, type: 'firework' },
];

// ── HYPER 상수 ──
let isHyper = false;
let hyperPulseTimer  = 0;
let hyperPulseActive = false;
let hyperPulseRemain = 0;
const PULSE_INTERVAL = 15000;
const PULSE_DURATION = 3000;

// ── CHOMPY 스프라이트 ──
const SPR = {};
(function loadSprites() {
  const names = ['idle_01','jump01','jump02','jump03','jump04','jump05','jump06','jump07','jump08'];
  for (const n of names) {
    const img = new Image();
    img.src = `res/chompy/${n}.png`;
    SPR[n] = img;
  }
})();

// ── 기믹 상수 ──
const GIMMICK_SPAWN_INTERVALS = {
  ice:       [30000, 22000, 15000, 10000],
  split:     [35000, 25000, 18000, 12000],
  mirror:    [28000, 20000, 14000, 10000],
  petrified: [25000, 18000, 12000,  8000],
  shield:    [40000, 30000, 22000, 15000],
  rot:       [50000, 38000, 28000, 18000],
  revive:    [45000, 33000, 24000, 16000],
};
const DRAIN_STORM_ACTIVE_MS  = 5000;
const DRAIN_STORM_COOLDOWN   = 5000;
const EARTHQUAKE_INTERVAL    = 18000;
const ROT_SPREAD_INTERVAL    = 10000;
const REVIVE_DELAY           = 15000;
const BLOCK_LOCK_DURATION    = 12000;
const BLOCK_LOCK_COOLDOWN    = 20000;
const TIMEBOMB_FUSE          = 8000;

const GIMMICK_ICONS = { ice:'🧊', split:'🔀', mirror:'🪞', petrified:'🗿', shield:'🛡', rot:'🦠', revive:'💀' };
const GIMMICK_CLRS  = { ice:'#88ccff', split:'#ff88cc', mirror:'#aaccff', petrified:'#cc9955', shield:'#60aadd', rot:'#44bb44', revive:'#cc44ff' };
const GIMMICK_DESCS = {
  ice:           ['🧊', '얼음 블록', '폭발·불꽃으로만 파괴 가능'],
  split:         ['🔀', '분열 블록', '파괴 시 인접 칸에 새 블록 생성'],
  mirror:        ['🪞', '미러 블록', 'HP 회복 없음 · 골드 ×2'],
  petrified:     ['🗿', '석화 블록', '2번 타격해야 파괴'],
  shield:        ['🛡', '보호막 블록', '인접 블록을 공격으로부터 보호'],
  rot:           ['🦠', '부패 블록', '시간이 지나면 주변 블록으로 번짐'],
  revive:        ['💀', '부활 블록', '잠시 후 파괴된 블록 일부가 부활'],
  fog:           ['🌫️', '안개', '흐릿한 구름이 시야를 가림'],
  colorblind:    ['🎨', '색맹', '모든 블록이 회색으로 표시됨'],
  earthquake:    ['🌋', '지진', '18초마다 블록 위치가 무작위 셔플'],
  drain_storm:   ['🌪️', '드레인 폭풍', '주기적으로 HP 드레인 속도 2배'],
  darkzone:      ['🌑', '어둠 구역', '그리드 일부가 완전히 가려짐 · 탭하면 잠깐 보임'],
  reverse_chain: ['🔃', '역체인', '체인이 가까운 블록이 아닌 먼 블록부터 파괴'],
  block_lock:    ['🔐', '블록 잠금', '주기적으로 일부 구역 탭 불가'],
  time_pressure: ['⏰', '시간 압박', '제한 시간 내 목표 콤보 달성 필요'],
};
