# CHOMP CHAIN — Module Reference

> **중요:** 코드를 수정하기 전에 이 파일을 먼저 확인하세요.
> 어떤 함수를 수정했다면 반드시 이 파일도 업데이트하세요.

## 파일 구조

```
index.html          CSS + HTML 구조 + <script> 태그만 포함 (JS 없음)
js/
  config.js         상수·색상·스프라이트·기믹 설정
  locale.js         한/영 번역 시스템
  data.js           게임 데이터 정의 (아티팩트, 노드, 업그레이드 등)
  state.js          전역 상태 변수 + localStorage 헬퍼
  effects.js        시각 효과 (파티클, 팝업, 진동)
  grid.js           그리드 초기화·체인 탐색·블록 제거·중력
  character.js      캐릭터 생성·이동·하이퍼 모드·소모품
  combat.js         전투·체인 실행·피해·게임 종료
  gimmicks.js       기믹 블록 스폰·확산·폭발
  render.js         전체 화면 렌더링 (Canvas 2D)
  loop.js           게임 루프 (requestAnimationFrame)
  input.js          터치/클릭 입력 처리
  screens.js        화면 전환·런 흐름·상점·도전과제
  main.js           앱 크기 조정 + 부팅 진입점
```

---

## 로딩 순서 (의존성)

```
config → locale → data → state → effects → grid → character
       → combat → gimmicks → render → loop → input → screens → main
```

---

## 각 모듈 상세

### `js/config.js`
**역할:** 게임 전반에서 사용하는 상수와 설정값 정의

| 항목 | 내용 |
|------|------|
| 그리드 | `AW=360, AH=520`, `COLS=6, ROWS=7`, `CELL=50px`, `GX, GY` 오프셋 |
| 색상 | `BCOLOR, BDARK, BRIGHT, BGRAY` — 블록 색상 팔레트 맵 |
| 아이콘 | `COLOR_SHAPE, COLOR_ICON` — 색상별 모양/이모지 |
| 스프라이트 | `SPR` — Chompy 아이들/점프 프레임 이미지 사전 로드 |
| 하이퍼 | `isHyper, hyperPulseTimer, hyperPulseActive, hyperPulseRemain` |
| 타이밍 | `CHAIN_MS, FRAME_MS, PULSE_INTERVAL, PULSE_DURATION` |
| 기믹 | `GIMMICK_SPAWN_INTERVALS, GIMMICK_ICONS, GIMMICK_CLRS, GIMMICK_DESCS` |
| 파티클 | `MAX_PARTICLES, MAX_RIPPLES, MAX_POPUPS` |

**함수:**
- `setColors(count)` — 활성 색상 수 변경 (3~5)

---

### `js/locale.js`
**역할:** 한국어/영어 번역 시스템

**함수:**
- `t(id, lang?)` — 번역 문자열 반환. `lang` 생략 시 `_currentLang` 사용

**데이터:** `LOCALE_DATA` — 내장 CSV (~130개 항목, id/ko/en 컬럼)

---

### `js/data.js`
**역할:** 게임 콘텐츠 데이터 테이블 (코드 로직 없음, 순수 데이터)

| 상수 | 내용 |
|------|------|
| `ACT_LABELS` | 3개 ACT 이름 |
| `NODE_DEFS` | ACT×노드별 설정 (제한시간, 드레인율, 색상수, 기믹 목록) |
| `ARTIFACT_POOL` | 30개 아티팩트 정의 (common 16, rare 10, legendary 4) + `apply()` 함수 |
| `SYNERGY_DEFS` | 8개 시너지 쌍 정의 |
| `CONSUMABLE_POOL` | 6개 소모품 정의 |
| `BOSS_EVENT_POOL` | 4개 보스 이벤트 (악마/천사) |
| `ACHIEVEMENT_DEFS` | 15개 도전과제 정의 |
| `STATS` | 6개 업그레이드 스탯 (회복, 충격, 속도, 생명력, 이동속도, 최대HP) |

---

### `js/state.js`
**역할:** 전역 게임 상태 변수 선언 및 localStorage 헬퍼

**주요 상태 변수:**
- `gstate` — 게임 상태 (`'idle'|'playing'|'paused'|'eating'|'over'`)
- `grid` — 6×7 블록 배열
- `char` — 캐릭터 객체 (hp, maxHp, x, y, artifacts, consumables 등)
- `timers` — 활성 타임아웃 배열
- `particles, ripples, popups, flashes` — 이펙트 배열
- `shakeAmt, shakeFr` — 화면 흔들림
- `runActs, runNodeIdx` — 현재 런 진행 상황

**함수:**
- `getGold() / saveGold(v)` — 골드 읽기/저장
- `getHS() / saveHS(v)` — 최고 기록 읽기/저장
- `getMats() / saveMats(m)` — 재료 읽기/저장
- `getStatLevel(id) / saveStatLevel(id, lv)` — 스탯 레벨 읽기/저장
- `getStatValue(id)` — 현재 스탯 수치 반환
- `addMats(gained)` — 재료 증가 + 저장
- `safeTimeout(fn, ms)` — 취소 추적되는 setTimeout

---

### `js/effects.js`
**역할:** 시각/촉각 효과 생성

**함수:**
- `shake(amt, fr)` — 화면 흔들림 발동
- `haptic(ms)` — 진동 (모바일)
- `popup(x, y, text, color, big)` — 화면 위 텍스트 팝업 생성
- `bigPopup(text, color)` — 화면 중앙 대형 팝업
- `burstStar(x, y)` — 별 파티클 1개 방출
- `spawnStarBurst(x, y)` — 별 파티클 다발 방출
- `burstParticles(r, c, color)` — 블록 파괴 파티클 방출

---

### `js/grid.js`
**역할:** 그리드 데이터 구조 관리 — 초기화, 체인 탐색, 블록 삭제, 중력

**함수:**
- `mkBlock(color)` — 블록 객체 생성
- `initGrid()` — 그리드 초기화 (랜덤 블록 배치)
- `buildChains()` — 동색 BFS로 전체 체인 ID 재계산
- `bfs(sr, sc, id, vis)` — 단일 체인 탐색
- `getChain(id)` — 체인 ID에 속한 블록 배열 반환
- `inB(r, c)` — 그리드 범위 체크
- `isProtectedByShield(r, c)` — 방패 보호 여부 확인
- `isPlainBlock(b)` — 특수 블록 여부 확인 (일반 블록만 true)
- `removeBlock(r, c, byExplosion?)` — 블록 제거 + 특수 블록 처리 (폭죽, 폭탄, 아이템 등)
- `gravity()` — 빈 칸으로 블록 낙하 처리
- `updateBlockAnims(dt)` — 블록 낙하 애니메이션 진행
- `blocksFalling()` — 낙하 중인 블록 존재 여부
- `pickRect()` — 그리드 강조 표시용 영역 계산

---

### `js/character.js`
**역할:** 캐릭터(Chompy) 생성, 이동, 아티팩트 적용, 하이퍼 모드, 소모품

**함수:**
- `initChar()` — 스탯 업그레이드 반영해 캐릭터 초기화
- `applyArtifacts()` — 보유 아티팩트 효과 적용
- `applySynergies(c)` — 시너지 조건 확인 후 보너스 적용
- `goBase()` — 캐릭터를 기본 위치로 이동
- `updateChar(dt)` — 매 프레임 이동·스프라이트 업데이트
- `updateHyper()` — HYPER 모드 활성화/비활성화 관리
- `grantConsumableQuiet()` — 팝업 없이 소모품 지급
- `grantConsumable()` — 소모품 지급 + 팝업 표시
- `useConsumable(idx)` — 소모품 슬롯 사용

---

### `js/combat.js`
**역할:** 체인 실행, 데미지, 회복, 특수 블록 트리거, 게임 오버

**함수:**
- `startEat(r, c)` — 탭된 블록의 체인 시작 (애니메이션 + 딜레이)
- `byDist(blocks, sr, sc)` — 블록을 거리순으로 정렬
- `healFromBlock(chainSize)` — 체인 크기 기반 회복량 계산
- `runChain(chainBlocks, sr, sc)` — 실제 체인 파괴 실행 (파도식 팝업)
- `clearCells(cells, color)` — 지정 셀 일괄 제거
- `triggerFirework(r, c)` — 폭죽 블록 폭발 (십자형 제거)
- `triggerBomb(r, c)` — 폭탄 블록 폭발 (반경 2 제거)
- `dropItemBlock(combo)` — 콤보 임계값 달성 시 아이템 블록 드롭
- `finishChain(combo, surgeUsed)` — 체인 종료 처리 (골드, 스탯, 클리어 체크)
- `checkOver()` — HP=0 또는 블록 소진 시 게임 오버 트리거
- `endGame(reason)` — 게임 오버 처리 + 결과 화면 전환
- `purgeSpecialBlocks()` — 타임봄 등 특수 블록 일괄 제거
- `triggerMegaBomb()` — 메가폭탄 아티팩트 발동

---

### `js/gimmicks.js`
**역할:** 기믹 블록 스폰 및 특수 기믹 동작

**함수:**
- `spawnSteel()` — 강철 블록 랜덤 스폰
- `spawnTimebomb()` — 타임봄 블록 스폰 (8초 퓨즈)
- `explodeTimebomb(r, c)` — 타임봄 폭발 (주변 3×3 제거 + HP 피해)
- `spawnGimmickBlock(type)` — 지정 타입 기믹 블록 스폰
  - 지원 타입: `ice, split, mirror, petrified, fog, earthquake, rot, revive`
- `spreadRot()` — 부패 블록을 인접 블록으로 전파
- `triggerEarthquake()` — 지진 (그리드 섞기 + 기믹 전파)

---

### `js/render.js`
**역할:** Canvas 2D를 사용한 전체 화면 렌더링

**함수:**
- `rRect(x, y, w, h, rad)` — 모서리 둥근 사각형 경로 생성
- `render(dt)` — 메인 렌더 함수 (매 프레임 호출)
- `drawHUD()` — HUD 렌더 (HP바, 드레인 표시, 노드 진행, 소모품 슬롯, 아티팩트 스트립)
- `drawGrid()` — 그리드 5패스 렌더 (빈 슬롯 → 브릿지 → 블록 본체 → 타겟 하이라이트 → 기믹 오버레이)
- `drawGimmickOverlay(blk, x, y, radii, now)` — 기믹 블록별 오버레이 렌더
- `drawChar()` — 캐릭터 스프라이트 렌더
- `drawParticles()` — 파티클 렌더
- `drawFlashes()` — 섬광 효과 렌더
- `drawRipples()` — 리플 효과 렌더
- `drawPopups()` — 팝업 텍스트 렌더
- `drawPauseOverlay()` — 일시정지 오버레이 렌더

---

### `js/loop.js`
**역할:** requestAnimationFrame 기반 메인 게임 루프

**함수:**
- `loop(ts)` — 매 프레임 실행
  - 모든 타이머 처리: HYPER 펄스, 강철/타임봄 스폰, HP 드레인, 기믹 타이머
  - `updateChar(dt)`, `updateBlockAnims(dt)`, `render(dt)` 호출

---

### `js/input.js`
**역할:** 사용자 터치/클릭 입력 처리

**함수:**
- `handleTap(cx, cy)` — 탭 좌표 처리
  - 잠금/다크존 확인 → 소모품 슬롯 → 그리드 블록 탭 분기
- `togglePause()` — 일시정지/재개 토글

**이벤트:** `click`, `touchstart` (passive) on `#gc`

---

### `js/screens.js`
**역할:** 화면 전환, 런 흐름 제어, 상점, 도전과제

**함수:**

*화면 전환*
- `showScreen(id)` — 지정 화면 활성화 (canvas/pause-btn 표시 포함)
- `showMain()` — 메인 화면 표시 + 통계 업데이트
- `stopGame()` — 게임 중단 + 타이머 정리

*런 흐름*
- `startRun()` — 새 런 시작 (런 상태 초기화)
- `startNode(act, nodeIdx)` — 특정 노드 설정 (기믹, 드레인, 색상 등)
- `showNodeIntro()` — 노드 소개 화면 표시
- `beginNode()` — 노드 실제 시작 (그리드 초기화 + 루프 시작)
- `nodeCleared()` — 노드 클리어 처리 (보스 이벤트 또는 아티팩트 선택)

*보스 이벤트*
- `showBossEvent(afterFn)` — 보스 이벤트 화면 표시
- `selectBossEventChoice(idx)` — 보스 이벤트 선택지 처리
- `skipBossEvent()` — 보스 이벤트 건너뛰기

*아티팩트*
- `getArtifactChoices(pool)` — 3개 아티팩트 무작위 선택
- `showArtifactChoice()` — 아티팩트 선택 화면 표시
- `selectArtifact(id)` — 아티팩트 선택 + 적용
- `nextNode()` — 다음 노드로 이동 (ACT 완료 시 결과 화면)

*결과*
- `showResult(fromNodeClear)` — 결과 화면 표시 + 골드 애니메이션

*도전과제*
- `checkAchievements()` — 도전과제 달성 체크 + 보상 지급
- `renderAchievements()` — 도전과제 목록 렌더

*상점*
- `canUpgradeStat(id)` — 업그레이드 가능 여부 확인
- `doUpgradeStat(id)` — 스탯 업그레이드 실행
- `shopTab(tab)` — 상점 탭 전환 (강화/도전/꾸미기)
- `renderUpgradeTab()` — 강화 탭 렌더
- `showShop()` — 상점 화면 표시

*초기화*
- `openResetPopup() / closeResetPopup()` — 초기화 팝업 열기/닫기
- `doReset(type)` — 데이터 초기화 (`'progress'` 또는 `'all'`)

---

### `js/main.js`
**역할:** 앱 시작점 — 화면 크기 조정 + 부팅

**함수:**
- `resizeApp()` — `#app` 요소를 뷰포트에 맞게 스케일링

**초기화:** `resizeApp()` 호출 + `resize` 이벤트 등록 + `showMain()` 호출

---

## 기능 수정 가이드

| 수정 내용 | 대상 파일 |
|-----------|-----------|
| 상수/밸런스 수치 변경 | `config.js` |
| 텍스트 번역 추가/수정 | `locale.js` (LOCALE_DATA CSV) |
| 아티팩트/노드/스탯 추가 | `data.js` |
| 새 저장 항목 추가 | `state.js` |
| 시각 효과 수정 | `effects.js`, `render.js` |
| 블록/체인 동작 수정 | `grid.js` |
| 캐릭터 능력치 수정 | `character.js`, `data.js` (STATS) |
| 전투 밸런스 수정 | `combat.js` |
| 기믹 동작 수정 | `gimmicks.js`, `config.js` (타이밍) |
| 렌더링 수정 | `render.js` |
| 게임 루프 타이밍 | `loop.js` |
| 입력 처리 수정 | `input.js` |
| 화면 UI 수정 | `screens.js`, `index.html` |
