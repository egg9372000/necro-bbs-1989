export type CrtTheme = 'green' | 'amber' | 'violet';
export type BaudMode = '2400' | '9600' | 'fiber';
export type BbsView = 'handshake' | 'menu' | 'echonet' | 'door' | 'files' | 'sysop';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface EchoMessage {
  id: string;
  board: 'SYSOP.ANN' | 'FIDONET.89' | 'CRYPT.LORE' | 'MODERN.2026';
  author: string;
  nodeAddress: string;
  timestamp: string;
  subject: string;
  body: string;
}

export interface VaultFile {
  id: string;
  filename: string;
  category: 'ANSI ART' | 'DOOR DOCS' | 'SYSOP NFO';
  year: string;
  description: string;
  content: string;
}

export interface CryptEnemy {
  id: string;
  kind: 'GHOST' | 'WRAITH';
  symbol: 'G' | 'W';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
}

export interface CryptItem {
  id: string;
  kind: 'RELIC' | 'ELIXIR';
  symbol: '*' | '+';
  x: number;
  y: number;
  value: number;
}

export interface CryptState {
  floor: number;
  turn: number;
  width: number;
  height: number;
  walls: string[];
  playerX: number;
  playerY: number;
  hp: number;
  maxHp: number;
  atk: number;
  score: number;
  relicsCollected: number;
  ghostsBanished: number;
  stairsX: number;
  stairsY: number;
  enemies: CryptEnemy[];
  items: CryptItem[];
  log: string[];
  gameOver: boolean;
  victory: boolean;
}

export interface HallOfFameEntry {
  id: string;
  handle: string;
  score: number;
  floor: number;
  relics: number;
  date: string;
}

export interface BbsSnapshot {
  version: 'necro-bbs-1989/v1';
  exportedAt: string;
  nodeName: string;
  messages: EchoMessage[];
  hallOfFame: HallOfFameEntry[];
}
