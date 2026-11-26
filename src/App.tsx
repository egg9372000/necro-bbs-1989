import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Download,
  FileText,
  Gamepad2,
  Home,
  MessageSquare,
  Monitor,
  PhoneCall,
  Radio,
  RotateCcw,
  Skull,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { HAUNTED_SKULL_ART, NECRO_BANNER_ANSI, VAULT_FILES } from './bbs/ansiArt';
import {
  addHallOfFameScore,
  computeCrc16,
  createBbsSnapshot,
  loadHallOfFame,
  loadMessages,
  saveHallOfFame,
  saveMessages,
} from './bbs/bbsStore';
import { createCryptFloor, MAX_CRYPT_FLOORS, renderCryptAscii, stepCrypt } from './bbs/cryptGame';
import { modemAudio } from './bbs/modemAudio';
import type {
  BaudMode,
  BbsView,
  CrtTheme,
  CryptState,
  Direction,
  EchoMessage,
  HallOfFameEntry,
  VaultFile,
} from './bbs/types';

const HANDSHAKE_LINES: readonly string[] = [
  'ATZ',
  'OK',
  'ATM1L2',
  'OK',
  'ATDT 555-1989',
  'DIALING 555-1989 (DTMF TONE)...',
  'RINGING NODE 1:1989/1031...',
  'V.22bis 2100Hz CED ANSWER TONE DETECTED',
  'NEGOTIATING QAM CARRIER · CHECKING MNP-5...',
  'CONNECT 2400 / ARQ / RESURRECTION BRIDGE ACTIVE!',
];

export function App() {
  const [theme, setTheme] = useState<CrtTheme>('green');
  const [baud, setBaud] = useState<BaudMode>('2400');
  const [scanlines, setScanlines] = useState<boolean>(true);
  const [muted, setMuted] = useState<boolean>(false);
  const [view, setView] = useState<BbsView>('menu');
  const [txBlink, setTxBlink] = useState<boolean>(false);

  // Handshake simulator state
  const [handshakeStep, setHandshakeStep] = useState<number>(HANDSHAKE_LINES.length);

  // EchoNet state
  const [messages, setMessages] = useState<EchoMessage[]>(() => loadMessages());
  const [callerHandle, setCallerHandle] = useState<string>('CALLER_89');
  const [msgBoard, setMsgBoard] = useState<EchoMessage['board']>('FIDONET.89');
  const [msgSubject, setMsgSubject] = useState<string>('');
  const [msgBody, setMsgBody] = useState<string>('');
  const [postNotice, setPostNotice] = useState<string>('');

  // Door Game (CRYPT CRAWLER '89) state
  const [crypt, setCrypt] = useState<CryptState>(() => createCryptFloor(1));
  const [hof, setHof] = useState<HallOfFameEntry[]>(() => loadHallOfFame());
  const [hofSaved, setHofSaved] = useState<boolean>(false);

  // ZMODEM File Vault state
  const [selectedFile, setSelectedFile] = useState<VaultFile>(VAULT_FILES[0]);
  const [zmodemPct, setZmodemPct] = useState<number>(0);
  const [zmodemActive, setZmodemActive] = useState<boolean>(false);
  const [zmodemStatus, setZmodemStatus] = useState<string>('IDLE · SELECT A FILE FOR ZMODEM-8K');

  const pulseTx = useCallback(() => {
    setTxBlink(true);
    window.setTimeout(() => setTxBlink(false), 180);
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    modemAudio.muted = next;
  };

  const navigate = useCallback(
    (nextView: BbsView) => {
      modemAudio.playKeyBeep();
      pulseTx();
      setView(nextView);
    },
    [pulseTx]
  );

  const startHandshake = useCallback(() => {
    setView('handshake');
    setHandshakeStep(1);
    pulseTx();
    modemAudio.playModemHandshake();
  }, [pulseTx]);

  // Step through modem handshake lines according to selected baud rate
  useEffect(() => {
    if (view !== 'handshake') return;
    if (handshakeStep >= HANDSHAKE_LINES.length) {
      const doneTimer = window.setTimeout(() => setView('menu'), 650);
      return () => window.clearTimeout(doneTimer);
    }
    const stepDelay = baud === 'fiber' ? 85 : baud === '9600' ? 160 : 240;
    const timer = window.setTimeout(() => {
      setHandshakeStep((s) => s + 1);
      pulseTx();
    }, stepDelay);
    return () => window.clearTimeout(timer);
  }, [view, handshakeStep, baud, pulseTx]);

  const handleCryptMove = useCallback(
    (dir: Direction) => {
      pulseTx();
      setCrypt((prev) => {
        const res = stepCrypt(prev, dir);
        if (res.event === 'relic' || res.event === 'elixir') modemAudio.playRelicChime();
        else if (res.event === 'attack' || res.event === 'death') modemAudio.playCombatHit();
        else if (res.event === 'stairs' || res.event === 'victory') modemAudio.playStairsDescend();
        else if (res.event === 'move') modemAudio.playKeyBeep();
        return res.state;
      });
    },
    [pulseTx]
  );

  // Global retro BBS hotkeys + Door Game WASD/Arrow keys (paused when typing in inputs)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      const key = e.key.toLowerCase();
      if (view === 'door') {
        if (key === 'w' || key === 'arrowup') {
          e.preventDefault();
          handleCryptMove('up');
          return;
        }
        if (key === 's' || key === 'arrowdown') {
          e.preventDefault();
          handleCryptMove('down');
          return;
        }
        if (key === 'a' || key === 'arrowleft') {
          e.preventDefault();
          handleCryptMove('left');
          return;
        }
        if (key === 'd' || key === 'arrowright') {
          e.preventDefault();
          handleCryptMove('right');
          return;
        }
        if (key === 'b' || key === 'escape') {
          navigate('menu');
          return;
        }
        return;
      }

      if (key === 'm') navigate('echonet');
      else if (key === 'd') navigate('door');
      else if (key === 'f') navigate('files');
      else if (key === 's') navigate('sysop');
      else if (key === 'b') navigate('menu');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view, handleCryptMove, navigate]);

  const handlePostMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject.trim() || !msgBody.trim()) return;
    const newMsg: EchoMessage = {
      id: `msg-${Date.now()}`,
      board: msgBoard,
      author: callerHandle.trim().toUpperCase().slice(0, 14) || 'CALLER_89',
      nodeAddress: '1:1989/1031',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      subject: msgSubject.trim(),
      body: msgBody.trim(),
    };
    const updated = [newMsg, ...messages];
    setMessages(updated);
    saveMessages(updated);
    setMsgSubject('');
    setMsgBody('');
    setPostNotice('PACKET TRANSMITTED TO ECHONET · SAVED TO NODE STORAGE.');
    modemAudio.playRelicChime();
    pulseTx();
  };

  const handleSaveHof = () => {
    const updated = addHallOfFameScore(
      hof,
      callerHandle,
      crypt.score,
      crypt.floor,
      crypt.relicsCollected
    );
    setHof(updated);
    saveHallOfFame(updated);
    setHofSaved(true);
    modemAudio.playStairsDescend();
  };

  const handleZmodemTransfer = (file: VaultFile) => {
    setSelectedFile(file);
    setZmodemActive(true);
    setZmodemPct(10);
    const crc = computeCrc16(file.content);
    setZmodemStatus(`ZMODEM-8K SENDING ${file.filename} (CRC-16: 0x${crc})...`);
    modemAudio.playKeyBeep();
    pulseTx();

    const stepMs = baud === 'fiber' ? 40 : baud === '9600' ? 90 : 140;
    let pct = 10;
    const interval = window.setInterval(() => {
      pct += 18;
      pulseTx();
      if (pct >= 100) {
        window.clearInterval(interval);
        setZmodemPct(100);
        setZmodemActive(false);
        setZmodemStatus(`TRANSFER COMPLETE · ${file.filename} VERIFIED CRC-16 0x${crc} (0 ERRORS)`);
        modemAudio.playRelicChime();
        const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setZmodemPct(pct);
      }
    }, stepMs);
  };

  const handleDownloadSnapshot = () => {
    const snap = createBbsSnapshot(messages, hof);
    const blob = new Blob([JSON.stringify(snap, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'necro-bbs-1989-snapshot.json';
    a.click();
    URL.revokeObjectURL(url);
    modemAudio.playRelicChime();
  };

  const asciiMap = renderCryptAscii(crypt);
  const snapshotJson = JSON.stringify(createBbsSnapshot(messages, hof), null, 2);

  return (
    <div className="shell" data-theme={theme}>
      {/* External 1989 Hardware Modem LED Panel */}
      <header className="hardware-bar">
        <div className="modem-leds">
          <Radio size={17} />
          <span className="modem-label">USR COURIER HST · 1989</span>
          <span className="led-pill on-red">
            <span className="led-dot" />
            OH
          </span>
          <span className={`led-pill ${view === 'handshake' ? 'on-amber' : 'on-green'}`}>
            <span className="led-dot" />
            CD
          </span>
          <span className={`led-pill ${txBlink || zmodemActive ? 'on-amber' : ''}`}>
            <span className="led-dot" />
            TX
          </span>
          <span className={`led-pill ${txBlink || view === 'handshake' ? 'on-green' : ''}`}>
            <span className="led-dot" />
            RX
          </span>
        </div>

        <div className="toolbar-group">
          {(['green', 'amber', 'violet'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`hw-btn ${theme === t ? 'active' : ''}`}
              onClick={() => setTheme(t)}
            >
              <Monitor size={12} />
              {t === 'green' ? 'P1 GREEN' : t === 'amber' ? 'P3 AMBER' : 'SPECTRAL'}
            </button>
          ))}

          {(['2400', '9600', 'fiber'] as const).map((b) => (
            <button
              key={b}
              type="button"
              className={`hw-btn ${baud === b ? 'active' : ''}`}
              onClick={() => setBaud(b)}
            >
              {b === 'fiber' ? '2026 FIBER' : `${b} BPS`}
            </button>
          ))}

          <button
            type="button"
            className={`hw-btn ${scanlines ? 'active' : ''}`}
            onClick={() => setScanlines((s) => !s)}
          >
            CRT: {scanlines ? 'ON' : 'OFF'}
          </button>

          <button type="button" className="hw-btn" onClick={toggleMute}>
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            {muted ? 'MUTED' : 'AUDIO'}
          </button>

          <button type="button" className="hw-btn active" onClick={startHandshake}>
            <PhoneCall size={12} />
            REDIAL 1989
          </button>
        </div>
      </header>

      {/* Haunted CRT Terminal Monitor */}
      <main className="crt-bezel">
        <div className={`crt-screen ${scanlines ? 'scanlines' : ''}`}>
          <pre className="ansi-banner">{NECRO_BANNER_ANSI}</pre>

          <nav className="nav-strip">
            <button
              type="button"
              className={`nav-btn ${view === 'menu' ? 'active' : ''}`}
              onClick={() => navigate('menu')}
            >
              <Home size={13} />
              [B] MAIN MENU
            </button>
            <button
              type="button"
              className={`nav-btn ${view === 'echonet' ? 'active' : ''}`}
              onClick={() => navigate('echonet')}
            >
              <MessageSquare size={13} />
              [M] ECHONET ({messages.length})
            </button>
            <button
              type="button"
              className={`nav-btn ${view === 'door' ? 'active' : ''}`}
              onClick={() => navigate('door')}
            >
              <Gamepad2 size={13} />
              [D] CRYPT CRAWLER &apos;89
            </button>
            <button
              type="button"
              className={`nav-btn ${view === 'files' ? 'active' : ''}`}
              onClick={() => navigate('files')}
            >
              <FileText size={13} />
              [F] ZMODEM VAULT
            </button>
            <button
              type="button"
              className={`nav-btn ${view === 'sysop' ? 'active' : ''}`}
              onClick={() => navigate('sysop')}
            >
              <Activity size={13} />
              [S] SYSOP 2026 BRIDGE
            </button>
          </nav>

          {/* VIEW: DIAL-UP MODEM HANDSHAKE */}
          {view === 'handshake' && (
            <section className="term-box">
              <div className="term-heading">
                <span>ACOUSTIC MODEM DIALER · HAYES AT COMMAND STREAM</span>
                <button type="button" className="hw-btn active" onClick={() => setView('menu')}>
                  SKIP TO MENU
                </button>
              </div>
              {HANDSHAKE_LINES.slice(0, handshakeStep).map((line, idx) => (
                <div key={idx} className="term-line">
                  &gt; {line}
                </div>
              ))}
            </section>
          )}

          {/* VIEW: MAIN BBS MENU */}
          {view === 'menu' && (
            <div className="bbs-grid">
              <section className="term-box">
                <div className="term-heading">
                  <span>MAIN BULLETIN BOARD DIRECTORY</span>
                  <span className="term-muted">KEYS OR CLICK TO ENTER</span>
                </div>
                <div className="menu-list">
                  <button type="button" className="menu-item" onClick={() => navigate('echonet')}>
                    <div>
                      <div className="term-line">MESSAGE ECHONET (FIDONET 1989 -&gt; 2026)</div>
                      <div className="term-muted">
                        Read haunted SysOp boards &amp; post persistent ASCII messages
                      </div>
                    </div>
                    <span className="hotkey-tag">[M]</span>
                  </button>

                  <button type="button" className="menu-item" onClick={() => navigate('door')}>
                    <div>
                      <div className="term-line">DOOR GAME: CRYPT CRAWLER &apos;89</div>
                      <div className="term-muted">
                        3-floor ASCII roguelike dungeon · Banish phantoms &amp; claim Hall of Fame
                      </div>
                    </div>
                    <span className="hotkey-tag">[D]</span>
                  </button>

                  <button type="button" className="menu-item" onClick={() => navigate('files')}>
                    <div>
                      <div className="term-line">ZMODEM-8K HAUNTED FILE VAULT</div>
                      <div className="term-muted">
                        Inspect &amp; download retro .NFO/.ANS files with CRC-16-CCITT verification
                      </div>
                    </div>
                    <span className="hotkey-tag">[F]</span>
                  </button>

                  <button type="button" className="menu-item" onClick={() => navigate('sysop')}>
                    <div>
                      <div className="term-line">SYSOP DIAGNOSTICS &amp; 2026 JSON BRIDGE</div>
                      <div className="term-muted">
                        Inspect node status, Kiro spec workflow, &amp; export structured 2026 JSON
                      </div>
                    </div>
                    <span className="hotkey-tag">[S]</span>
                  </button>
                </div>
              </section>

              <section className="term-box">
                <div className="term-heading">
                  <span>NODE 1:1989/1031 · CARRIER STATUS</span>
                  <Skull size={14} />
                </div>
                <pre className="term-line" style={{ textAlign: 'center', fontSize: 11 }}>
                  {HAUNTED_SKULL_ART}
                </pre>
                <div className="term-line">
                  CALLER HANDLE:{' '}
                  <input
                    aria-label="Caller handle"
                    className="term-input"
                    style={{ width: 150, display: 'inline-block', padding: '4px 8px' }}
                    value={callerHandle}
                    onChange={(e) => setCallerHandle(e.target.value)}
                  />
                </div>
                <div className="term-muted">
                  ACTIVE BAUD: {baud === 'fiber' ? '2026 FIBER BRIDGE' : `${baud} BPS (8-N-1)`} ·
                  ECHONET POSTS: {messages.length} · TOP CRYPT SCORE: {hof[0]?.score ?? 0} (
                  {hof[0]?.handle ?? 'NONE'})
                </div>
                <button type="button" className="action-cta" onClick={startHandshake}>
                  <PhoneCall size={14} />
                  PLAY 1989 ACOUSTIC MODEM HANDSHAKE
                </button>
              </section>
            </div>
          )}

          {/* VIEW: ECHONET MESSAGE BOARD */}
          {view === 'echonet' && (
            <div className="bbs-grid">
              <section className="term-box">
                <div className="term-heading">
                  <span>FIDONET ECHONET THREADS ({messages.length})</span>
                  <span className="term-muted">NODE 1:1989/1031</span>
                </div>
                <div className="msg-list">
                  {messages.map((m) => (
                    <article key={m.id} className="msg-card">
                      <div className="term-muted">
                        [{m.board}] FROM {m.author} ({m.nodeAddress}) · {m.timestamp}
                      </div>
                      <div className="term-line" style={{ fontWeight: 800 }}>
                        SUBJ: {m.subject}
                      </div>
                      <div className="term-line">{m.body}</div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="term-box">
                <div className="term-heading">
                  <span>COMPOSE NEW ECHONET PACKET</span>
                </div>
                <form onSubmit={handlePostMessage} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="term-muted">
                    CALLER HANDLE
                    <input
                      className="term-input"
                      value={callerHandle}
                      onChange={(e) => setCallerHandle(e.target.value)}
                    />
                  </label>
                  <label className="term-muted">
                    SUB-BOARD
                    <select
                      className="term-input"
                      value={msgBoard}
                      onChange={(e) => setMsgBoard(e.target.value as EchoMessage['board'])}
                    >
                      <option value="FIDONET.89">FIDONET.89</option>
                      <option value="SYSOP.ANN">SYSOP.ANN</option>
                      <option value="CRYPT.LORE">CRYPT.LORE</option>
                      <option value="MODERN.2026">MODERN.2026</option>
                    </select>
                  </label>
                  <label className="term-muted">
                    SUBJECT
                    <input
                      className="term-input"
                      placeholder="e.g. Beat Floor 3 on 2400 baud!"
                      value={msgSubject}
                      onChange={(e) => setMsgSubject(e.target.value)}
                    />
                  </label>
                  <label className="term-muted">
                    MESSAGE BODY
                    <textarea
                      className="term-textarea"
                      rows={4}
                      placeholder="Transmit your ANSI message across the temporal echo..."
                      value={msgBody}
                      onChange={(e) => setMsgBody(e.target.value)}
                    />
                  </label>
                  <button type="submit" className="action-cta">
                    TRANSMIT TO ECHONET
                  </button>
                  {postNotice && <div className="term-muted">{postNotice}</div>}
                </form>
              </section>
            </div>
          )}

          {/* VIEW: DOOR GAME — CRYPT CRAWLER '89 */}
          {view === 'door' && (
            <div className="bbs-grid">
              <section className="term-box">
                <div className="term-heading">
                  <span>DOOR #1 · CRYPT CRAWLER &apos;89 (FLOOR {crypt.floor}/{MAX_CRYPT_FLOORS})</span>
                  <button
                    type="button"
                    className="hw-btn active"
                    onClick={() => {
                      setCrypt(createCryptFloor(1));
                      setHofSaved(false);
                    }}
                  >
                    <RotateCcw size={12} />
                    NEW RUN
                  </button>
                </div>

                <div className="stats-strip">
                  <div className="stat-cell">
                    <div className="term-muted">HP</div>
                    <div className="term-line">
                      {crypt.hp}/{crypt.maxHp}
                    </div>
                  </div>
                  <div className="stat-cell">
                    <div className="term-muted">SCORE</div>
                    <div className="term-line">{crypt.score}</div>
                  </div>
                  <div className="stat-cell">
                    <div className="term-muted">RELICS (*)</div>
                    <div className="term-line">{crypt.relicsCollected}</div>
                  </div>
                  <div className="stat-cell">
                    <div className="term-muted">ATK / TURN</div>
                    <div className="term-line">
                      {crypt.atk} / {crypt.turn}
                    </div>
                  </div>
                </div>

                <pre className="crypt-pre" aria-label="Crypt Crawler ASCII Map">
                  {asciiMap.join('\n')}
                </pre>

                <div className="term-muted" style={{ textAlign: 'center' }}>
                  @ YOU · G GHOST · W WRAITH · * RELIC (+250) · + ELIXIR · &gt; STAIRS DOWN · WASD / ARROWS
                </div>

                <div className="dpad-grid">
                  <span />
                  <button type="button" className="dpad-btn" onClick={() => handleCryptMove('up')}>
                    W ↑
                  </button>
                  <span />
                  <button type="button" className="dpad-btn" onClick={() => handleCryptMove('left')}>
                    A ←
                  </button>
                  <button type="button" className="dpad-btn" onClick={() => handleCryptMove('down')}>
                    S ↓
                  </button>
                  <button type="button" className="dpad-btn" onClick={() => handleCryptMove('right')}>
                    D →
                  </button>
                </div>
              </section>

              <section className="term-box">
                <div className="term-heading">
                  <span>COMBAT TERMINAL LOG &amp; HALL OF FAME</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {crypt.log.map((entry, idx) => (
                    <div key={idx} className="term-line">
                      &gt; {entry}
                    </div>
                  ))}
                </div>

                {(crypt.gameOver || crypt.victory || crypt.score > 0) && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                    <input
                      className="term-input"
                      style={{ maxWidth: 140 }}
                      value={callerHandle}
                      onChange={(e) => setCallerHandle(e.target.value)}
                      placeholder="HANDLE"
                    />
                    <button
                      type="button"
                      className="action-cta"
                      disabled={hofSaved}
                      onClick={handleSaveHof}
                    >
                      {hofSaved ? 'SCORE RECORDED!' : `POST SCORE (${crypt.score})`}
                    </button>
                  </div>
                )}

                <div className="term-heading" style={{ marginTop: 8 }}>
                  <span>BBS DOOR HALL OF FAME</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {hof.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="term-line"
                      style={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <span>
                        #{idx + 1} {entry.handle} (F{entry.floor} · {entry.relics}*)
                      </span>
                      <strong>{entry.score.toLocaleString()} PTS</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* VIEW: ZMODEM HAUNTED FILE VAULT */}
          {view === 'files' && (
            <div className="bbs-grid">
              <section className="term-box">
                <div className="term-heading">
                  <span>ZMODEM-8K FILE AREA</span>
                  <span className="term-muted">CRC-16-CCITT VERIFIED</span>
                </div>
                <div className="menu-list">
                  {VAULT_FILES.map((file) => {
                    const crc = computeCrc16(file.content);
                    return (
                      <div key={file.id} className="menu-item">
                        <button
                          type="button"
                          style={{ textAlign: 'left', flex: 1 }}
                          onClick={() => setSelectedFile(file)}
                        >
                          <div className="term-line">
                            {file.filename} [{file.category} · {file.year}]
                          </div>
                          <div className="term-muted">
                            {file.description} · {file.content.length}B · CRC16: 0x{crc}
                          </div>
                        </button>
                        <button
                          type="button"
                          className="action-cta"
                          disabled={zmodemActive}
                          onClick={() => handleZmodemTransfer(file)}
                        >
                          <Download size={13} />
                          ZMODEM
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="term-muted">{zmodemStatus}</div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${zmodemPct}%` }} />
                </div>
              </section>

              <section className="term-box">
                <div className="term-heading">
                  <span>FILE INSPECTOR · {selectedFile.filename}</span>
                </div>
                <pre className="json-preview" style={{ maxHeight: 340 }}>
                  {selectedFile.content}
                </pre>
              </section>
            </div>
          )}

          {/* VIEW: SYSOP DIAGNOSTICS & 2026 JSON BRIDGE */}
          {view === 'sysop' && (
            <div className="bbs-grid">
              <section className="term-box">
                <div className="term-heading">
                  <span>SYSOP TELEMETRY &amp; KIRO SPEC ARCHITECTURE</span>
                </div>
                <div className="term-line">NODE ID: 1:1989/1031 · NECRO-BBS RESURRECTION</div>
                <div className="term-line">
                  MODEM EMULATION: Hayes AT / DTMF / V.22bis Web Audio Synthesizer
                </div>
                <div className="term-line">
                  KIRO SPEC WORKFLOW: .kiro/steering (3) · .kiro/specs (3) · .kiro/hooks (1)
                </div>
                <div className="term-line">
                  PERSISTENT STATE: {messages.length} EchoNet packets · {hof.length} Door Hall of
                  Fame entries
                </div>
                <button type="button" className="action-cta" onClick={handleDownloadSnapshot}>
                  <Download size={14} />
                  EXPORT 2026 JSON SNAPSHOT
                </button>
              </section>

              <section className="term-box">
                <div className="term-heading">
                  <span>LIVE 2026 JSON SNAPSHOT BRIDGE</span>
                </div>
                <pre className="json-preview">{snapshotJson}</pre>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
