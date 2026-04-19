import { Redo, Undo } from "lucide-react";
import { useState } from "react";

const WIN_SCORE = 4;
const SCORE_LIMIT = 10;

export default function App() {
  const [history, setHistory] = useState([{ red: 0, blue: 0 }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentScore = history[currentIndex];

  const handleScore = (player: "red" | "blue") => {
    if (currentScore[player] >= SCORE_LIMIT) return;

    const nextScore = { ...currentScore, [player]: currentScore[player] + 1 };
    const newHistory = history.slice(0, currentIndex + 1);

    setHistory([...newHistory, nextScore]);
    setCurrentIndex(newHistory.length);
  };

  const undo = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const redo = () =>
    setCurrentIndex((prev) => Math.min(history.length - 1, prev + 1));
  const reset = () => {
    setHistory([{ red: 0, blue: 0 }]);
    setCurrentIndex(0);
  };

  return (
    <div className="flex h-screen w-screen touch-manipulation overflow-hidden select-none">
      <div
        onClick={() => handleScore("red")}
        className="flex flex-1 cursor-pointer items-center justify-center bg-pink-600 transition-colors active:bg-pink-700"
      >
        <span className="text-[30vw] leading-none font-bold tracking-tighter text-white landscape:pb-[5vw]">
          {currentScore.red}
        </span>
      </div>

      <div
        onClick={() => handleScore("blue")}
        className="flex flex-1 cursor-pointer items-center justify-center bg-blue-600 transition-colors active:bg-blue-700"
      >
        <span className="text-[30vw] leading-none font-bold tracking-tighter text-white landscape:pb-[5vw]">
          {currentScore.blue}
        </span>
      </div>

      <div className="pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center mix-blend-color-burn">
        <span className="text-[40vw] leading-none font-black text-white/15 font-stretch-ultra-expanded drop-shadow-[0_0_2vh_rgba(0,0,0,0.8)] landscape:pb-[5vw]">
          X
        </span>
      </div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-4 rounded-full bg-black/50 p-3 backdrop-blur-sm">
        <button
          onClick={undo}
          disabled={currentIndex === 0}
          className="px-4 text-xl text-white disabled:opacity-30"
        >
          <Undo className="size-8 stroke-2" />
        </button>
        <button onClick={reset} className="px-4 text-xl font-bold text-white">
          RESET
        </button>
        <button
          onClick={redo}
          disabled={currentIndex === history.length - 1}
          className="px-4 text-xl text-white disabled:opacity-30"
        >
          <Redo className="size-8 stroke-2" />
        </button>
      </div>

      {(currentScore.red >= WIN_SCORE || currentScore.blue >= WIN_SCORE) && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 animate-bounce rounded-full bg-yellow-400 px-6 py-2 text-xl font-bold text-black">
          {currentScore.red >= WIN_SCORE ? "RED WINS!" : "BLUE WINS!"}
        </div>
      )}
    </div>
  );
}
