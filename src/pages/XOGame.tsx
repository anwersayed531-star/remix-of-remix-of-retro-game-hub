import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Cell = string | null;
type Mode = "local" | "ai";
type Difficulty = "easy" | "medium" | "hard";

const SYMBOL_SETS: Record<string, [string, string]> = {
  classic: ["✕", "◯"],
  emoji: ["😎", "🤖"],
  hearts: ["❤️", "💙"],
  stars: ["⭐", "🌙"],
  animals: ["🐱", "🐶"],
};

const XOGame = () => {
  const navigate = useNavigate();
  const [gridSize, setGridSize] = useState(3);
  const [symbolSet, setSymbolSet] = useState("classic");
  const [mode, setMode] = useState<Mode>("local");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scores, setScores] = useState({ x: 0, o: 0, draw: 0 });

  const symbols = SYMBOL_SETS[symbolSet];
  const totalCells = gridSize * gridSize;
  const winLength = gridSize >= 5 ? 4 : 3;

  const resetBoard = useCallback(() => {
    setBoard(Array(totalCells).fill(null));
    setIsXTurn(true);
    setWinner(null);
    setWinLine(null);
  }, [totalCells]);

  useEffect(() => {
    resetBoard();
  }, [gridSize, resetBoard]);

  const checkWinner = useCallback((b: Cell[]): { winner: string | null; line: number[] | null } => {
    const lines: number[][] = [];

    // Rows
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c <= gridSize - winLength; c++) {
        lines.push(Array.from({ length: winLength }, (_, i) => r * gridSize + c + i));
      }
    }
    // Cols
    for (let c = 0; c < gridSize; c++) {
      for (let r = 0; r <= gridSize - winLength; r++) {
        lines.push(Array.from({ length: winLength }, (_, i) => (r + i) * gridSize + c));
      }
    }
    // Diag ↘
    for (let r = 0; r <= gridSize - winLength; r++) {
      for (let c = 0; c <= gridSize - winLength; c++) {
        lines.push(Array.from({ length: winLength }, (_, i) => (r + i) * gridSize + (c + i)));
      }
    }
    // Diag ↙
    for (let r = 0; r <= gridSize - winLength; r++) {
      for (let c = winLength - 1; c < gridSize; c++) {
        lines.push(Array.from({ length: winLength }, (_, i) => (r + i) * gridSize + (c - i)));
      }
    }

    for (const line of lines) {
      const first = b[line[0]];
      if (first && line.every((idx) => b[idx] === first)) {
        return { winner: first, line };
      }
    }

    if (b.every((c) => c !== null)) return { winner: "draw", line: null };
    return { winner: null, line: null };
  }, [gridSize, winLength]);

  const aiMove = useCallback((b: Cell[]): number => {
    const empty = b.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
    if (empty.length === 0) return -1;

    if (difficulty === "easy") {
      return empty[Math.floor(Math.random() * empty.length)];
    }

    // Try to win
    for (const i of empty) {
      const test = [...b];
      test[i] = "O";
      if (checkWinner(test).winner === "O") return i;
    }
    // Try to block
    for (const i of empty) {
      const test = [...b];
      test[i] = "X";
      if (checkWinner(test).winner === "X") return i;
    }

    if (difficulty === "hard") {
      // Center
      const center = Math.floor(totalCells / 2);
      if (b[center] === null) return center;
      // Corners
      const corners = [0, gridSize - 1, totalCells - gridSize, totalCells - 1].filter((i) => b[i] === null);
      if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    }

    return empty[Math.floor(Math.random() * empty.length)];
  }, [difficulty, checkWinner, gridSize, totalCells]);

  const handleClick = useCallback((index: number) => {
    if (board[index] || winner) return;
    if (mode === "ai" && !isXTurn) return;

    const newBoard = [...board];
    newBoard[index] = isXTurn ? "X" : "O";
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinner(result.winner);
      setWinLine(result.line);
      if (result.winner === "X") setScores((s) => ({ ...s, x: s.x + 1 }));
      else if (result.winner === "O") setScores((s) => ({ ...s, o: s.o + 1 }));
      else setScores((s) => ({ ...s, draw: s.draw + 1 }));
      return;
    }

    if (mode === "ai" && isXTurn) {
      setIsXTurn(false);
      setTimeout(() => {
        const aiIdx = aiMove(newBoard);
        if (aiIdx >= 0) {
          const aiBoard = [...newBoard];
          aiBoard[aiIdx] = "O";
          setBoard(aiBoard);
          const aiResult = checkWinner(aiBoard);
          if (aiResult.winner) {
            setWinner(aiResult.winner);
            setWinLine(aiResult.line);
            if (aiResult.winner === "O") setScores((s) => ({ ...s, o: s.o + 1 }));
            else if (aiResult.winner === "draw") setScores((s) => ({ ...s, draw: s.draw + 1 }));
          } else {
            setIsXTurn(true);
          }
        }
      }, 400);
    } else {
      setIsXTurn(!isXTurn);
    }
  }, [board, winner, isXTurn, mode, checkWinner, aiMove]);

  const cellSize = gridSize <= 3 ? "w-20 h-20 sm:w-24 sm:h-24 text-3xl sm:text-4xl" :
    gridSize <= 4 ? "w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl" :
      "w-12 h-12 sm:w-16 sm:h-16 text-xl sm:text-2xl";

  return (
    <div className="min-h-screen wood-texture flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-6">
        <button onClick={() => navigate("/")} className="p-2 rounded-full bg-secondary/80 hover:bg-secondary border border-gold">
          <ArrowLeft className="w-5 h-5 text-gold" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gold" style={{ fontFamily: "'Cinzel', serif" }}>
          ❌⭕ XO
        </h1>
        <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-full bg-secondary/80 hover:bg-secondary border border-gold">
          <Settings2 className="w-5 h-5 text-gold" />
        </button>
      </div>

      {/* Scores */}
      <div className="flex gap-6 mb-4 text-sm">
        <div className="text-center">
          <span className="text-red-400 font-bold text-lg">{scores.x}</span>
          <p className="text-muted-foreground text-xs">{symbols[0]} {mode === "ai" ? "أنت" : "لاعب 1"}</p>
        </div>
        <div className="text-center">
          <span className="text-muted-foreground font-bold text-lg">{scores.draw}</span>
          <p className="text-muted-foreground text-xs">تعادل</p>
        </div>
        <div className="text-center">
          <span className="text-blue-400 font-bold text-lg">{scores.o}</span>
          <p className="text-muted-foreground text-xs">{symbols[1]} {mode === "ai" ? "الكمبيوتر" : "لاعب 2"}</p>
        </div>
      </div>

      {/* Turn indicator */}
      {!winner && (
        <p className="text-foreground mb-4 text-sm animate-pulse">
          دور: {isXTurn ? symbols[0] : symbols[1]} {mode === "ai" && !isXTurn ? "(يفكر...)" : ""}
        </p>
      )}

      {/* Winner */}
      {winner && (
        <div className="mb-4 text-center animate-scale-in">
          {winner === "draw" ? (
            <p className="text-xl font-bold text-gold">🤝 تعادل!</p>
          ) : (
            <p className="text-xl font-bold text-gold">
              🎉 فاز {winner === "X" ? symbols[0] : symbols[1]}!
            </p>
          )}
        </div>
      )}

      {/* Board */}
      <div
        className="grid gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl bg-secondary/50 border-2 border-gold"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {board.map((cell, i) => {
          const isWinCell = winLine?.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={!!cell || !!winner || (mode === "ai" && !isXTurn)}
              className={`${cellSize} rounded-lg border transition-all duration-200 font-bold flex items-center justify-center
                ${cell ? "cursor-default" : "cursor-pointer hover:bg-accent/20"}
                ${isWinCell ? "bg-gold/20 border-gold scale-105" : "bg-card/60 border-border"}
                ${cell === "X" ? "text-red-400" : "text-blue-400"}
              `}
            >
              {cell === "X" ? symbols[0] : cell === "O" ? symbols[1] : ""}
            </button>
          );
        })}
      </div>

      {/* Reset */}
      <Button onClick={resetBoard} variant="outline" className="mt-6 border-gold text-gold hover:bg-gold/10">
        <RotateCcw className="w-4 h-4 mr-2" /> جولة جديدة
      </Button>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="wood-texture border-2 border-gold max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-gold text-center" style={{ fontFamily: "'Cinzel', serif" }}>
              إعدادات XO
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Mode */}
            <div>
              <label className="text-foreground text-sm mb-2 block">وضع اللعب</label>
              <Select value={mode} onValueChange={(v: Mode) => { setMode(v); resetBoard(); }}>
                <SelectTrigger className="bg-card/60 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">لاعبين محليين</SelectItem>
                  <SelectItem value="ai">ضد الكمبيوتر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            {mode === "ai" && (
              <div>
                <label className="text-foreground text-sm mb-2 block">مستوى الصعوبة</label>
                <Select value={difficulty} onValueChange={(v: Difficulty) => { setDifficulty(v); resetBoard(); }}>
                  <SelectTrigger className="bg-card/60 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">سهل</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="hard">صعب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Grid Size */}
            <div>
              <label className="text-foreground text-sm mb-2 block">حجم الشبكة</label>
              <Select value={String(gridSize)} onValueChange={(v) => setGridSize(Number(v))}>
                <SelectTrigger className="bg-card/60 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 × 3</SelectItem>
                  <SelectItem value="4">4 × 4</SelectItem>
                  <SelectItem value="5">5 × 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Symbols */}
            <div>
              <label className="text-foreground text-sm mb-2 block">شكل الرموز</label>
              <Select value={symbolSet} onValueChange={setSymbolSet}>
                <SelectTrigger className="bg-card/60 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">كلاسيكي ✕ ◯</SelectItem>
                  <SelectItem value="emoji">إيموجي 😎 🤖</SelectItem>
                  <SelectItem value="hearts">قلوب ❤️ 💙</SelectItem>
                  <SelectItem value="stars">نجوم ⭐ 🌙</SelectItem>
                  <SelectItem value="animals">حيوانات 🐱 🐶</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default XOGame;
