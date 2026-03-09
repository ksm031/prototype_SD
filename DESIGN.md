# CHOMP CHAIN — 프로토타입 기획서 v0.1

> **대상 독자**: Claude Code가 모바일 웹 프로토타입을 구현하기 위한 기술 기획서.
> 판단이 필요한 항목은 `[TODO]`로 표기. 구현 우선순위는 **P0 > P1 > P2**.

-----

## 1. 프로젝트 개요

|항목    |내용                                                |
|------|--------------------------------------------------|
|장르    |모바일 웹 퍼즐 (PC 겸용)                                  |
|핵심 행위 |블록을 탭 → 캐릭터가 달려가 먹음 → 체인 연쇄 소멸                    |
|세션 길이 |최대 90초                                            |
|타겟 플랫폼|모바일 브라우저 (iOS Safari / Android Chrome) 우선, PC 호환  |
|기술 스택 |HTML + CSS + JavaScript (단일 파일), Matter.js (물리 엔진)|

-----

## 2. 기술 스택 명세

```
index.html — 단일 파일, 모든 로직 포함
├── Matter.js (CDN) — 블록 낙하/충돌 물리 시뮬레이션
└── 순수 JavaScript — 게임 로직 (체인 그래프, 연쇄 처리)
```

**Matter.js CDN**:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>
```

**캔버스 해상도**: 360×640 기준 (9:16). PC는 중앙 정렬, 최대 높이 100vh.

-----

## 3. 화면 구성 (P0)

### 3-1. 메인 화면

```
┌─────────────────────┐
│    CHOMP CHAIN      │  ← 타이틀
│                     │
│   최고기록: 0        │  ← 로컬스토리지
│   보유 골드: 0 🪙   │
│                     │
│   [ 플레이 ]        │  ← 탭하면 즉시 인게임
│   [ 캐릭터 ]        │  ← P1
└─────────────────────┘
```

### 3-2. 인게임 화면

```
┌─────────────────────┐
│ 🕐 1:30  💀×3  🪙0  │  ← HUD: 타이머 / 체력 / 골드
├─────────────────────┤
│                     │
│  ┌─┬─┬─┬─┬─┐       │
│  │R│R│B│Y│B│       │
│  ├─┼─┼─┼─┼─┤       │
│  │Y│R│B│R│Y│       │  ← 블록 그리드 (5×6)
│  ├─┼─┼─┼─┼─┤       │
│  │B│Y│R│B│R│       │
│  ├─┼─┼─┼─┼─┤       │
│  │R│B│Y│R│B│       │
│  ├─┼─┼─┼─┼─┤       │
│  │Y│R│B│Y│R│       │
│  ├─┼─┼─┼─┼─┤       │
│  │B│Y│R│B│Y│       │
│  └─┴─┴─┴─┴─┘       │
│                     │
│       👾            │  ← 캐릭터 (그리드 아래 대기)
└─────────────────────┘
```

### 3-3. 결과 화면

```
┌─────────────────────┐
│   세션 종료!         │
│   소멸 블록: N개     │
│   최대 연쇄: N콤보   │
│   획득 골드: N 🪙   │
│                     │
│  [ 공유 📹 ]        │  ← P1
│  [ 다시 하기 ]      │
│  [ 메인으로 ]       │
└─────────────────────┘
```

-----

## 4. 블록 그리드 시스템 (P0)

### 4-1. 그리드 기본 스펙

```javascript
const GRID = {
  cols: 5,
  rows: 6,
  cellSize: 56,       // px
  offsetX: 20,        // 캔버스 내 그리드 시작 X
  offsetY: 60,        // 캔버스 내 그리드 시작 Y (HUD 아래)
};

// 블록 색상 종류 (프로토타입 3종)
const COLORS = ['red', 'blue', 'yellow'];
```

### 4-2. 그리드 초기화

```javascript
// 2D 배열로 블록 상태 관리
// null = 빈 칸, { color, chainId, hp } = 블록 존재
let grid = Array(GRID.rows).fill(null).map(() =>
  Array(GRID.cols).fill(null).map(() => ({
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    chainId: null,  // 체인 연결 ID (초기화 시 할당)
    hp: 1           // 강화 블록은 hp > 1 (P1)
  }))
);
```

### 4-3. 체인 그래프 생성

체인은 **같은 색 블록끼리** 연결된 그래프입니다. 인접(상하좌우)한 같은 색 블록은 자동으로 체인 연결됩니다. 연결 컴포넌트(섬) 단위로 chainId를 부여합니다.

```javascript
// BFS로 연결 컴포넌트 탐색 후 chainId 부여
function buildChains(grid) {
  let chainId = 0;
  const visited = Array(GRID.rows).fill(null).map(() => Array(GRID.cols).fill(false));

  for (let r = 0; r < GRID.rows; r++) {
    for (let c = 0; c < GRID.cols; c++) {
      if (!visited[r][c] && grid[r][c]) {
        // BFS
        const queue = [[r, c]];
        const color = grid[r][c].color;
        while (queue.length) {
          const [cr, cc] = queue.shift();
          if (visited[cr][cc]) continue;
          visited[cr][cc] = true;
          grid[cr][cc].chainId = chainId;
          // 상하좌우 탐색
          [[cr-1,cc],[cr+1,cc],[cr,cc-1],[cr,cc+1]].forEach(([nr, nc]) => {
            if (nr >= 0 && nr < GRID.rows && nc >= 0 && nc < GRID.cols
                && !visited[nr][nc] && grid[nr][nc]?.color === color) {
              queue.push([nr, nc]);
            }
          });
        }
        chainId++;
      }
    }
  }
}
```

-----

## 5. 캐릭터 시스템 (P0)

### 5-1. 캐릭터 상태

```javascript
const character = {
  x: 180,           // 현재 X 위치 (px)
  y: 560,           // 현재 Y 위치 (그리드 아래 대기 위치)
  targetCol: null,  // 이동 목표 열
  targetRow: null,  // 이동 목표 행
  state: 'idle',    // 'idle' | 'moving' | 'eating' | 'stunned'
  hp: 3,            // 체력 (잘못된 선택 시 -1)
  speed: 8,         // px/frame 이동 속도
  emoji: '👾',      // 프로토타입은 이모지로 표현
};
```

### 5-2. 캐릭터 이동 로직

```javascript
// 플레이어가 블록 탭 시
function onBlockTap(row, col) {
  if (character.state !== 'idle') return; // 이동 중엔 입력 무시

  character.targetRow = row;
  character.targetCol = col;
  character.state = 'moving';

  // 목표 픽셀 좌표 계산
  character.targetX = GRID.offsetX + col * GRID.cellSize + GRID.cellSize / 2;
  character.targetY = GRID.offsetY + row * GRID.cellSize + GRID.cellSize / 2;
}

// 매 프레임 업데이트
function updateCharacter() {
  if (character.state !== 'moving') return;

  const dx = character.targetX - character.x;
  const dy = character.targetY - character.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < character.speed) {
    // 목표 도달 → 먹기 시작
    character.x = character.targetX;
    character.y = character.targetY;
    character.state = 'eating';
    startEating(character.targetRow, character.targetCol);
  } else {
    character.x += (dx / dist) * character.speed;
    character.y += (dy / dist) * character.speed;
  }
}
```

-----

## 6. 먹기 & 연쇄 시스템 (P0)

### 6-1. 먹기 시작

```javascript
function startEating(row, col) {
  const block = grid[row][col];
  if (!block) {
    // 빈 칸 탭 → 체력 -1, 'stunned' 연출
    character.hp -= 1;
    character.state = 'stunned';
    setTimeout(() => {
      character.state = 'idle';
      returnToBase();
      checkGameOver();
    }, 800);
    return;
  }

  const chainId = block.chainId;
  // 같은 chainId를 가진 모든 블록 수집
  const chainBlocks = getChainBlocks(chainId);

  if (chainBlocks.length === 1) {
    // 연쇄 없음 → 블록 1개만 소멸, 체력 -1
    character.hp -= 1;
    removeBlock(row, col);
    showEffect('lonely', row, col); // 민망한 이펙트
  } else {
    // 연쇄 소멸 시작
    startChainReaction(chainBlocks, row, col);
  }

  character.state = 'eating';
}
```

### 6-2. 연쇄 소멸

체인 블록들이 **먹힌 블록에서 시작해 BFS 순서로 순차 소멸**합니다. 소멸 간격은 150ms로 시각적 연쇄감을 만듭니다.

```javascript
function startChainReaction(chainBlocks, startRow, startCol) {
  // BFS 순서 정렬 (시작점에서 가까운 순)
  const ordered = sortByDistance(chainBlocks, startRow, startCol);
  let comboCount = 0;

  const interval = setInterval(() => {
    if (ordered.length === 0) {
      clearInterval(interval);
      // 연쇄 완료 후 처리
      onChainComplete(comboCount);
      return;
    }

    const { r, c } = ordered.shift();
    removeBlock(r, c);
    comboCount++;
    sessionGold += 10; // 블록 1개 소멸 = 10골드

    // 소멸 블록이 다른 색 블록에 인접하면 충격파
    checkImpactWave(r, c, comboCount);

  }, 150);
}
```

### 6-3. 충격파 (콤보 확장)

```javascript
function checkImpactWave(row, col, comboCount) {
  // 소멸 블록 주변 4칸 검사
  const neighbors = [[row-1,col],[row+1,col],[row,col-1],[row,col+1]];

  neighbors.forEach(([nr, nc]) => {
    if (!inBounds(nr, nc) || !grid[nr][nc]) return;

    const neighbor = grid[nr][nc];
    // 충격파: 인접 블록 hp -1
    neighbor.hp -= 1;
    if (neighbor.hp <= 0) {
      // 충격으로 추가 소멸 → 해당 체인도 연쇄 트리거
      const bonus = getChainBlocks(neighbor.chainId);
      if (bonus.length > 1) {
        // 보너스 연쇄 (딜레이 추가)
        setTimeout(() => startChainReaction(bonus, nr, nc), 300);
      } else {
        removeBlock(nr, nc);
        sessionGold += 10;
      }
    }
  });
}
```

### 6-4. 연쇄 완료 후 처리

```javascript
function onChainComplete(comboCount) {
  // 골드 콤보 보너스
  if (comboCount >= 5) sessionGold += comboCount * 5;

  // 블록 낙하: 빈 칸 위 블록들이 아래로 떨어짐
  applyGravity();

  // 캐릭터 복귀
  returnToBase();
  character.state = 'idle';

  // 게임 오버 체크
  checkGameOver();
}
```

-----

## 7. 블록 낙하 (Gravity) (P0)

소멸 후 위 블록들이 아래로 떨어집니다. Matter.js를 사용하지 않고 **그리드 로직으로 처리**합니다 (물리 연출은 CSS transition으로 표현).

```javascript
function applyGravity() {
  for (let c = 0; c < GRID.cols; c++) {
    // 아래부터 위로 탐색, 빈 칸이면 위 블록을 당겨옴
    let emptyRow = GRID.rows - 1;
    for (let r = GRID.rows - 1; r >= 0; r--) {
      if (grid[r][c]) {
        grid[emptyRow][c] = grid[r][c];
        if (emptyRow !== r) grid[r][c] = null;
        emptyRow--;
      }
    }
    // 남은 빈 칸 채우기 (새 블록 생성)
    for (let r = emptyRow; r >= 0; r--) {
      grid[r][c] = {
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        chainId: null,
        hp: 1
      };
    }
  }
  // 체인 재계산
  buildChains(grid);
}
```

-----

## 8. 병맛 연출 (P0 — 최소 구현)

|상황            |연출 방식                             |
|--------------|----------------------------------|
|연쇄 1개 (고독한 블록)|캐릭터 "…" 말풍선 + 슬픈 효과음 자리           |
|연쇄 5개 이상      |"COMBO!" 텍스트 + 노란 파티클             |
|연쇄 10개 이상     |"CHOMP!!" 텍스트 + 화면 흔들림 (CSS shake)|
|빈 칸 탭         |캐릭터 머리에 별 빙빙 + 체력 -1 표시           |
|체력 0          |캐릭터 폭발 이모지 💥 + 0.5초 슬로우모션         |
|충격파 추가 연쇄     |"BONUS!" 팝업                       |

**슬로우모션 구현**: 게임 오버 시 `requestAnimationFrame` 루프의 deltaTime을 0.2배로 줄임.

-----

## 9. 세션 종료 조건 (P0)

```javascript
function checkGameOver() {
  // 조건 1: 체력 0
  if (character.hp <= 0) {
    triggerGameOver('hp');
    return;
  }
  // 조건 2: 90초 타이머 만료 (별도 타이머로 관리)
  // 조건 3: 그리드 블록 전부 소멸 (완전 클리어 보너스)
  const remaining = grid.flat().filter(b => b !== null).length;
  if (remaining === 0) {
    triggerGameOver('clear'); // 보너스 골드 지급
  }
}

function triggerGameOver(reason) {
  gameState = 'over';
  if (reason === 'clear') sessionGold += 100; // 완전 클리어 보너스
  setTimeout(showResultScreen, 1500);
}
```

-----

## 10. 골드 및 저장 (P0)

```javascript
const STORAGE_KEYS = {
  gold: 'chompchain_gold',
  highscore: 'chompchain_highscore', // 최대 연쇄 수 기준
};

function settle(totalBlocks, maxCombo) {
  const earned = Math.max(10, totalBlocks * 10);
  const current = parseInt(localStorage.getItem(STORAGE_KEYS.gold) || '0');
  localStorage.setItem(STORAGE_KEYS.gold, current + earned);

  const best = parseInt(localStorage.getItem(STORAGE_KEYS.highscore) || '0');
  if (maxCombo > best) localStorage.setItem(STORAGE_KEYS.highscore, maxCombo);

  return earned;
}
```

-----

## 11. 게임 루프 (P0)

```javascript
let lastTime = 0;
let slowFactor = 1.0; // 슬로우모션 시 0.2

function gameLoop(timestamp) {
  const delta = (timestamp - lastTime) * slowFactor;
  lastTime = timestamp;

  if (gameState === 'playing') {
    updateTimer(delta);
    updateCharacter();
    render();
  }

  requestAnimationFrame(gameLoop);
}
```

-----

## 12. 렌더링 (P0 — Canvas 2D)

Matter.js 물리 엔진은 **블록 낙하 연출에만 선택적으로 사용**합니다. 그리드 자체는 Canvas 2D로 직접 그립니다.

```javascript
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 배경
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 그리드 블록 렌더링
  for (let r = 0; r < GRID.rows; r++) {
    for (let c = 0; c < GRID.cols; c++) {
      const block = grid[r][c];
      if (!block) continue;

      const x = GRID.offsetX + c * GRID.cellSize;
      const y = GRID.offsetY + r * GRID.cellSize;

      // 블록 배경
      ctx.fillStyle = BLOCK_COLORS[block.color];
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, GRID.cellSize - 4, GRID.cellSize - 4, 8);
      ctx.fill();

      // 체인 연결 표시 (같은 chainId면 테두리 강조)
      // [TODO] 체인 시각화 방식 결정 필요
    }
  }

  // 캐릭터 렌더링
  ctx.font = '32px serif';
  ctx.fillText(character.emoji, character.x - 16, character.y + 12);

  // HUD
  renderHUD();
}

const BLOCK_COLORS = {
  red: '#e74c3c',
  blue: '#3498db',
  yellow: '#f1c40f',
};
```

-----

## 13. 구현 우선순위

### P0 — 프로토타입 필수

- [ ] 5×6 블록 그리드 생성 + 렌더링
- [ ] BFS 체인 그래프 빌드
- [ ] 블록 탭 → 캐릭터 이동 → 먹기
- [ ] 체인 순차 소멸 (150ms 간격)
- [ ] 충격파 (인접 블록 추가 소멸)
- [ ] 블록 낙하 + 새 블록 생성
- [ ] 체력 시스템 (빈 칸 탭, 고독 블록)
- [ ] 90초 타이머
- [ ] 골드 정산 + 로컬스토리지
- [ ] 병맛 연출 (텍스트 팝업, 화면 흔들림)
- [ ] 메인 → 인게임 → 결과 화면 전환

### P1 — 완성도

- [ ] 슬로우모션 (게임 오버 시)
- [ ] 캐릭터 5종 (핀, 슬라임, 해골, 드래곤, 마법사)
- [ ] 캐릭터 선택 화면
- [ ] 공유하기 (Web Share API + canvas 캡처)
- [ ] 체인 시각화 (같은 체인 테두리 표시)
- [ ] 파티클 이펙트

### P2 — 추후 확장

- [ ] 카드/덱 시스템
- [ ] 캐릭터 강화 (골드 소모)
- [ ] 특수 블록 (hp 2짜리, 잠금 블록 등)
- [ ] 글로벌 랭킹
- [ ] 영상 자동 생성 (MediaRecorder API)

-----

## 14. 파일 구조

```
index.html  ← 단일 파일. CSS, JS 전부 인라인.
```

로컬에서 열거나 GitHub Pages로 바로 배포 가능해야 합니다.

-----

## 15. 미결 사항

|#|항목                             |기본값       |
|-|-------------------------------|----------|
|1|체인 시각화 — 선으로 연결 표시 vs 테두리 강조   |테두리 강조 우선 |
|2|새 블록 생성 위치 — 위에서 떨어짐 vs 즉시 생성  |위에서 떨어짐   |
|3|충격파 범위 — 4방향 vs 8방향            |4방향 (상하좌우)|
|4|고독 블록(연쇄 1개) 패널티 — 체력 -1 vs 경고만|체력 -1     |
|5|그리드 크기 — 5×6 고정 vs 세션마다 랜덤     |5×6 고정    |
