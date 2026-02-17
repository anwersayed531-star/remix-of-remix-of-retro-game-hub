import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Chess } from "chess.js";
import { ArrowLeft, RotateCcw, Settings2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { findBestMove } from "@/lib/chessAI";
import MultiplayerLobby from "@/components/MultiplayerLobby";
import { useMultiplayerSync } from "@/hooks/useMultiplayerSync";

type Mode = "local" | "ai" | "network";
type Difficulty = "easy" | "medium" | "hard";
type BoardTheme = "wood" | "marble" | "plain";

const THEMES: Record<BoardTheme, { light: string; dark: string; name: string }> = {
  wood: { light: "#d4a76a", dark: "#8b5e3c", name: "خشبي" },
  marble: { light: "#d0d0d0", dark: "#707070", name: "رخامي" },
  plain: { light: "#f0d9b5", dark: "#b58863", name: "كلاسيكي" },
};

const PIECES: Record<string, Record<string, string>> = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

const PROMO_PIECES = ["q", "r", "b", "n"] as const;

const ChessGame = () => {
  const navigate = useNavigate();
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(chessRef.current.fen());
  const [selected, setSelected] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [mode, setMode] = useState<Mode>("local");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [theme, setTheme] = useState<BoardTheme>("wood");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [promoDialog, setPromoDialog] = useState<{ from: string; to: string } | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  const mp = useMultiplayerSync();

  const chess = chessRef.current;
  const board = chess.board();
  const turn = chess.turn();
  const isCheck = chess.isCheck();
  const isCheckmate = chess.isCheckmate();
  const isStalemate = chess.isStalemate();
  const isDraw = chess.isDraw();
  const isGameOver = chess.isGameOver();

  const isNetworkMode = mode === "network" && mp.status === "connected";
  // host=white, guest=black
  const myColor = mp.role === "host" ? "w" : "b";
  const isMyTurn = isNetworkMode ? turn === myColor : true;

  const sync = useCallback(() => setFen(chess.fen()), [chess]);

  const resetGame = useCallback(() => {
    chess.reset();
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setPromoDialog(null);
    setAiThinking(false);
    sync();
  }, [chess, sync]);

  // Listen for remote moves
  useEffect(() => {
    if (!isNetworkMode) return;
    mp.onAction((action: { from: string; to: string; promotion?: string }) => {
      const result = chess.move(action);
      if (result) {
        setLastMove({ from: result.from, to: result.to });
        setSelected(null);
        setLegalMoves([]);
        sync();
      }
    });
    mp.onReset(() => {
      resetGame();
    });
  }, [isNetworkMode, mp, chess, sync, resetGame]);

  const handleSquareClick = useCallback((sq: string) => {
    if (isGameOver || aiThinking) return;
    if (mode === "ai" && turn === "b") return;
    if (isNetworkMode && !isMyTurn) return;

    if (selected) {
      const moves = chess.moves({ square: selected as any, verbose: true }) as any[];
      const matchingMoves = moves.filter((m: any) => m.to === sq);
      
      if (matchingMoves.length > 0) {
        if (matchingMoves.some((m: any) => m.promotion)) {
          setPromoDialog({ from: selected, to: sq });
          return;
        }
        const result = chess.move({ from: selected, to: sq });
        if (result) {
          setLastMove({ from: selected, to: sq });
          if (isNetworkMode) {
            mp.sendAction({ from: selected, to: sq });
          }
        }
        setSelected(null);
        setLegalMoves([]);
        sync();
        return;
      }
    }

    const piece = chess.get(sq as any);
    if (piece && piece.color === turn) {
      if (isNetworkMode && piece.color !== myColor) return;
      setSelected(sq);
      const moves = chess.moves({ square: sq as any, verbose: true }) as any[];
      setLegalMoves([...new Set(moves.map((m: any) => m.to))]);
    } else {
      setSelected(null);
      setLegalMoves([]);
    }
  }, [selected, chess, turn, isGameOver, mode, aiThinking, sync, isNetworkMode, isMyTurn, myColor, mp]);

  const handlePromotion = useCallback((piece: string) => {
    if (!promoDialog) return;
    const result = chess.move({ from: promoDialog.from, to: promoDialog.to, promotion: piece });
    if (result) {
      setLastMove({ from: promoDialog.from, to: promoDialog.to });
      if (isNetworkMode) {
        mp.sendAction({ from: promoDialog.from, to: promoDialog.to, promotion: piece });
      }
    }
    setPromoDialog(null);
    setSelected(null);
    setLegalMoves([]);
    sync();
  }, [promoDialog, chess, sync, isNetworkMode, mp]);

  const handleUndo = useCallback(() => {
    if (isNetworkMode) return; // No undo in network mode
    if (mode === "ai") { chess.undo(); chess.undo(); }
    else chess.undo();
    setSelected(null);
    setLegalMoves([]);
    sync();
  }, [chess, mode, sync, isNetworkMode]);

  const handleNetworkReset = useCallback(() => {
    resetGame();
    if (isNetworkMode) {
      mp.sendReset();
    }
  }, [resetGame, isNetworkMode, mp]);

  // AI move
  useEffect(() => {
    if (mode !== "ai" || turn !== "b" || isGameOver) return;
    setAiThinking(true);
    const timeout = setTimeout(() => {
      const move = findBestMove(chess, difficulty);
      if (move) {
        const result = chess.move(move);
        if (result) setLastMove({ from: result.from, to: result.to });
      }
      setAiThinking(false);
      sync();
    }, 500);
    return () => clearTimeout(timeout);
  }, [fen, mode, turn, isGameOver, chess, difficulty, sync]);

  // Show lobby if network mode and not connected
  if (mode === "network" && mp.status !== "connected") {
    return (
      <MultiplayerLobby
        status={mp.status}
        role={mp.role}
        localCode={mp.localCode}
        error={mp.error}
        onCreateRoom={mp.createRoom}
        onJoinRoom={mp.joinRoom}
        onCompleteConnection={mp.completeConnection}
        onDisconnect={mp.disconnect}
        onBack={() => setMode("local")}
        gameName="شطرنج"
      />
    );
  }

  const getSquareName = (r: number, c: number) => `${String.fromCharCode(97 + c)}${8 - r}`;
  const themeColors = THEMES[theme];

  const statusText = isCheckmate
    ? `🏆 كش مات! فاز ${turn === "w" ? "الأسود" : "الأبيض"}`
    : isStalemate ? "🤝 تعادل - لا حركات متاحة"
    : isDraw ? "🤝 تعادل"
    : isCheck ? `⚠️ كش! دور ${turn === "w" ? "الأبيض" : "الأسود"}`
    : isNetworkMode
      ? (isMyTurn ? "دورك" : "دور الخصم")
      : `دور ${turn === "w" ? "الأبيض" : "الأسود"}${aiThinking ? " (يفكر...)" : ""}`;

  return (
    <div className="min-h-screen wood-texture flex flex-col items-center p-4">
      <div className="w-full max-w-lg flex items-center justify-between mb-4">
        <button onClick={() => navigate("/")} className="p-2 rounded-full bg-secondary/80 hover:bg-secondary border border-gold">
          <ArrowLeft className="w-5 h-5 text-gold" />
        </button>
        <h1 className="text-2xl font-bold text-gold" style={{ fontFamily: "'Cinzel', serif" }}>♟️ شطرنج</h1>
        <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-full bg-secondary/80 hover:bg-secondary border border-gold">
          <Settings2 className="w-5 h-5 text-gold" />
        </button>
      </div>

      {/* Network indicator */}
      {isNetworkMode && (
        <div className="flex items-center gap-2 mb-1 text-accent text-xs">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          متصل — أنت {mp.role === "host" ? "الأبيض" : "الأسود"}
        </div>
      )}

      <p className="text-foreground text-sm mb-3">{statusText}</p>

      {/* Board */}
      <div className="border-4 border-gold rounded-lg overflow-hidden shadow-2xl">
        <div className="grid grid-cols-8" style={{ width: "min(88vw, 400px)", height: "min(88vw, 400px)" }}>
          {Array.from({ length: 64 }, (_, i) => {
            const r = Math.floor(i / 8);
            const c = i % 8;
            const sq = getSquareName(r, c);
            const isLight = (r + c) % 2 === 0;
            const piece = board[r][c];
            const isSelected = selected === sq;
            const isLegal = legalMoves.includes(sq);
            const isLast = lastMove?.from === sq || lastMove?.to === sq;
            const isKingCheck = isCheck && piece?.type === "k" && piece?.color === turn;

            return (
              <button
                key={i}
                onClick={() => handleSquareClick(sq)}
                className="relative flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isKingCheck ? "hsl(0 70% 50%)"
                    : isSelected ? "hsl(50 80% 55%)"
                    : isLast ? "hsl(50 60% 65%)"
                    : isLight ? themeColors.light : themeColors.dark,
                  aspectRatio: "1",
                }}
              >
                {isLegal && !piece && (
                  <div className="w-3 h-3 rounded-full bg-black/25" />
                )}
                {isLegal && piece && (
                  <div className="absolute inset-0 border-4 border-black/25 rounded-sm" />
                )}
                {piece && (
                  <span
                    className="select-none"
                    style={{
                      fontSize: "min(6vw, 32px)",
                      textShadow: piece.color === "w" ? "1px 1px 2px rgba(0,0,0,0.5)" : "1px 1px 2px rgba(255,255,255,0.3)",
                      color: piece.color === "w" ? "#fff" : "#1a1a1a",
                      filter: piece.color === "w" ? "drop-shadow(0 1px 1px rgba(0,0,0,0.4))" : "drop-shadow(0 1px 1px rgba(255,255,255,0.2))",
                    }}
                  >
                    {PIECES[piece.color][piece.type]}
                  </span>
                )}
                {r === 7 && <span className="absolute bottom-0 left-0.5 text-[8px] opacity-40">{String.fromCharCode(97 + c)}</span>}
                {c === 0 && <span className="absolute top-0 left-0.5 text-[8px] opacity-40">{8 - r}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mt-4">
        <Button onClick={handleNetworkReset} variant="outline" size="sm" className="border-gold text-gold hover:bg-gold/10">
          <RotateCcw className="w-4 h-4 mr-1" /> جديدة
        </Button>
        {!isNetworkMode && (
          <Button onClick={handleUndo} variant="outline" size="sm" className="border-gold text-gold hover:bg-gold/10" disabled={chess.history().length === 0}>
            <Undo2 className="w-4 h-4 mr-1" /> تراجع
          </Button>
        )}
      </div>

      {/* Promotion Dialog */}
      <Dialog open={!!promoDialog} onOpenChange={() => setPromoDialog(null)}>
        <DialogContent className="wood-texture border-2 border-gold max-w-xs">
          <DialogHeader><DialogTitle className="text-gold text-center">ترقية البيدق</DialogTitle></DialogHeader>
          <div className="flex justify-center gap-4 py-4">
            {PROMO_PIECES.map((p) => (
              <button
                key={p}
                onClick={() => handlePromotion(p)}
                className="text-4xl p-2 rounded-lg hover:bg-gold/20 transition-colors"
              >
                {PIECES[turn][p]}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="wood-texture border-2 border-gold max-w-sm">
          <DialogHeader><DialogTitle className="text-gold text-center" style={{ fontFamily: "'Cinzel', serif" }}>إعدادات الشطرنج</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-foreground text-sm mb-2 block">وضع اللعب</label>
              <Select value={mode} onValueChange={(v: Mode) => { setMode(v); resetGame(); }}>
                <SelectTrigger className="bg-card/60 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">لاعبين محليين</SelectItem>
                  <SelectItem value="ai">ضد الكمبيوتر</SelectItem>
                  <SelectItem value="network">عبر الشبكة 📶</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mode === "ai" && (
              <div>
                <label className="text-foreground text-sm mb-2 block">مستوى الصعوبة</label>
                <Select value={difficulty} onValueChange={(v: Difficulty) => { setDifficulty(v); resetGame(); }}>
                  <SelectTrigger className="bg-card/60 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">سهل</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="hard">صعب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-foreground text-sm mb-2 block">نمط الرقعة</label>
              <Select value={theme} onValueChange={(v: BoardTheme) => setTheme(v)}>
                <SelectTrigger className="bg-card/60 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wood">خشبي</SelectItem>
                  <SelectItem value="marble">رخامي</SelectItem>
                  <SelectItem value="plain">كلاسيكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChessGame;
