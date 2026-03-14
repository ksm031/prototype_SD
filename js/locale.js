// ═══════════════════════════════════════
//  LOCALE — 다국어 시스템
// ═══════════════════════════════════════
const LOCALE_DATA = `id,ko,en
title_main,CHOMP CHAIN,CHOMP CHAIN
subtitle_main,블록을 탭해 캐릭터를 먹여라!,Tap blocks to feed your character!
btn_play,🎮 플레이,🎮 Play
btn_enhance,⚗️ 강화,⚗️ Enhance
btn_back,← 돌아가기,← Back
btn_reset_save,🗑️ 저장 초기화,🗑️ Reset Save
btn_new_run,🔄 새 런 시작,🔄 New Run
btn_to_main,🏠 메인으로,🏠 To Main
btn_cancel,취소,Cancel
btn_upgrade,업그레이드,Upgrade
btn_max,✅ MAX,✅ MAX
shop_title,강화,Enhance
shop_tab_upgrade,강화,Upgrade
shop_tab_challenges,도전,Challenges
shop_tab_deco,꾸미기,Cosmetics
shop_deco_locked,Lv.4 달성 시 꾸미기 해금됩니다,Unlock cosmetics at Level 4
popup_reset_title,🗑️ 초기화,🗑️ Reset
popup_reset_desc,삭제할 데이터를 선택해주세요,Select data to delete
btn_reset_progress,💰 강화 초기화,💰 Reset Upgrades
btn_reset_all,💀 전체 초기화,💀 Reset All
stat_longest_survival,⏳ 최장 생존,⏳ Best Survival
stat_gold,💰 보유 골드,💰 Gold
stat_materials,🧪 재료,🧪 Materials
result_title_clear,🏆 런 클리어!,🏆 Run Clear!
result_title_end,세션 종료!,Session Over!
result_node_reached,📍 도달 노드,📍 Node Reached
result_survival_time,⏳ 생존 시간,⏳ Survival Time
result_blocks_destroyed,💥 소멸 블록,💥 Blocks Destroyed
result_max_combo,⚡ 최대 연쇄,⚡ Max Combo
result_artifacts_collected,🎁 수집 아티팩트,🎁 Artifacts Collected
result_gold_earned,💰 획득 골드,💰 Gold Earned
result_best_time,🏆 최장 생존,🏆 Best Time
result_materials_earned,🧪 획득 재료,🧪 Materials Earned
result_achievements,🏅 도전 과제 달성!,🏅 Achievements Unlocked!
artifact_screen_title,🎁 아티팩트 선택,🎁 Artifact Selection
artifact_screen_subtitle,런 종료까지 유지됩니다,Lasts until end of run
artifact_node_clear,노드 클리어!,Node Clear!
upgrade_lack_gold,골드 부족,Insufficient Gold
upgrade_max_reached,MAX,MAX
act_label_1,ACT 1 — 초원 🌿,ACT 1 — Grasslands 🌿
act_label_2,ACT 2 — 화산 🌋,ACT 2 — Volcano 🌋
act_label_3,ACT 3 — 혼돈 🌀,ACT 3 — Chaos 🌀
popup_hunger,🍽️ HUNGER!,🍽️ HUNGER!
popup_overflow,💦 OVERFLOW,💦 OVERFLOW
popup_bang,🧨 BANG!,🧨 BANG!
popup_boom,💣 BOOM!!,💣 BOOM!!
popup_perfect,PERFECT!!,PERFECT!!
popup_game_over,GAME OVER,GAME OVER
popup_clear,🏆 CLEAR!!,🏆 CLEAR!!
popup_full_heal,♾️ FULL HEAL!,♾️ FULL HEAL!
art_first_aid_name,응급 키트,First Aid Kit
art_first_aid_desc,블록당 HP 회복 +1.5,HP recovery +1.5 per block
art_attract_core_name,인력 코어,Attract Core
art_attract_core_desc,연쇄 충격 범위 +1,Impact range +1
art_chain_gear_name,연쇄 기어,Chain Gear
art_chain_gear_desc,연쇄 간격 -10ms,Chain speed -10ms
art_sprint_boots_name,질주의 신발,Sprint Boots
art_sprint_boots_desc,이동 시간 -50ms,Movement time -50ms
art_gold_finger_name,황금 손가락,Golden Finger
art_gold_finger_desc,블록당 골드 +3,Gold +3 per block
art_vitality_src_name,활력의 근원,Vitality Source
art_vitality_src_desc,최대 HP +20,Max HP +20
art_life_sprout_name,생명의 새싹,Life Sprout
art_life_sprout_desc,HP 드레인 -8%,HP drain -8%
art_crystal_shard_name,결정 파편,Crystal Shard
art_crystal_shard_desc,전설 블록 출현율 +0.15%\\, 전설 파괴 시 HP +10%,Legendary spawn +0.15%\\, heal +10% on destroy
art_glass_cannon_name,유리 대포,Glass Cannon
art_glass_cannon_desc,최대 HP -30\\, 골드/블록 +8\\, 충격 범위 +1,Max HP -30\\, Gold +8/block\\, Range +1
art_aim_lens_name,조준 렌즈,Aim Lens
art_aim_lens_desc,콤보 5+ 시 추가 골드 +10,Extra gold +10 at 5+ combo
art_hunger_name,연쇄 배고픔,Chain Hunger
art_hunger_desc,누적 20콤보마다 충격 범위 +1 (영구),Range +1 per 20 cumulative combo (permanent)
art_resonance_name,공명,Resonance
art_resonance_desc,보유 아티팩트 수×2ms씩 연쇄 간격 감소 (최대 -16ms),Chain speed -2ms per artifact owned (max -16ms)
art_defense_orb_name,방어의 오브,Defense Orb
art_defense_orb_desc,HP < 30% 시 드레인 -30% + 블록 회복 +50%,Drain -30% and heal +50% when HP < 30%
art_bomb_seed_name,폭발 씨앗,Bomb Seed
art_bomb_seed_desc,폭탄 발동 조건 -5콤보,Bomb threshold -5 combo
art_firework_amp_name,불꽃 증폭기,Firework Amplifier
art_firework_amp_desc,불꽃 발동 조건 -4콤보,Firework threshold -4 combo
art_chain_overflow_name,연쇄 범람,Chain Overflow
art_chain_overflow_desc,10콤보 이상 시 충격 범위 밖 블록 1개 추가 파괴,Destroy 1 extra block outside range at 10+ combo
art_steel_breaker_name,강철 분쇄기,Steel Breaker
art_steel_breaker_desc,강철 블록을 일반처럼 파괴,Destroy steel blocks normally
art_blood_pact_name,혈액 계약,Blood Pact
art_blood_pact_desc,드레인 +30%\\, 블록 회복 ×2,Drain +30%\\, heal ×2
art_legend_light_name,전설의 빛,Legend Light
art_legend_light_desc,전설 출현율 ×3\\, 재료 +2,Legendary spawn ×3\\, materials +2
art_time_crystal_name,시간 결정체,Time Crystal
art_time_crystal_desc,각 페이즈 +20초\\, 페이즈 전환 시 HP +30 추가 회복,Phase +20s\\, heal +30 on phase change
art_storm_catalyst_name,폭풍 촉매,Storm Catalyst
art_storm_catalyst_desc,폭탄 반경 +2 (5×5→9×9),Bomb radius +2 (5×5→9×9)
art_chain_amp_name,연쇄 증폭기,Chain Amplifier
art_chain_amp_desc,체인 5개마다 HP +5% 추가 회복 (충격 범위 비례),Heal +5% per 5 chain (scales with impact range)
art_chaos_force_name,혼돈의 힘,Chaos Force
art_chaos_force_desc,HYPER 진입 시 HP 전체 회복,Full HP heal on HYPER entry
art_emperor_seal_name,황제의 인장,Emperor's Seal
art_emperor_seal_desc,골드 획득 ×1.5,Gold ×1.5
art_magic_orb_name,마력 수정구,Magic Orb
art_magic_orb_desc,충격 범위 +2\\, 연쇄 간격 -15ms,Range +2\\, chain speed -15ms
art_butterfly_name,변화의 날개,Wings of Change
art_butterfly_desc,페이즈 전환마다 HP +35 회복,Heal +35 on each phase change
art_rainbow_core_name,무지개 코어,Rainbow Core
art_rainbow_core_desc,충격 범위 +3\\, 연쇄 간격 -20ms\\, 회복 +3,Range +3\\, chain -20ms\\, heal +3
art_eternal_heart_name,영원의 심장,Eternal Heart
art_eternal_heart_desc,드레인 ×0.3\\, 최대 HP +50,Drain ×0.3\\, max HP +50
art_supernova_name,초신성,Supernova
art_supernova_desc,15초마다 자동 폭탄 발동,Auto bomb every 15s
art_conqueror_name,정복자의 왕관,Conqueror's Crown
art_conqueror_desc,모든 수치 10% 향상\\, 골드 ×2,All stats +10%\\, gold ×2
ach_first_run_name,첫 발걸음,First Steps
ach_first_run_desc,런 1번 시작,Start 1 run
ach_act1_clear_name,탐험가,Explorer
ach_act1_clear_desc,ACT 1 클리어 (1-BOSS 생존),Clear ACT 1
ach_act2_clear_name,도전자,Challenger
ach_act2_clear_desc,ACT 2 클리어 (2-BOSS 생존),Clear ACT 2
ach_final_clear_name,정복자,Conqueror
ach_final_clear_desc,FINAL BOSS 클리어,Beat FINAL BOSS
ach_combo_god_name,연쇄의 신,Combo God
ach_combo_god_desc,50콤보 달성,Reach 50 combo
ach_legend_hunter_name,전설 수집가,Legend Hunter
ach_legend_hunter_desc,전설 블록 5개 획득,Collect 5 legendary blocks
ach_artifact_fan_name,아티팩트 덕후,Artifact Enthusiast
ach_artifact_fan_desc,1런에 아티팩트 8개 수집,Collect 8 artifacts in 1 run
ach_full_upgrade1_name,완전 강화,Full Upgrade
ach_full_upgrade1_desc,스탯 1개 풀강화,Max out 1 stat
ach_full_upgrade_all_name,모두 강화,Fully Upgraded
ach_full_upgrade_all_desc,전 스탯 풀강화,Max out all stats
ach_block_king_name,블록 파괴왕,Block King
ach_block_king_desc,누적 블록 1000개 파괴,Destroy 1000 blocks total
ach_hyper_reach_name,HYPER 도달,HYPER Reached
ach_hyper_reach_desc,HYPER 단계 진입,Enter HYPER phase
ach_perfect_node_name,완벽한 생존,Perfect Survival
ach_perfect_node_desc,HP 100 유지로 노드 클리어,Clear node with 100+ HP
ach_ten_runs_name,반복의 힘,Repeater
ach_ten_runs_desc,10런 플레이,Play 10 runs
ach_five_min_name,5분 생존,5 Minute Survivor
ach_five_min_desc,단일 노드에서 5분 생존,Survive 5 min in single node
ach_legend_art_name,최강 빌드,Ultimate Build
ach_legend_art_desc,전설 아티팩트 보유,Own a legendary artifact`;

let _currentLang = 'ko';
const _locale = (() => {
  const map = {};
  const lines = LOCALE_DATA.trim().split('\n');
  const headers = lines[0].split(',');
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].replace(/\\,/g, '\u0000').split(',');
    const id = cols[0];
    map[id] = {};
    for (let j = 1; j < headers.length; j++) {
      map[id][headers[j]] = (cols[j] || '').replace(/\u0000/g, ',');
    }
  }
  return map;
})();

function t(id, lang) {
  const entry = _locale[id];
  if (!entry) return id;
  return entry[lang || _currentLang] || entry['ko'] || id;
}
