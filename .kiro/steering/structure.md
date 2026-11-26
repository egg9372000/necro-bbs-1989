# Project Structure — NECRO-BBS 1989

```text
necro-bbs/
├── .kiro/
│   ├── steering/         # Product, technical, and structural steering docs
│   ├── specs/            # Spec-driven requirements, architecture design, and task list
│   └── hooks/            # Automated Kiro quality verification hooks
├── src/
│   ├── bbs/
│   │   ├── types.ts      # Shared domain models (Messages, Files, Dungeon, CRT Theme, Modem State)
│   │   ├── ansiArt.ts    # Haunted 1989 ANSI banners, skull emblems, and ZMODEM .NFO files
│   │   ├── modemAudio.ts # Procedural Web Audio DTMF + V.22bis modem handshake & retro SFX
│   │   ├── cryptGame.ts  # Pure deterministic ASCII Roguelike Door Game ("CRYPT CRAWLER '89")
│   │   └── bbsStore.ts   # Persistent EchoNet message board, Hall of Fame & JSON Snapshot Bridge
│   ├── App.tsx           # Resurrected CRT Terminal UI + Modem LED Panel + Modern Side Controls
│   ├── styles.css        # Phosphor CRT scanlines, 3 selectable themes, responsive layout
│   └── main.tsx          # React 19 entrypoint
├── tests/
│   └── bbs.test.ts       # Automated Vitest suite covering Crypt Crawler, EchoNet, and JSON Bridge
└── docs/                 # Production Vite build deployed to GitHub Pages
```
