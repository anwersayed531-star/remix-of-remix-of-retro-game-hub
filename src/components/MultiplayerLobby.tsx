import { useState } from "react";
import { Wifi, Copy, Check, ArrowLeft, Loader2, WifiOff, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionStatus, Role } from "@/hooks/useP2PConnection";

interface MultiplayerLobbyProps {
  status: ConnectionStatus;
  role: Role;
  localCode: string;
  error: string | null;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onCompleteConnection: (code: string) => void;
  onDisconnect: () => void;
  onBack: () => void;
  gameName: string;
}

const MultiplayerLobby = ({
  status,
  role,
  localCode,
  error,
  onCreateRoom,
  onJoinRoom,
  onCompleteConnection,
  onDisconnect,
  onBack,
  gameName,
}: MultiplayerLobbyProps) => {
  const [remoteCode, setRemoteCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text for manual copy
      const textarea = document.createElement("textarea");
      textarea.value = localCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitCode = () => {
    if (!remoteCode.trim()) return;
    if (role === null) {
      onJoinRoom(remoteCode);
    } else if (role === "host") {
      onCompleteConnection(remoteCode);
    }
    setRemoteCode("");
  };

  // Connected state
  if (status === "connected") {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="flex items-center gap-2 text-accent">
          <Wifi className="w-6 h-6" />
          <span className="text-lg font-bold">متصل!</span>
        </div>
        <p className="text-muted-foreground text-sm text-center">
          أنت {role === "host" ? "المضيف" : "الضيف"} — اللعبة جاهزة
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onDisconnect}
          className="border-destructive text-destructive hover:bg-destructive/10"
        >
          قطع الاتصال
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen wood-texture flex flex-col items-center p-4 pt-6">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-secondary/80 hover:bg-secondary border border-gold"
        >
          <ArrowLeft className="w-5 h-5 text-gold" />
        </button>
        <h1
          className="text-xl font-bold text-gold"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <Smartphone className="w-5 h-5 inline-block ml-2" />
          {gameName} — شبكة محلية
        </h1>
        <div className="w-9" />
      </div>

      <div className="w-full max-w-md space-y-4">
        {/* Error */}
        {error && (
          <div className="bg-destructive/20 border border-destructive/40 rounded-lg p-3 text-center">
            <WifiOff className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Idle: choose action */}
        {status === "idle" && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm text-center">
              تأكد أن الجهازين على نفس شبكة الواي فاي
            </p>

            <Button
              onClick={onCreateRoom}
              className="w-full h-14 text-lg gold-gradient text-background font-bold rounded-xl"
            >
              <Wifi className="w-5 h-5 ml-2" />
              إنشاء غرفة
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative bg-background px-3 text-muted-foreground text-xs">
                أو
              </span>
            </div>

            <div className="space-y-2">
              <textarea
                value={remoteCode}
                onChange={(e) => setRemoteCode(e.target.value)}
                placeholder="الصق رمز الغرفة هنا..."
                className="w-full h-24 bg-card/60 border border-border rounded-xl p-3 text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                dir="ltr"
              />
              <Button
                onClick={handleSubmitCode}
                disabled={!remoteCode.trim()}
                className="w-full h-12 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl"
              >
                انضمام للغرفة
              </Button>
            </div>
          </div>
        )}

        {/* Creating */}
        {status === "creating" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
            <p className="text-muted-foreground text-sm">جاري إنشاء الغرفة...</p>
          </div>
        )}

        {/* Waiting: show local code */}
        {status === "waiting" && localCode && (
          <div className="space-y-4">
            <div className="bg-card/60 border border-gold/30 rounded-xl p-4">
              <p className="text-gold text-sm font-bold mb-2 text-center">
                {role === "host"
                  ? "١. أرسل هذا الرمز للاعب الثاني:"
                  : "١. أرسل هذا الرمز للاعب الأول:"}
              </p>
              <div className="relative">
                <textarea
                  readOnly
                  value={localCode}
                  className="w-full h-20 bg-background/60 border border-border rounded-lg p-2 text-foreground text-xs font-mono resize-none"
                  dir="ltr"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={handleCopy}
                  className="absolute top-2 left-2 p-1.5 rounded-md bg-secondary/80 hover:bg-secondary border border-gold/30"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-accent" />
                  ) : (
                    <Copy className="w-4 h-4 text-gold" />
                  )}
                </button>
              </div>
            </div>

            {role === "host" && (
              <div className="bg-card/60 border border-border rounded-xl p-4 space-y-2">
                <p className="text-foreground text-sm font-bold text-center">
                  ٢. الصق رمز اللاعب الثاني هنا:
                </p>
                <textarea
                  value={remoteCode}
                  onChange={(e) => setRemoteCode(e.target.value)}
                  placeholder="الصق رمز الرد هنا..."
                  className="w-full h-20 bg-background/60 border border-border rounded-lg p-2 text-foreground text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  dir="ltr"
                />
                <Button
                  onClick={handleSubmitCode}
                  disabled={!remoteCode.trim()}
                  className="w-full h-12 gold-gradient text-background font-bold rounded-xl"
                >
                  اتصال
                </Button>
              </div>
            )}

            {role === "guest" && (
              <div className="flex items-center gap-2 justify-center text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">في انتظار المضيف...</span>
              </div>
            )}
          </div>
        )}

        {/* Connecting */}
        {status === "connecting" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
            <p className="text-muted-foreground text-sm">جاري الاتصال...</p>
          </div>
        )}

        {/* Failed */}
        {status === "failed" && (
          <div className="space-y-3 text-center py-4">
            <Button
              onClick={() => {
                onDisconnect();
              }}
              variant="outline"
              className="border-gold text-gold hover:bg-gold/10"
            >
              حاول مرة أخرى
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplayerLobby;
