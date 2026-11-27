import { describe, expect, it } from 'vitest';
import {
  addHallOfFameScore,
  computeCrc16,
  createBbsSnapshot,
  SEEDED_HOF,
  SEEDED_MESSAGES,
} from '../src/bbs/bbsStore';
import { VAULT_FILES } from '../src/bbs/ansiArt';

/** Returns the display width of a string, counting wide Unicode characters (e.g. emoji) as 2. */
function displayWidth(str: string): number {
  let w = 0;
  for (const ch of str) {
    const cp = ch.codePointAt(0) ?? 0;
    w += cp === 0x2620 || cp >= 0x1f000 ? 2 : 1;
  }
  return w;
}
import {
  createCryptFloor,
  MAX_CRYPT_FLOORS,
  renderCryptAscii,
  stepCrypt,
} from '../src/bbs/cryptGame';

describe('NECRO-BBS 1989 — Resurrection Engine & Door Game Tests', () => {
  it('initializes Crypt Crawler 89 floor cleanly and blocks wall collisions', () => {
    const floor1 = createCryptFloor(1);
    expect(floor1.floor).toBe(1);
    expect(floor1.playerX).toBe(1);
    expect(floor1.playerY).toBe(1);

    // Moving up into top border wall must be blocked without advancing turn
    const blocked = stepCrypt(floor1, 'up');
    expect(blocked.event).toBe('blocked');
    expect(blocked.state.playerX).toBe(1);
    expect(blocked.state.playerY).toBe(1);

    // Moving right onto open floor succeeds and renders '@' at (2,1)
    const moved = stepCrypt(floor1, 'right');
    expect(moved.event).toBe('move');
    expect(moved.state.playerX).toBe(2);
    const lines = renderCryptAscii(moved.state);
    expect(lines[1][2]).toBe('@');
  });

  it('supports relic collection, bump-to-attack combat, stairs descent, and victory escape', () => {
    // Place caller adjacent to relic (*) and stairs (>) on Floor 3 to verify victory flow
    const floor3 = createCryptFloor(MAX_CRYPT_FLOORS);
    const nearRelic = {
      ...floor3,
      playerX: floor3.items[0].x - 1,
      playerY: floor3.items[0].y,
      enemies: [],
    };
    const relicStep = stepCrypt(nearRelic, 'right');
    expect(relicStep.event).toBe('relic');
    expect(relicStep.state.score).toBe(floor3.items[0].value);
    expect(relicStep.state.relicsCollected).toBe(1);

    const nearStairs = {
      ...relicStep.state,
      playerX: floor3.stairsX - 1,
      playerY: floor3.stairsY,
    };
    const winStep = stepCrypt(nearStairs, 'right');
    expect(winStep.event).toBe('victory');
    expect(winStep.state.victory).toBe(true);
    expect(winStep.state.score).toBeGreaterThan(1000);
  });

  it('computes deterministic CRC-16-CCITT checksums for all ZMODEM vault files', () => {
    expect(computeCrc16('123456789')).toBe('29B1'); // Standard CRC-16/CCITT-FALSE test vector
    for (const file of VAULT_FILES) {
      const crc = computeCrc16(file.content);
      expect(crc).toMatch(/^[0-9A-F]{4}$/);
    }
  });

  it('sanitizes Hall of Fame handles and builds valid 2026 JSON BBS snapshots', () => {
    const updated = addHallOfFameScore(SEEDED_HOF, '  necro!#99 ', 4200, 3, 6);
    expect(updated[0].handle).toBe('NECR99'.length ? 'NECRO99' : 'CALLER');
    expect(updated[0].score).toBe(4200);

    const snap = createBbsSnapshot(SEEDED_MESSAGES, updated);
    expect(snap.version).toBe('necro-bbs-1989/v1');
    expect(snap.messages.length).toBe(SEEDED_MESSAGES.length);
    expect(snap.hallOfFame[0].score).toBe(4200);
  });

  it('CRYPT_89.ANS — all box lines have identical display width', () => {
    const cryptFile = VAULT_FILES.find((f) => f.filename === 'CRYPT_89.ANS');
    expect(cryptFile).toBeDefined();
    const lines = cryptFile!.content.split('\n');
    const widths = lines.map(displayWidth);
    const expected = widths[0];
    expect(expected).toBeGreaterThan(0);
    for (let i = 0; i < lines.length; i++) {
      expect(widths[i], `Line ${i} has display width ${widths[i]}, expected ${expected}: |${lines[i]}|`).toBe(expected);
    }
  });
});
