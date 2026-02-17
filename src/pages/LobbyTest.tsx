import { useMultiplayerSync } from "@/hooks/useMultiplayerSync";
import MultiplayerLobby from "@/components/MultiplayerLobby";
import { useNavigate } from "react-router-dom";

const LobbyTest = () => {
  const navigate = useNavigate();
  const mp = useMultiplayerSync();

  if (mp.status === "connected") {
    return (
      <div className="min-h-screen wood-texture flex flex-col items-center justify-center p-4">
        <div className="bg-card/60 border-2 border-gold rounded-xl p-8 text-center max-w-sm">
          <p className="text-accent text-2xl mb-2">✅ متصل!</p>
          <p className="text-foreground text-sm mb-1">الدور: {mp.role === "host" ? "المضيف" : "الضيف"}</p>
          <p className="text-muted-foreground text-xs mb-4">الاتصال يعمل بنجاح عبر WebRTC</p>
          <button
            onClick={mp.disconnect}
            className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold"
          >
            قطع الاتصال
          </button>
        </div>
      </div>
    );
  }

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
      onBack={() => navigate("/")}
      gameName="اختبار"
    />
  );
};

export default LobbyTest;
