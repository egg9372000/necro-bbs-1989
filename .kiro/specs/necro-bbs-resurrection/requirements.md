# Requirements — NECRO-BBS 1989 Resurrection

## REQ-1: Dial-Up Acoustic Modem Handshake & Baud Streaming
- **User Story**: As a retro computing enthusiast, I want to dial into NECRO-BBS 1989 (`ATDT 555-1989`), hear a procedural Web Audio DTMF + carrier handshake, watch modem LEDs (`OH`, `CD`, `TX`, `RX`) blink, and toggle between authentic `2400 bps` / `9600 bps` streaming and instant `2026 FIBER` mode.
- **Acceptance Criteria**:
  1. Handshake transitions cleanly through `DIALING` → `NEGOTIATING` → `CARRIER DETECT (2400/9600/FIBER)` → `CONNECTED`.
  2. Audio mute toggle works at any time without throwing Web Audio errors.

## REQ-2: Haunted CRT Phosphor Emulation
- **User Story**: As a Kiroween judge, I want to switch between `Phosphor Green P1`, `Amber P3`, and `Spectral Violet` CRT themes and toggle CRT scanlines without losing legibility.
- **Acceptance Criteria**:
  1. All 3 themes maintain crisp high-contrast monospace readability.
  2. Scanline overlay can be toggled on/off cleanly.

## REQ-3: Message EchoNet (FidoNet 1989 → 2026)
- **User Story**: As a BBS caller, I want to browse haunted retro SysOp threads, compose new messages with my caller handle, and have them persist across page reloads.
- **Acceptance Criteria**:
  1. At least 4 seeded 1989-meets-2026 SysOp/caller posts load on first boot.
  2. Submitting a new post appends it immediately with timestamp, handle, and echo node ID, and persists to `localStorage`.

## REQ-4: Playable Door Game — CRYPT CRAWLER '89
- **User Story**: As a caller, I want to launch a classic ASCII roguelike Door Game right inside the BBS terminal using `WASD`/arrows or clickable directional controls, collect cursed relics, battle phantoms, descend floors, and post my score to the BBS Hall of Fame.
- **Acceptance Criteria**:
  1. Pure deterministic engine (`createDungeon`, `stepDungeon`) supports movement, wall collision, phantom combat, potion healing, relic scoring, stairs descent, and game-over state.
  2. Completing or ending a run lets the caller post their score + handle to the persistent BBS Hall of Fame.

## REQ-5: ZMODEM Haunted File Vault & Modern 2026 JSON Bridge
- **User Story**: As a modern developer, I want to inspect/download retro `.ANS`/`.NFO` files via simulated ZMODEM transfers and export/import the live BBS state as structured JSON.
- **Acceptance Criteria**:
  1. ZMODEM download displays block count, CRC-16 verification, progress bar, and actual browser file download.
  2. SysOp Diagnostic panel displays live baud telemetry and exports valid JSON snapshots of all messages & high scores.
