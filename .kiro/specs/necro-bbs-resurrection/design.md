# Architecture Design — NECRO-BBS 1989

## State Machine & Module Boundaries
1. **Terminal Shell (`src/App.tsx`)**:
   - Manages top-level BBS view (`handshake` | `menu` | `echonet` | `door` | `files` | `sysop`), CRT theme (`green` | `amber` | `violet`), baud rate (`2400` | `9600` | `fiber`), scanlines, mute state, and global single-key hotkey dispatch (disabled while typing inside form inputs).
2. **Acoustic Modem Synthesizer (`src/bbs/modemAudio.ts`)**:
   - Uses Web Audio `OscillatorNode` + `GainNode` + white-noise `AudioBufferSourceNode` to synthesize authentic dual-tone DTMF dialing frequencies (`697/770/852/941 Hz` × `1209/1336/1477 Hz`), 2100 Hz answer tone, and V.22bis FSK carrier chirp—plus retro terminal beeps and dungeon combat chimes.
3. **Crypt Crawler '89 Engine (`src/bbs/cryptGame.ts`)**:
   - Immutable-friendly deterministic 19×11 ASCII dungeon grid (`#` wall, `.` floor, `@` caller, `G` phantom, `W` wraith, `*` cursed relic, `+` elixir, `>` stairs down).
   - Pure `stepDungeon(state, dir)` function handles bump-to-attack combat, enemy pursuit AI, HP/score updates, combat log lines, and floor transitions.
4. **BBS Persistent Store & 2026 JSON Bridge (`src/bbs/bbsStore.ts`)**:
   - Hydrates and saves EchoNet posts and Door Game Hall of Fame records via `localStorage`.
   - Provides deterministic CRC-16 (`computeCrc16`) for ZMODEM file integrity verification and JSON snapshot export/validation.
