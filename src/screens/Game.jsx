import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { Board } from '../components/Board.jsx';
import { Timer } from '../components/Timer.jsx';
import { Mark } from '../components/Mark.jsx';
import { Button, ConfirmDialog } from '../components/ui.jsx';
import { ResultOverlay } from './ResultOverlay.jsx';
import { emptyBoard, evaluate, play, otherSymbol } from '../engine/game.js';
import { chooseMove } from '../ai/ai.js';
import { playSound } from '../audio/audio.js';
import { vibrate } from '../platform/haptics.js';
import { ACHIEVEMENTS } from '../achievements/achievements.js';
import { shouldShowInterstitial } from '../ads/adPolicy.js';
import { showInterstitial } from '../ads/adService.js';

const AI_DELAY_MIN = 380;
const AI_DELAY_MAX = 650;
const RESULT_DELAY = 1100;

/** Derives player info from a game config. */
function describe(config, t, profile) {
  if (config.mode === 'solo') {
    const human = config.humanSymbol;
    const ai = otherSymbol(human);
    return {
      firstSymbol: config.starter === 'ai' ? ai : human,
      aiSymbol: ai,
      players: {
        [human]: { name: profile.name || t('common.you'), avatar: profile.avatar, isHuman: true },
        [ai]: { name: t('game.ai'), avatar: '🤖', isAI: true },
      },
      p1Symbol: human,
    };
  }
  const [p1, p2] = config.players;
  return {
    firstSymbol: config.players[config.starter].symbol,
    aiSymbol: null,
    players: {
      [p1.symbol]: { name: p1.name, avatar: profile.avatar },
      [p2.symbol]: { name: p2.name, avatar: '👤' },
    },
    p1Symbol: p1.symbol,
  };
}

function GameSession({ config, nav, onReplay, registerBack }) {
  const app = useApp();
  const { t, data, recordGame, rollbackGame, markInterstitialShown, toast, getData } = app;
  const info = describe(config, t, data.profile);

  const [board, setBoard] = useState(emptyBoard);
  const [moves, setMoves] = useState([]);
  const [turn, setTurn] = useState(info.firstSymbol);
  const [startedAt, setStartedAt] = useState(null);
  const [endedAt, setEndedAt] = useState(null);
  const [pausedOffset, setPausedOffset] = useState(0);
  const [outcome, setOutcome] = useState(null); // { result, winnerSymbol, line, record, durationMs }
  const [showResult, setShowResult] = useState(false);
  const [secondChanceUsed, setSecondChanceUsed] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const timers = useRef([]);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const state = evaluate(board);
  const isAITurn = config.mode === 'solo' && turn === info.aiSymbol && !state.over;
  const inProgress = moves.length > 0 && !state.over;

  const place = useCallback(
    (index, symbol) => {
      setBoard((b) => (b[index] === null && !evaluate(b).over ? play(b, index, symbol) : b));
      setMoves((m) => [...m, { index, symbol }]);
      setTurn(otherSymbol(symbol));
      setStartedAt((s) => s ?? Date.now());
      playSound(symbol === 'X' ? 'x' : 'o');
      vibrate('move');
    },
    [],
  );

  const onCellPress = (index) => {
    if (state.over || isAITurn || board[index] !== null) return;
    place(index, turn);
  };

  // AI move
  useEffect(() => {
    if (!isAITurn) return undefined;
    const delay = AI_DELAY_MIN + Math.random() * (AI_DELAY_MAX - AI_DELAY_MIN);
    const id = setTimeout(() => place(chooseMove(board, info.aiSymbol, config.difficulty), info.aiSymbol), delay);
    return () => clearTimeout(id);
  }, [isAITurn, board]); // eslint-disable-line react-hooks/exhaustive-deps

  // Game end
  useEffect(() => {
    if (!state.over || outcome) return;
    const end = Date.now();
    setEndedAt(end);
    const durationMs = Math.max(0, end - (startedAt ?? end) - pausedOffset);
    let result;
    if (state.draw) result = 'draw';
    else result = state.winner === info.p1Symbol ? 'win' : 'loss';

    const winnerName = state.winner ? info.players[state.winner].name : null;
    const record = recordGame({
      mode: config.mode,
      difficulty: config.mode === 'solo' ? config.difficulty : undefined,
      opponent: config.mode === 'solo' ? 'AI' : config.players[1].name,
      winnerName,
      outcome: result,
      durationMs,
    });
    setOutcome({ result, winnerSymbol: state.winner, line: state.line, record, durationMs, winnerName });

    // Feedback: in 2-player mode any winner is celebrated; defeat sound only against the AI.
    const humanWon = state.winner && (config.mode === 'duo' || result === 'win');
    if (state.draw) {
      playSound('draw');
      vibrate('draw');
    } else if (humanWon) {
      playSound('win');
      vibrate('win');
    } else {
      playSound('loss');
      vibrate('loss');
    }

    record.unlocked.forEach((id, i) => {
      later(() => {
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        playSound('trophy');
        vibrate('trophy');
        toast(`${t('toast.trophy')} ${t(`ach.${id}.title`)}`, a?.icon ?? '🏆');
      }, RESULT_DELAY + 500 + i * 900);
    });
    later(() => setShowResult(true), RESULT_DELAY);
  }, [state.over]); // eslint-disable-line react-hooks/exhaustive-deps

  // Android back button
  useEffect(
    () =>
      registerBack(() => {
        if (confirmQuit) setConfirmQuit(false);
        else if (inProgress) setConfirmQuit(true);
        else nav.goHome();
        return true;
      }),
    [inProgress, confirmQuit, registerBack, nav],
  );

  /** Runs `next` after (rarely) showing an interstitial — only between games, never during one. */
  const leave = async (next) => {
    const d = getData();
    if (shouldShowInterstitial(d.meta.ads, d.stats.gamesPlayed, Date.now())) {
      const shown = await showInterstitial();
      if (shown) markInterstitialShown();
    }
    next();
  };

  const secondChance = () => {
    if (!outcome) return;
    rollbackGame(outcome.record.snapshot);
    // Undo the AI's winning move and the player's last move.
    const kept = moves.slice(0, -2);
    const b = emptyBoard();
    kept.forEach((m) => (b[m.index] = m.symbol));
    setBoard(b);
    setMoves(kept);
    setTurn(config.humanSymbol);
    setPausedOffset((p) => p + (Date.now() - endedAt));
    setEndedAt(null);
    setOutcome(null);
    setShowResult(false);
    setSecondChanceUsed(true);
  };

  const current = info.players[turn];
  let status;
  if (state.over) status = '';
  else if (config.mode === 'solo') status = isAITurn ? t('game.aiThinking') : t('game.yourTurn');
  else status = t('game.turnOf', { name: current.name });

  const symbols = config.mode === 'solo' ? [config.humanSymbol, info.aiSymbol] : config.players.map((p) => p.symbol);

  return (
    <div className="screen game">
      <header className="screen-header">
        <button
          type="button"
          className="icon-btn"
          aria-label={t('game.quit')}
          onClick={() => {
            playSound('click');
            inProgress ? setConfirmQuit(true) : nav.goHome();
          }}
        >
          ✕
        </button>
        <div className="game-mode">
          {config.mode === 'solo' ? `🤖 ${t(`level.${config.difficulty}`)}` : `👥 ${t('duo.title')}`}
        </div>
        {data.settings.timer ? (
          <Timer startedAt={startedAt} endedAt={endedAt} pausedOffset={pausedOffset} />
        ) : (
          <span className="icon-btn-placeholder" />
        )}
      </header>

      <main className="screen-body game-body">
        <div className="players">
          {symbols.map((s, i) => (
            <div
              key={s}
              className={`player-card ${!state.over && turn === s ? 'active' : ''} ${
                outcome?.winnerSymbol === s ? 'winner' : ''
              }`}
            >
              <span className="avatar" aria-hidden="true">
                {info.players[s].avatar}
              </span>
              <span className="player-name">{info.players[s].name}</span>
              <Mark symbol={s} className="mini" />
              {i === 0 && <span className="vs" aria-hidden="true">{t('game.vs')}</span>}
            </div>
          ))}
        </div>

        <div className={`turn-indicator ${isAITurn ? 'thinking' : ''}`} aria-live="polite">
          {!state.over && <Mark symbol={turn} className="mini" />}
          <span>{status}</span>
        </div>

        <Board
          board={board}
          winLine={state.line}
          disabled={state.over || isAITurn}
          onPlay={onCellPress}
          lastMove={moves[moves.length - 1]?.index}
        />
      </main>

      {showResult && outcome && (
        <ResultOverlay
          config={config}
          outcome={outcome}
          showTimer={data.settings.timer}
          canSecondChance={config.mode === 'solo' && outcome.result === 'loss' && !secondChanceUsed}
          onSecondChance={secondChance}
          onReplay={() => leave(onReplay)}
          onNewGame={() => leave(() => nav.reset(config.mode === 'solo' ? 'solo' : 'duo'))}
          onHome={() => leave(nav.goHome)}
          onStats={() => leave(() => nav.reset('stats'))}
        />
      )}

      <ConfirmDialog
        open={confirmQuit}
        title={t('game.quitTitle')}
        text={t('game.quitText')}
        confirmLabel={t('game.quit')}
        danger
        onCancel={() => setConfirmQuit(false)}
        onConfirm={() => {
          setConfirmQuit(false);
          nav.goHome();
        }}
      />
    </div>
  );
}

export function Game({ nav, params, registerBack }) {
  const [round, setRound] = useState(0);
  return (
    <GameSession
      key={round}
      config={params.config}
      nav={nav}
      registerBack={registerBack}
      onReplay={() => setRound((r) => r + 1)}
    />
  );
}
