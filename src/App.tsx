import { CircleHelp, Redo, Undo, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  applyFinish,
  DEFAULT_WIN_SCORE,
  FINISH_BY_ID,
  FINISHES,
  INITIAL_SCORE,
  isWinScore,
  winnerOf,
  WIN_SCORE_HINT,
  WIN_SCORE_OPTIONS,
  type FinishId,
  type Player,
  type ScoreSnapshot,
  type WinScore,
} from "./scoring.ts";

const WIN_SCORE_KEY = "bbx-win-score";

function readWinScore(): WinScore {
  try {
    const stored = Number(localStorage.getItem(WIN_SCORE_KEY));
    if (isWinScore(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_WIN_SCORE;
}

function haptic(ms = 16) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
}

export default function App() {
  const [history, setHistory] = useState<ScoreSnapshot[]>([INITIAL_SCORE]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [winScore, setWinScore] = useState<WinScore>(readWinScore);
  const [resetArmed, setResetArmed] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [flash, setFlash] = useState<{
    id: number;
    player: Player;
    finish: FinishId;
  } | null>(null);

  const currentScore = history[currentIndex];
  const winner = winnerOf(currentScore, winScore);
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  useEffect(() => {
    if (!resetArmed) return;
    const timer = window.setTimeout(() => setResetArmed(false), 2500);
    return () => window.clearTimeout(timer);
  }, [resetArmed]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 1100);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const handleScore = (player: Player, finish: FinishId) => {
    const nextScore = applyFinish(currentScore, player, finish, winScore);
    if (!nextScore) return;

    haptic(nextScore[player] >= winScore ? 32 : 12);
    const nextHistory = history.slice(0, currentIndex + 1);
    setHistory([...nextHistory, nextScore]);
    setCurrentIndex(nextHistory.length);
    setResetArmed(false);
    setFlash({ id: Date.now(), player, finish });
  };

  const undo = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setResetArmed(false);
    setFlash(null);
  };

  const redo = () => {
    setCurrentIndex((prev) => Math.min(history.length - 1, prev + 1));
    setResetArmed(false);
    setFlash(null);
  };

  const reset = () => {
    if (
      !resetArmed &&
      (currentIndex > 0 || currentScore.red || currentScore.blue)
    ) {
      setResetArmed(true);
      return;
    }
    setHistory([INITIAL_SCORE]);
    setCurrentIndex(0);
    setResetArmed(false);
    setFlash(null);
  };

  const changeWinScore = (value: WinScore) => {
    setWinScore(value);
    try {
      localStorage.setItem(WIN_SCORE_KEY, String(value));
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="relative flex h-dvh w-dvw flex-col overflow-hidden bg-black text-white select-none"
      onContextMenu={(event) => event.preventDefault()}
    >
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-2 bg-black/85 px-2 pt-[max(0.4rem,env(safe-area-inset-top))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-2 pl-[max(0.5rem,env(safe-area-inset-left))] backdrop-blur-md">
        <div className="flex items-center gap-1">
          <IconButton label="Undo" disabled={!canUndo} onClick={undo}>
            <Undo className="size-6 stroke-[2.25]" />
          </IconButton>
          <IconButton label="Redo" disabled={!canRedo} onClick={redo}>
            <Redo className="size-6 stroke-[2.25]" />
          </IconButton>
        </div>

        <button
          type="button"
          onClick={reset}
          className={`min-h-11 min-w-[5.75rem] rounded-full px-4 text-sm font-black tracking-wider ${
            resetArmed
              ? "bg-yellow-400 text-black"
              : winner
                ? "bg-white text-black"
                : "bg-white/12 text-white"
          }`}
        >
          {resetArmed ? "SURE?" : winner ? "NEW" : "RESET"}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="min-h-11 rounded-full bg-white/12 px-3 text-xs font-black tracking-wider"
            aria-label={`First to ${winScore}. Open rules.`}
          >
            FT{winScore}
          </button>
          <IconButton label="Rules" onClick={() => setRulesOpen(true)}>
            <CircleHelp className="size-6 stroke-[2.25]" />
          </IconButton>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col landscape:flex-row">
        <TeamPanel
          player="red"
          score={currentScore}
          winScore={winScore}
          winner={winner}
          onScore={handleScore}
        />
        <TeamPanel
          player="blue"
          score={currentScore}
          winScore={winScore}
          winner={winner}
          onScore={handleScore}
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-[28vmin] leading-none font-black text-white/12 landscape:pb-[4vmin]">
            X
          </span>
        </div>
      </div>

      {flash && (
        <div
          key={flash.id}
          className="finish-flash pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
          aria-live="polite"
        >
          <div
            className={`absolute inset-0 opacity-30 ${
              flash.player === "red" ? "bg-pink-600" : "bg-blue-600"
            }`}
          />
          <div className="relative px-4 text-center drop-shadow-[0_10px_28px_rgba(0,0,0,0.72)]">
            <p className="text-[clamp(4.5rem,22vmin,10rem)] leading-none font-black tracking-tighter">
              +{FINISH_BY_ID[flash.finish].points}
            </p>
            <p className="mt-1 text-[clamp(1.1rem,4.4vmin,2.25rem)] font-black tracking-[0.35em] uppercase">
              {FINISH_BY_ID[flash.finish].label}
            </p>
          </div>
        </div>
      )}

      {rulesOpen && (
        <RulesSheet
          winScore={winScore}
          onChangeWinScore={changeWinScore}
          onClose={() => setRulesOpen(false)}
        />
      )}
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full bg-white/12 text-white disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function TeamPanel({
  player,
  score,
  winScore,
  winner,
  onScore,
}: {
  player: Player;
  score: ScoreSnapshot;
  winScore: number;
  winner: Player | null;
  onScore: (player: Player, finish: FinishId) => void;
}) {
  const isRed = player === "red";
  const value = score[player];
  const isWinner = winner === player;
  const isLoser = winner !== null && !isWinner;
  const last = score.last?.player === player ? score.last : null;
  const locked = winner !== null;

  return (
    <section
      className={`relative flex min-h-0 flex-1 flex-col ${
        isRed ? "bg-pink-600" : "bg-blue-600"
      } ${isLoser ? "brightness-75" : ""}`}
    >
      <div
        className={`flex min-h-0 flex-1 flex-col items-center justify-center px-3 ${
          isRed
            ? "pl-[max(0.75rem,env(safe-area-inset-left))]"
            : "pr-[max(0.75rem,env(safe-area-inset-right))] landscape:pr-[max(0.75rem,env(safe-area-inset-right))]"
        }`}
      >
        <p className="text-[0.7rem] font-black tracking-[0.35em] text-white/80 uppercase sm:text-sm">
          {player}
        </p>
        <p className="text-[clamp(4.25rem,22vmin,11rem)] leading-none font-bold tracking-tighter">
          {value}
        </p>
        <p className="mt-1 text-sm font-bold tracking-widest text-white/75 sm:text-base">
          {value} / {winScore}
        </p>
        {winScore === 4 && (
          <div className="mt-2 flex gap-1.5">
            {Array.from({ length: winScore }, (_, index) => (
              <span
                key={index}
                className={`size-2.5 rounded-full sm:size-3 ${
                  index < Math.min(value, winScore) ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {isWinner && (
        <p className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-yellow-400 px-4 py-1 text-sm font-black tracking-[0.2em] text-black uppercase">
          Wins
        </p>
      )}

      <div
        className={`grid grid-cols-2 gap-2 p-2 ${
          isRed
            ? "pl-[max(0.5rem,env(safe-area-inset-left))]"
            : "pr-[max(0.5rem,env(safe-area-inset-right))]"
        } pb-[max(0.5rem,env(safe-area-inset-bottom))] landscape:pb-[max(0.5rem,env(safe-area-inset-bottom))]`}
      >
        {FINISHES.map((finish) => {
          const isLast = last?.finish === finish.id;
          return (
            <button
              key={finish.id}
              type="button"
              disabled={locked}
              onClick={() => onScore(player, finish.id)}
              aria-label={`${player} ${finish.label} finish, ${finish.points} point${finish.points === 1 ? "" : "s"}`}
              className={`flex min-h-[3.35rem] flex-col items-center justify-center rounded-2xl px-2 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] transition-transform active:scale-[0.97] disabled:opacity-40 sm:min-h-20 [@media(orientation:landscape)_and_(max-height:500px)]:min-h-12 ${
                isLast
                  ? "bg-black/40 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.85)]"
                  : finish.id === "xtreme"
                    ? "bg-black/28"
                    : "bg-black/20"
              }`}
            >
              <span className="text-[clamp(1.35rem,4.6vmin,2.35rem)] leading-none font-black">
                {finish.points}
              </span>
              <span className="mt-1 text-[0.65rem] font-black tracking-[0.18em] uppercase sm:text-xs">
                {finish.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RulesSheet({
  winScore,
  onChangeWinScore,
  onClose,
}: {
  winScore: WinScore;
  onChangeWinScore: (value: WinScore) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/70 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] landscape:items-center">
      <button
        type="button"
        aria-label="Close rules"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative max-h-full w-full max-w-lg overflow-y-auto rounded-3xl bg-neutral-950 p-5 text-white shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-[0.28em] text-white/50 uppercase">
              Beyblade X
            </p>
            <h2 className="text-2xl font-black">Official scoring</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full bg-white/10"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-white/70">
          First player to the target points wins the match. Standard 1v1 is
          first to 4. Simultaneous finishes are a draw and the battle is
          replayed. If a Bey returns from the Over or Xtreme zone (a reverse),
          that finish is cancelled.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl bg-white/5">
          {FINISHES.map((finish) => (
            <div
              key={finish.id}
              className="flex gap-3 border-b border-white/10 px-3 py-3 last:border-b-0"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-black">
                {finish.points}
              </div>
              <div>
                <p className="font-black">
                  {finish.label}{" "}
                  <span className="font-semibold text-white/45">
                    / {finish.hasbro}
                  </span>
                </p>
                <p className="text-sm leading-snug text-white/65">
                  {finish.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-white/65">
          Two launching errors, premature launches, or delayed launches in the
          same battle award{" "}
          <span className="font-bold text-white">1 point</span> to the opponent
          (use Spin). Out-of-bounds exits that are not Over or Xtreme are
          usually a replay.
        </p>

        <p className="mt-5 text-xs font-black tracking-[0.24em] text-white/50 uppercase">
          First to
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {WIN_SCORE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChangeWinScore(option)}
              className={`min-h-12 rounded-2xl text-lg font-black ${
                option === winScore ? "bg-yellow-400 text-black" : "bg-white/10"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-white/55">{WIN_SCORE_HINT[winScore]}</p>
      </div>
    </div>
  );
}
