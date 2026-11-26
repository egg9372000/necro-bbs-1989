# ☠️ NECRO-BBS 1989 — Resurrected Dial-Up ANSI Terminal & Crypt Crawler

> **Built for AWS Kiroween 2026 (Category: Resurrection)**  
> Bringing the 1989 dial-up ANSI Bulletin Board System back from the digital graveyard—complete with procedural Web Audio DTMF/V.22bis modem handshakes, haunted phosphor CRT themes, persistent FidoNet EchoNet threads, ZMODEM-8K CRC-16 file transfers, a playable 3-floor ASCII Roguelike Door Game (`CRYPT CRAWLER '89`), and a 2026 JSON Snapshot Bridge.

- **Live Playable Terminal (GitHub Pages)**: `https://egg9372000.github.io/necro-bbs-1989/`
- **License**: MIT

---

## 🕯️ Resurrected 1989 Tech Meets 2026 Innovations

1. **Procedural Acoustic Modem Synthesizer (`src/bbs/modemAudio.ts`)**: Real Web Audio API synthesis of DTMF touch-tone dialing (`555-1989`), 2100 Hz CED answer tone, and V.22bis carrier training chirps—zero MP3 files required.
2. **Haunted Phosphor CRT Monitor**: Instant toggle between **Phosphor Green P1**, **Amber P3**, and **Spectral Violet** CRT palettes, scanline overlay, hardware modem LED array (`OH`, `CD`, `TX`, `RX`), and selectable baud streaming (`2400 BPS`, `9600 BPS`, `2026 FIBER`).
3. **`[M]` FidoNet EchoNet**: Browse retro SysOp threads and transmit persistent new packets saved to `localStorage`.
4. **`[D]` CRYPT CRAWLER '89 (Door Game)**: Playable 3-floor turn-based ASCII dungeon crawler with bump-to-attack phantom combat, cursed relics, phosphor elixirs, stairs descent, dual `WASD`/Arrow + clickable D-Pad controls, and a persistent BBS Hall of Fame.
5. **`[F]` ZMODEM-8K File Vault**: Inspect `.NFO`, `.ANS`, and `.DOC` retro files verified with authentic **CRC-16-CCITT** checksums (`0x29B1` standard test vector verified!) and browser download support.
6. **`[S]` SysOp Diagnostics & 2026 JSON Bridge**: Exports the live 1989 BBS state (EchoNet + Hall of Fame) into structured 2026 JSON.

---

## ⚡ Kiro Spec-Driven Architecture (`/.kiro/`)

This repository includes full Kiro CLI v3.6.2 configuration at the repo root:
- `.kiro/steering/`: `product.md`, `tech.md`, `structure.md`
- `.kiro/specs/necro-bbs-resurrection/`: `requirements.md`, `design.md`, `tasks.md`
- `.kiro/hooks/typecheck-and-test.json`: automated TypeScript & Vitest verification hook

---

## 🛠️ Local Development & Automated Tests

```bash
npm install
npm run typecheck   # Strict TypeScript check
npm test            # Vitest suite (Crypt Crawler engine, CRC-16-CCITT, EchoNet & JSON Bridge)
npm run build       # Production static bundle (docs/) for GitHub Pages
npm run dev         # Local dev server (http://localhost:5179)
```
