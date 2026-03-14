// ═══════════════════════════════════════
//  DATA — 노드, 아티팩트, 시너지, 소모품, 보스이벤트, 도전과제, 스탯
// ═══════════════════════════════════════

const ACT_LABELS = ['ACT 1 — 초원 🌿', 'ACT 2 — 화산 🌋', 'ACT 3 — 혼돈 🌀'];

const NODE_DEFS = [
  // ACT 1
  [
    { label:'1-1',    type:'normal', clearSec:60,  drainMult:1.0, colors:3, steelMs:22000, tier:0, hyperStart:999, pool:'common'  },
    { label:'1-2',    type:'normal', clearSec:75,  drainMult:1.0, colors:3, steelMs:20000, tier:0, hyperStart:999, pool:'common',
      gimmicks:['mirror'] },
    { label:'1-3',    type:'normal', clearSec:90,  drainMult:1.1, colors:4, steelMs:16000, tier:1, hyperStart:999, pool:'common',
      gimmicks:['ice', 'drain_storm'] },
    { label:'1-BOSS', type:'boss',   clearSec:120, drainMult:1.3, colors:4, steelMs:12000, tier:1, hyperStart:90, pool:'rare',
      gimmicks:['petrified'],
      timePressure:{ combo:10, interval:25000 } },
  ],
  // ACT 2
  [
    { label:'2-1',    type:'normal', clearSec:90,  drainMult:1.3, colors:4, steelMs:12000, tier:1, hyperStart:999, pool:'common',
      gimmicks:['split', 'fog'] },
    { label:'2-2',    type:'normal', clearSec:100, drainMult:1.4, colors:4, steelMs:10000, tier:2, hyperStart:999, pool:'common',
      gimmicks:['shield', 'darkzone'] },
    { label:'2-3',    type:'elite',  clearSec:90,  drainMult:1.4, colors:5, steelMs:9000,  tier:2, hyperStart:999, pool:'rare', fastPulse:true,
      gimmicks:['rot', 'mirror', 'colorblind'] },
    { label:'2-BOSS', type:'boss',   clearSec:150, drainMult:1.6, colors:5, steelMs:8000,  tier:2, hyperStart:100, pool:'rare',
      gimmicks:['reverse_chain', 'earthquake', 'petrified'] },
  ],
  // ACT 3
  [
    { label:'3-1',    type:'normal', clearSec:100, drainMult:1.6, colors:5, steelMs:8000,  tier:2, hyperStart:999, pool:'common',
      gimmicks:['block_lock', 'revive', 'split'] },
    { label:'3-2',    type:'elite',  clearSec:110, drainMult:1.7, colors:5, steelMs:6000,  tier:3, hyperStart:999, pool:'rare',
      gimmicks:['colorblind', 'ice', 'shield', 'rot'] },
    { label:'3-3',    type:'elite',  clearSec:120, drainMult:1.8, colors:5, steelMs:5000,  tier:3, hyperStart:999, pool:'rare',
      gimmicks:['drain_storm', 'darkzone', 'mirror', 'earthquake'] },
    { label:'FINAL',  type:'final',  clearSec:180, drainMult:2.0, colors:5, steelMs:4000,  tier:3, hyperStart:90,  pool:'legendary',
      gimmicks:['reverse_chain', 'fog', 'petrified', 'revive', 'drain_storm', 'earthquake'],
      timePressure:{ combo:15, interval:22000 } },
  ],
];

// ── 아티팩트 풀 (30종) ──
const ARTIFACT_POOL = [
  // ─ 일반 (16종) ─
  { id:'first_aid',     get name(){ return t('art_first_aid_name'); },     icon:'🩹', rarity:'common',    get desc(){ return t('art_first_aid_desc'); },     apply: c => { c.hpPerBlock += 1.5 * c.maxHp / 100; } },
  { id:'attract_core',  get name(){ return t('art_attract_core_name'); },  icon:'🧲', rarity:'common',    get desc(){ return t('art_attract_core_desc'); },  apply: c => { c.impactRange += 1; } },
  { id:'chain_gear',    get name(){ return t('art_chain_gear_name'); },    icon:'⚙️', rarity:'common',    get desc(){ return t('art_chain_gear_desc'); },    apply: c => { c.chainDelay = Math.max(10, c.chainDelay - 10); } },
  { id:'sprint_boots',  get name(){ return t('art_sprint_boots_name'); },  icon:'🏃', rarity:'common',    get desc(){ return t('art_sprint_boots_desc'); },  apply: c => { c.travelMs = Math.max(80, c.travelMs - 50); } },
  { id:'gold_finger',   get name(){ return t('art_gold_finger_name'); },   icon:'💰', rarity:'common',    get desc(){ return t('art_gold_finger_desc'); },   apply: c => { c.goldPerBlock += 3; } },
  { id:'vitality_src',  get name(){ return t('art_vitality_src_name'); },  icon:'❤️', rarity:'common',    get desc(){ return t('art_vitality_src_desc'); },  apply: c => { c.maxHp += 20; c.hp = Math.min(c.maxHp, c.hp + 20); } },
  { id:'life_sprout',   get name(){ return t('art_life_sprout_name'); },   icon:'🌿', rarity:'common',    get desc(){ return t('art_life_sprout_desc'); },   apply: c => { c.drainMult *= 0.92; } },
  { id:'crystal_shard', get name(){ return t('art_crystal_shard_name'); }, icon:'💎', rarity:'common',    get desc(){ return t('art_crystal_shard_desc'); }, apply: c => { c.legendSpawnRate += 0.0015; c.legendHeal = Math.max(c.legendHeal, 0.10); } },
  { id:'glass_cannon',  get name(){ return t('art_glass_cannon_name'); },  icon:'🔫', rarity:'common',    get desc(){ return t('art_glass_cannon_desc'); },  apply: c => { c.maxHp = Math.max(30, c.maxHp - 30); c.hp = Math.min(c.maxHp, c.hp); c.goldPerBlock += 8; c.impactRange += 1; } },
  { id:'aim_lens',      get name(){ return t('art_aim_lens_name'); },      icon:'🎯', rarity:'common',    get desc(){ return t('art_aim_lens_desc'); },      apply: c => { c.comboGoldBonus += 10; } },
  { id:'hunger',        get name(){ return t('art_hunger_name'); },        icon:'🍽️', rarity:'common',    get desc(){ return t('art_hunger_desc'); },        apply: c => { c.hungerActive = true; c.hungerCombo = 0; } },
  { id:'resonance',     get name(){ return t('art_resonance_name'); },     icon:'🎵', rarity:'common',    get desc(){ return t('art_resonance_desc'); },     apply: c => { c.chainDelay = Math.max(10, c.chainDelay - 2 * Math.min(8, runState.artifacts.length)); } },
  { id:'defense_orb',   get name(){ return t('art_defense_orb_name'); },   icon:'🛡️', rarity:'common',    get desc(){ return t('art_defense_orb_desc'); },   apply: c => { c.lowHpShield = true; c.lowHpHealBonus = Math.max(c.lowHpHealBonus, 0.5); } },
  { id:'bomb_seed',     get name(){ return t('art_bomb_seed_name'); },     icon:'💥', rarity:'common',    get desc(){ return t('art_bomb_seed_desc'); },     apply: c => { c.bombThreshold = Math.max(8, c.bombThreshold - 5); } },
  { id:'firework_amp',  get name(){ return t('art_firework_amp_name'); },  icon:'🧨', rarity:'common',    get desc(){ return t('art_firework_amp_desc'); },  apply: c => { c.fireworkThreshold = Math.max(4, c.fireworkThreshold - 4); } },
  { id:'chain_overflow',get name(){ return t('art_chain_overflow_name'); },icon:'💦', rarity:'common',    get desc(){ return t('art_chain_overflow_desc'); },apply: c => { c.chainOverflow = true; } },
  // ─ 희귀 (10종) ─
  { id:'steel_breaker', get name(){ return t('art_steel_breaker_name'); }, icon:'⚔️', rarity:'rare',      get desc(){ return t('art_steel_breaker_desc'); }, apply: c => { c.steelBreaker = true; } },
  { id:'blood_pact',    get name(){ return t('art_blood_pact_name'); },    icon:'🩸', rarity:'rare',      get desc(){ return t('art_blood_pact_desc'); },    apply: c => { c.drainMult *= 1.3; c.hpPerBlock *= 2; } },
  { id:'legend_light',  get name(){ return t('art_legend_light_name'); },  icon:'🌟', rarity:'rare',      get desc(){ return t('art_legend_light_desc'); },  apply: c => { c.legendSpawnRate *= 3; c.legendMatBonus += 2; } },
  { id:'time_crystal',  get name(){ return t('art_time_crystal_name'); },  icon:'⏱️', rarity:'rare',      get desc(){ return t('art_time_crystal_desc'); },  apply: c => { c.hyperStartBonus = (c.hyperStartBonus||0) + 20; c.hyperHealAmt = (c.hyperHealAmt||0) + 30; } },
  { id:'storm_catalyst',get name(){ return t('art_storm_catalyst_name'); },icon:'🎇', rarity:'rare',      get desc(){ return t('art_storm_catalyst_desc'); },apply: c => { c.bombRadius += 2; } },
  { id:'chain_amp',     get name(){ return t('art_chain_amp_name'); },     icon:'💫', rarity:'rare',      get desc(){ return t('art_chain_amp_desc'); },     apply: c => { c.chainHealBonus += 5 * c.maxHp / 100; } },
  { id:'chaos_force',   get name(){ return t('art_chaos_force_name'); },   icon:'🌪️', rarity:'rare',      get desc(){ return t('art_chaos_force_desc'); },   apply: c => { c.hyperHeal = true; } },
  { id:'emperor_seal',  get name(){ return t('art_emperor_seal_name'); },  icon:'👑', rarity:'rare',      get desc(){ return t('art_emperor_seal_desc'); },  apply: c => { c.goldMult *= 1.5; } },
  { id:'magic_orb',     get name(){ return t('art_magic_orb_name'); },     icon:'🔮', rarity:'rare',      get desc(){ return t('art_magic_orb_desc'); },     apply: c => { c.impactRange += 2; c.chainDelay = Math.max(10, c.chainDelay - 15); } },
  { id:'butterfly',     get name(){ return t('art_butterfly_name'); },     icon:'🦋', rarity:'rare',      get desc(){ return t('art_butterfly_desc'); },     apply: c => { c.hyperHealAmt = (c.hyperHealAmt||0) + 35; } },
  // ─ 전설 (4종) ─
  { id:'rainbow_core',  get name(){ return t('art_rainbow_core_name'); },  icon:'🌈', rarity:'legendary', get desc(){ return t('art_rainbow_core_desc'); },
    apply: c => { c.impactRange += 3; c.chainDelay = Math.max(10, c.chainDelay - 20); c.hpPerBlock += 3 * c.maxHp / 100; } },
  { id:'eternal_heart', get name(){ return t('art_eternal_heart_name'); }, icon:'♾️', rarity:'legendary', get desc(){ return t('art_eternal_heart_desc'); },
    apply: c => { c.drainMult *= 0.3; c.maxHp += 50; c.hp = Math.min(c.maxHp, c.hp + 50); } },
  { id:'supernova',     get name(){ return t('art_supernova_name'); },     icon:'💣', rarity:'legendary', get desc(){ return t('art_supernova_desc'); },
    apply: c => { c.supernova = true; c.supernovaTimer = 0; } },
  { id:'conqueror',     get name(){ return t('art_conqueror_name'); },     icon:'🏆', rarity:'legendary', get desc(){ return t('art_conqueror_desc'); },
    apply: c => { c.hpPerBlock *= 1.1; c.impactRange = Math.ceil(c.impactRange * 1.1); c.chainDelay = Math.max(10, Math.floor(c.chainDelay * 0.9)); c.travelMs = Math.max(80, Math.floor(c.travelMs * 0.9)); c.drainMult *= 0.9; c.goldMult *= 2.0; } },
];

// ── 시너지 정의 ──
const SYNERGY_DEFS = [
  { a:'chain_gear',   b:'attract_core',  icons:'⚙️🧲', desc:'연쇄 간격 -5ms, 충격 범위 +1',      apply: c => { c.chainDelay = Math.max(10, c.chainDelay - 5); c.impactRange += 1; } },
  { a:'gold_finger',  b:'emperor_seal',  icons:'💰👑', desc:'골드 배율 ×1.5 추가',              apply: c => { c.goldMult *= 1.5; } },
  { a:'supernova',    b:'storm_catalyst',icons:'💣🎇', desc:'폭탄 반경 +2 추가',                apply: c => { c.bombRadius += 2; } },
  { a:'rainbow_core', b:'eternal_heart', icons:'🌈♾️', desc:'블록 회복 +3, 드레인 ×0.9',        apply: c => { c.hpPerBlock += 3 * c.maxHp / 100; c.drainMult *= 0.9; } },
  { a:'first_aid',    b:'blood_pact',    icons:'🩹🩸', desc:'블록 회복 ×1.5',                  apply: c => { c.hpPerBlock *= 1.5; } },
  { a:'magic_orb',    b:'butterfly',     icons:'🔮🦋', desc:'HYPER 진입 시 HP +15 추가',         apply: c => { c.hyperHealAmt = (c.hyperHealAmt||0) + 15; } },
  { a:'life_sprout',  b:'defense_orb',   icons:'🌿🛡️', desc:'최대 HP +25',                     apply: c => { c.maxHp += 25; c.hp = Math.min(c.maxHp, c.hp + 25); } },
  { a:'glass_cannon', b:'blood_pact',    icons:'🔫🩸', desc:'위험 구간 회복 추가 +100%',        apply: c => { c.lowHpHealBonus += 1.0; } },
];

// ── 소모품 풀 ──
const CONSUMABLE_POOL = [
  { id:'heal_vial',   icon:'❤️‍🔥', name:'치유 물약',   desc:'HP +25% 즉시 회복',
    use: () => { const h = Math.round(char.maxHp * 0.25); char.hp = Math.min(char.maxHp, char.hp + h); popup(AW/2, AH/2-50, '+' + h + ' HP', '#7ec850'); } },
  { id:'time_stop',   icon:'⏸',   name:'시간 정지',   desc:'10초간 HP 드레인 0',
    use: () => { consumeEffects.timeStop = 10000; bigPopup('⏸ TIME STOP!', '#88aaff'); } },
  { id:'gold_rain',   icon:'🪙',   name:'황금비',      desc:'즉시 골드 +150',
    use: () => { sGold += 150; popup(AW/2, AH/2-50, '+150 G', '#f0c040'); } },
  { id:'chain_surge', icon:'⚡',   name:'연쇄 폭발',   desc:'다음 체인 충격 범위 +3',
    use: () => { consumeEffects.chainSurge = 3; bigPopup('⚡ SURGE!', '#f0c040'); } },
  { id:'purge',       icon:'🔥',   name:'정화의 불꽃', desc:'강철/얼음/시한폭탄 즉시 제거',
    use: () => { purgeSpecialBlocks(); bigPopup('🔥 PURGE!', '#ff8844'); } },
  { id:'mega_bomb',   icon:'💥',   name:'메가 폭탄',   desc:'그리드 중앙 5×5 즉시 폭파',
    use: () => { triggerMegaBomb(); bigPopup('💥 MEGA BOMB!', '#ff4444'); } },
];

// ── 보스 이벤트 풀 ──
const BOSS_EVENT_POOL = [
  { type:'devil', icon:'👹', title:'피의 거래',   desc:'다음 노드 최대 HP -30% 대가로 아티팩트 선택 강화',
    choices:[
      { label:'💀 수락 (다음 노드 최대 HP -30%)', sub:'이번 아티팩트 선택에서 희귀/전설 포함',
        fn: () => { runState._devilDeal = true; runState._nextNodeHpMult = 0.7; } },
      { label:'거절', sub:'아무것도 잃지 않음', fn: () => {} },
    ]},
  { type:'devil', icon:'💰', title:'황금의 저주', desc:'보유 골드 200을 바치고 소모품 2개를 얻어라',
    choices:[
      { label:'🪙 수락 (골드 -200)', sub:'소모품 2개 즉시 획득',
        fn: () => { saveGold(Math.max(0, getGold() - 200)); grantConsumableQuiet(); grantConsumableQuiet(); } },
      { label:'거절', sub:'아무것도 잃지 않음', fn: () => {} },
    ]},
  { type:'angel', icon:'😇', title:'천사의 은총', desc:'다음 노드 최대 HP +20% 보너스',
    choices:[
      { label:'✨ 감사히 받기', sub:'다음 노드 최대 HP +20%',
        fn: () => { runState._nextNodeHpMult = (runState._nextNodeHpMult || 1) * 1.2; } },
    ]},
  { type:'angel', icon:'🎁', title:'은혜의 선물', desc:'소모품과 골드를 무료로 받아라',
    choices:[
      { label:'✨ 감사히 받기', sub:'소모품 1개 + 골드 +200 저장',
        fn: () => { grantConsumableQuiet(); saveGold(getGold() + 200); } },
    ]},
];

// ── 도전 과제 정의 ──
const ACHIEVEMENT_DEFS = [
  { id:'first_run',       get name(){ return t('ach_first_run_name'); },        get desc(){ return t('ach_first_run_desc'); },        icon:'🐾', rewardGold:500,   rewardRare:0,  check: s => s.totalRuns >= 1 },
  { id:'act1_clear',      get name(){ return t('ach_act1_clear_name'); },       get desc(){ return t('ach_act1_clear_desc'); },       icon:'🌿', rewardGold:2000,  rewardRare:0,  check: s => s.act1Clears >= 1 },
  { id:'act2_clear',      get name(){ return t('ach_act2_clear_name'); },       get desc(){ return t('ach_act2_clear_desc'); },       icon:'🌋', rewardGold:5000,  rewardRare:0,  check: s => s.act2Clears >= 1 },
  { id:'final_clear',     get name(){ return t('ach_final_clear_name'); },      get desc(){ return t('ach_final_clear_desc'); },      icon:'🏆', rewardGold:15000, rewardRare:20, check: s => s.wins >= 1 },
  { id:'combo_god',       get name(){ return t('ach_combo_god_name'); },        get desc(){ return t('ach_combo_god_desc'); },        icon:'⚡', rewardGold:1000,  rewardRare:0,  check: s => s.maxComboEver >= 50 },
  { id:'legend_hunter',   get name(){ return t('ach_legend_hunter_name'); },    get desc(){ return t('ach_legend_hunter_desc'); },    icon:'⭐', rewardGold:1500,  rewardRare:0,  check: s => s.lifetimeLegendary >= 5 },
  { id:'artifact_fan',    get name(){ return t('ach_artifact_fan_name'); },     get desc(){ return t('ach_artifact_fan_desc'); },     icon:'🎁', rewardGold:3000,  rewardRare:0,  check: s => s.maxArtifactsInRun >= 8 },
  { id:'full_upgrade1',   get name(){ return t('ach_full_upgrade1_name'); },    get desc(){ return t('ach_full_upgrade1_desc'); },    icon:'💎', rewardGold:0,     rewardRare:10, check: () => Object.keys(STATS).some(id => getStatLevel(id) >= STATS[id].tiers.length - 1) },
  { id:'full_upgrade_all',get name(){ return t('ach_full_upgrade_all_name'); }, get desc(){ return t('ach_full_upgrade_all_desc'); }, icon:'🌟', rewardGold:0,     rewardRare:50, check: () => Object.keys(STATS).every(id => getStatLevel(id) >= STATS[id].tiers.length - 1) },
  { id:'block_king',      get name(){ return t('ach_block_king_name'); },       get desc(){ return t('ach_block_king_desc'); },       icon:'💥', rewardGold:1000,  rewardRare:0,  check: s => s.lifetimeBlocks >= 1000 },
  { id:'hyper_reach',     get name(){ return t('ach_hyper_reach_name'); },      get desc(){ return t('ach_hyper_reach_desc'); },      icon:'🔥', rewardGold:500,   rewardRare:0,  check: s => s.hyperReached >= 1 },
  { id:'perfect_node',    get name(){ return t('ach_perfect_node_name'); },     get desc(){ return t('ach_perfect_node_desc'); },     icon:'💯', rewardGold:2000,  rewardRare:5,  check: s => s.perfectNodeClears >= 1 },
  { id:'ten_runs',        get name(){ return t('ach_ten_runs_name'); },         get desc(){ return t('ach_ten_runs_desc'); },         icon:'🔄', rewardGold:5000,  rewardRare:0,  check: s => s.totalRuns >= 10 },
  { id:'five_min',        get name(){ return t('ach_five_min_name'); },         get desc(){ return t('ach_five_min_desc'); },         icon:'⏱️', rewardGold:2000,  rewardRare:0,  check: s => s.maxNodeSec >= 300 },
  { id:'legend_art',      get name(){ return t('ach_legend_art_name'); },       get desc(){ return t('ach_legend_art_desc'); },       icon:'🌈', rewardGold:3000,  rewardRare:10, check: s => s.legendaryArtifactsEver >= 1 },
];

// ── 스탯 정의 ──
const STATS = {
  recovery: { name:'회복력', icon:'💚', desc:'블록 파괴 시 HP 회복량',
    tiers:[
      { value:4.5 },
      { value:4.5,  gold:600,  mat:{ yellow:30 } },
      { value:6.0,  gold:1500, mat:{ yellow:75 } },
      { value:8.0,  gold:3600, mat:{ yellow:150, rare:9 } },
      { value:11.0, gold:9000, mat:{ yellow:300, rare:30 } },
    ]
  },
  impact: { name:'충격파', icon:'💥', desc:'연쇄 충격 범위 (칸)',
    tiers:[
      { value:1 },
      { value:2, gold:900,  mat:{ red:45 } },
      { value:3, gold:2700, mat:{ red:120, rare:15 } },
    ]
  },
  speed: { name:'연쇄 속도', icon:'⚡', desc:'연쇄 간격 ms (낮을수록 빠름)',
    tiers:[
      { value:50 },
      { value:40, gold:750,  mat:{ blue:45 } },
      { value:30, gold:2100, mat:{ blue:105 } },
      { value:22, gold:5400, mat:{ blue:210, rare:24 } },
    ]
  },
  vitality: { name:'생명력', icon:'🛡️', desc:'HP 드레인 저항 (높을수록 좋음)',
    tiers:[
      { value:1.00 },
      { value:0.82, gold:900,  mat:{ green:45 } },
      { value:0.65, gold:2400, mat:{ green:105 } },
      { value:0.50, gold:6000, mat:{ green:210, rare:30 } },
    ]
  },
  movespeed: { name:'이동 속도', icon:'🦶', desc:'블록까지 이동 시간 ms (낮을수록 빠름)',
    tiers:[
      { value:420 },
      { value:340, gold:900,  mat:{ blue:45 } },
      { value:270, gold:2400, mat:{ blue:105 } },
      { value:210, gold:6000, mat:{ blue:210, rare:24 } },
    ]
  },
  maxhp: { name:'최대 체력', icon:'❤️', desc:'최대 HP (회복량도 비례 증가)',
    tiers:[
      { value:120 },
      { value:130, gold:1200, mat:{ green:60 } },
      { value:170, gold:3000, mat:{ green:150, rare:15 } },
      { value:220, gold:7500, mat:{ green:270, rare:45 } },
    ]
  },
};
