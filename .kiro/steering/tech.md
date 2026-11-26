# Technical Steering — NECRO-BBS 1989

## Stack & Tooling
- **Language**: TypeScript 5.8 (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- **UI**: React 19 + Vite 6 (static production bundle built to `docs/` with `base: './'` for GitHub Pages)
- **Testing**: Vitest 4.1 (`tests/*.test.ts`) running in Node environment
- **Audio**: Procedural Web Audio API (`src/bbs/modemAudio.ts`) with graceful no-op fallback in non-browser/test environments

## Engineering Standards
- Decouple pure BBS state machines (`src/bbs/cryptGame.ts`, `src/bbs/bbsStore.ts`) from React rendering so every dungeon move, combat turn, message post, ZMODEM checksum, and JSON snapshot export/import is 100% unit-testable.
- Persist user-posted EchoNet messages and Crypt Crawler '89 Hall of Fame scores safely in `localStorage` with defensive schema guards.
- Zero runtime console errors, zero external API dependencies, and deterministic fixed-seed dungeon layouts for automated tests.
