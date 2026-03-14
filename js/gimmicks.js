// ═══════════════════════════════════════
//  GIMMICKS — 기믹 블록, 강철, 시한폭탄, 지진, 부패
// ═══════════════════════════════════════

function spawnSteel() {
  const candidates = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < COLS; c++)
      if (isPlainBlock(grid[r][c])) candidates.push({ r, c });
  if (!candidates.length) return;

  const { r, c } = candidates[Math.floor(Math.random() * candidates.length)];
  grid[r][c] = { color: 'steel', steel: true, chainId: -1, hp: 1, animY: grid[r][c].animY, fallV: 0 };
  buildChains();
  shake(4, 6);
  popup(GX + c * CELL + CELL / 2, GY + r * CELL - 8, '⚙️', '#aab4c2', true);
}

function spawnTimebomb() {
  let count = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c]?.timebomb) count++;
  if (count >= 2) return;

  const candidates = [];
  for (let r = 1; r < ROWS - 1; r++)
    for (let c = 0; c < COLS; c++)
      if (isPlainBlock(grid[r][c])) candidates.push({ r, c });
  if (!candidates.length) return;

  const { r, c } = candidates[Math.floor(Math.random() * candidates.length)];
  const color = grid[r][c].color;
  grid[r][c] = { color, timebomb: true, timer: TIMEBOMB_FUSE, chainId: grid[r][c].chainId, hp: 1, animY: grid[r][c].animY, fallV: 0 };
  buildChains();
  shake(3, 5);
  popup(GX + c * CELL + CELL / 2, GY + r * CELL - 8, '💣', '#ff4444', true);
}

function explodeTimebomb(r, c) {
  if (!grid[r][c]) return;
  burstParticles(r, c, '#ff2200');
  grid[r][c] = null;
  const dmg = 15;
  char.hp = Math.max(0, char.hp - dmg);
  shake(10, 12);
  popup(GX + c * CELL + CELL / 2, GY + r * CELL - 8, `-${dmg}💥`, '#ff2200', true);
  ripples.push({ x: GX + c * CELL + CELL / 2, y: GY + r * CELL + CELL / 2, rad: CELL * 3, life: 0.8 });
  flashes.push({ x: GX + c * CELL - CELL, y: GY + r * CELL - CELL, w: CELL * 3, h: CELL * 3, color: '#ff220055', life: 0.4 });
  buildChains();
  if (char.hp <= 0) endGame('hp');
}

function spawnGimmickBlock(type) {
  const candidates = [];
  for (let r = 1; r < ROWS - 1; r++)
    for (let c = 0; c < COLS; c++) {
      const b = grid[r][c];
      if (isPlainBlock(b)) candidates.push({ r, c });
    }
  if (!candidates.length) return;
  const { r, c } = candidates[Math.floor(Math.random() * candidates.length)];
  const prev = grid[r][c];
  const origColor = prev.color;

  const newBlk = {
    color:     type === 'rot' ? 'rot' : type === 'shield' ? 'shield' : origColor,
    origColor: origColor,
    [type]:    true,
    chainId:   -1,
    hp:        type === 'petrified' ? 2 : 1,
    animY:     prev.animY,
    fallV:     0,
  };
  if (type === 'rot') newBlk.rotTimer = ROT_SPREAD_INTERVAL;

  grid[r][c] = newBlk;
  buildChains();
  popup(GX + c * CELL + CELL / 2, GY + r * CELL - 8, GIMMICK_ICONS[type], GIMMICK_CLRS[type], true);
}

function spreadRot() {
  const rotCells = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c]?.rot) rotCells.push({ r, c });

  for (const { r, c } of rotCells) {
    const neighbors = [[-1,0],[1,0],[0,-1],[0,1]].map(([dr,dc])=>[r+dr,c+dc])
      .filter(([nr,nc]) => inB(nr,nc) && grid[nr][nc] && !grid[nr][nc].steel &&
              !grid[nr][nc].rot && !grid[nr][nc].ice && !grid[nr][nc].item &&
              !grid[nr][nc].shield && grid[nr][nc].color !== 'legendary');
    if (!neighbors.length) continue;
    const [nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
    const prev = grid[nr][nc];
    grid[nr][nc] = { color: 'rot', origColor: prev.color, rot: true, chainId: -1,
                     hp: 1, rotTimer: ROT_SPREAD_INTERVAL, animY: prev.animY, fallV: 0 };
    popup(GX + nc * CELL + CELL / 2, GY + nr * CELL - 4, '🦠', '#44bb44');
  }
  buildChains();
}

function triggerEarthquake() {
  if (locked || char.state !== 'idle' || blocksFalling()) {
    earthquakePending = true;
    return;
  }
  earthquakePending = false;
  shake(14, 28);
  bigPopup('🌋 QUAKE!', '#ff8844');
  haptic([30, 10, 50, 10, 30]);
  const movable = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const b = grid[r][c];
      if (b && !b.steel && !b.item && !b.timebomb) movable.push({ r, c, blk: b });
    }
  const positions = movable.map(m => ({ r: m.r, c: m.c }));
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  for (let i = 0; i < movable.length; i++) {
    const { r, c } = positions[i];
    grid[r][c] = movable[i].blk;
    grid[r][c].animY = GY + movable[i].r * CELL;
    grid[r][c].fallV = 0;
  }
  buildChains();
}
