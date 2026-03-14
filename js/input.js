// ═══════════════════════════════════════
//  INPUT — 입력 처리 (탭, 일시정지)
// ═══════════════════════════════════════

function handleTap(cx, cy) {
  if (gstate !== 'playing') return;
  if (char.state !== 'idle' || locked) return;
  if (blocksFalling()) return;

  const rect   = canvas.getBoundingClientRect();
  const scaleX = AW / rect.width;
  const scaleY = AH / rect.height;
  const px = (cx - rect.left) * scaleX - renderOx;
  const py = (cy - rect.top)  * scaleY - renderOy;

  // HUD 소모품 슬롯 탭
  if (py < GY) {
    if (py >= 28 && py <= 42 && runConsumables.length > 0) {
      const slotW = 26, slotGap = 3;
      const totalSlotW = 3 * slotW + 2 * slotGap;
      const slotStartX = AW - 4 - totalSlotW;
      for (let i = 0; i < 3; i++) {
        const sx = slotStartX + i * (slotW + slotGap);
        if (px >= sx && px <= sx + slotW && i < runConsumables.length) {
          useConsumable(i);
          return;
        }
      }
    }
    return;
  }

  const col = Math.floor((px - GX) / CELL);
  const row = Math.floor((py - GY) / CELL);
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;

  // 블록 잠금
  if (blockLockActive && blockLockRect) {
    const { r1, c1, r2, c2 } = blockLockRect;
    if (row >= r1 && row <= r2 && col >= c1 && col <= c2) return;
  }

  // 어둠 구역 reveal
  if (darkZoneRect) {
    const { r1, c1, r2, c2 } = darkZoneRect;
    if (row >= r1 && row <= r2 && col >= c1 && col <= c2) {
      darkRevealCell = { r: row, c: col };
      darkRevealTimer = 800;
    }
  }

  char.tr = row; char.tc = col;
  char.tx = GX + col * CELL + CELL / 2;
  char.ty = GY + row * CELL + CELL / 2;
  const d0 = Math.sqrt((char.tx - char.x) ** 2 + (char.ty - char.y) ** 2);
  char.moveSpd = d0 / char.travelMs * 16.67;
  char.state = 'moving';
  locked = true;
  targetChainId = grid[row][col]?.chainId ?? -1;
}

function togglePause() {
  if (gstate === 'over') return;
  if (gstate === 'playing') {
    gstate = 'paused';
    document.getElementById('pause-btn').textContent = '▶';
  } else if (gstate === 'paused') {
    gstate = 'playing';
    lastTS = 0;
    document.getElementById('pause-btn').textContent = '⏸';
  }
}

canvas.addEventListener('click', e => handleTap(e.clientX, e.clientY));
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  handleTap(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
