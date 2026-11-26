import type { BbsSnapshot, EchoMessage, HallOfFameEntry } from './types';

const MESSAGES_KEY = 'necro_bbs_1989_messages_v1';
const HOF_KEY = 'necro_bbs_1989_hof_v1';

export const SEEDED_MESSAGES: readonly EchoMessage[] = [
  {
    id: 'msg-1989-1',
    board: 'SYSOP.ANN',
    author: 'PHANTOM_SYSOP',
    nodeAddress: '1:1989/1031',
    timestamp: '1989-10-31 00:01',
    subject: 'WELCOME BACK FROM THE GRAVE (2400 BAUD ONLINE)',
    body: 'Carrier restored after 37 years in cold storage. Acoustic modem handshake, FidoNet EchoNet, ZMODEM vault, and CRYPT CRAWLER 89 are live. Press [D] to challenge the dungeon or [M] to post to the temporal echo!',
  },
  {
    id: 'msg-1989-2',
    board: 'FIDONET.89',
    author: 'ZERO_COOL_89',
    nodeAddress: '1:105/42',
    timestamp: '1989-10-31 01:14',
    subject: 'RE: 2400 baud upgrade worth it?',
    body: 'Just traded my 1200 baud coupler for a USR Courier 2400. ANSI screens paint twice as fast now! Only dropped carrier twice when my sister picked up the kitchen phone.',
  },
  {
    id: 'msg-1989-3',
    board: 'CRYPT.LORE',
    author: 'WRAITH_WALKER',
    nodeAddress: '1:1989/666',
    timestamp: '1989-10-31 02:39',
    subject: 'Floor 3 Baud Wraith strategy',
    body: 'Save your Phosphor Elixir (+) until Floor 3! Two Baud Wraiths guard the central chamber. Grab both Cursed Relics (*) before diving into the final stairs (>) for a 2,500+ Hall of Fame run.',
  },
  {
    id: 'msg-2026-4',
    board: 'MODERN.2026',
    author: 'KIRO_RESURRECTOR',
    nodeAddress: '2026:WEB/443',
    timestamp: '2026-11-26 20:45',
    subject: 'Bridging 1989 ANSI BBS to 2026 JSON Snapshots',
    body: 'Resurrected this entire BBS stack with Kiro CLI v3.6.2 spec-driven architecture! Visit [S] SysOp Diagnostics to export every EchoNet thread and Door Game score as clean 2026 JSON.',
  },
];

export const SEEDED_HOF: readonly HallOfFameEntry[] = [
  { id: 'hof-1', handle: 'PHANTOM', score: 3420, floor: 3, relics: 6, date: '1989-10-31' },
  { id: 'hof-2', handle: 'MODEM89', score: 2180, floor: 3, relics: 4, date: '1989-10-31' },
  { id: 'hof-3', handle: 'KIRO_V3', score: 1640, floor: 2, relics: 3, date: '2026-11-26' },
];

export function loadMessages(): EchoMessage[] {
  if (typeof window === 'undefined') return [...SEEDED_MESSAGES];
  try {
    const raw = window.localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [...SEEDED_MESSAGES];
    const parsed = JSON.parse(raw) as EchoMessage[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEEDED_MESSAGES];
  } catch {
    return [...SEEDED_MESSAGES];
  }
}

export function saveMessages(messages: readonly EchoMessage[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function loadHallOfFame(): HallOfFameEntry[] {
  if (typeof window === 'undefined') return [...SEEDED_HOF];
  try {
    const raw = window.localStorage.getItem(HOF_KEY);
    if (!raw) return [...SEEDED_HOF];
    const parsed = JSON.parse(raw) as HallOfFameEntry[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEEDED_HOF];
  } catch {
    return [...SEEDED_HOF];
  }
}

export function saveHallOfFame(entries: readonly HallOfFameEntry[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(HOF_KEY, JSON.stringify(entries));
}

export function addHallOfFameScore(
  current: readonly HallOfFameEntry[],
  handle: string,
  score: number,
  floor: number,
  relics: number
): HallOfFameEntry[] {
  const cleanHandle = handle.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10) || 'CALLER';
  const entry: HallOfFameEntry = {
    id: `hof-${Date.now()}`,
    handle: cleanHandle,
    score,
    floor,
    relics,
    date: new Date().toISOString().slice(0, 10),
  };
  return [...current, entry].sort((a, b) => b.score - a.score).slice(0, 8);
}

// Authentic CRC-16-CCITT checksum used in XMODEM/ZMODEM file transfers
export function computeCrc16(content: string): string {
  let crc = 0xffff;
  for (let i = 0; i < content.length; i++) {
    crc ^= content.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function createBbsSnapshot(
  messages: readonly EchoMessage[],
  hallOfFame: readonly HallOfFameEntry[]
): BbsSnapshot {
  return {
    version: 'necro-bbs-1989/v1',
    exportedAt: new Date().toISOString(),
    nodeName: 'NECRO-BBS 1989 (Node 1:1989/1031)',
    messages: [...messages],
    hallOfFame: [...hallOfFame],
  };
}
