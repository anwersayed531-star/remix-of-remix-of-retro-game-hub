import { useState, useRef, useCallback, useEffect } from "react";

export type ConnectionStatus = "idle" | "creating" | "waiting" | "connecting" | "connected" | "failed";
export type Role = "host" | "guest" | null;

interface UseP2PConnectionReturn {
  status: ConnectionStatus;
  role: Role;
  localCode: string;
  error: string | null;
  createRoom: () => Promise<void>;
  joinRoom: (offerCode: string) => Promise<void>;
  completeConnection: (answerCode: string) => Promise<void>;
  sendMessage: (data: any) => void;
  onMessage: (handler: (data: any) => void) => void;
  disconnect: () => void;
}

// Compress SDP to shorter code
function compressSDP(sdp: RTCSessionDescriptionInit): string {
  return btoa(JSON.stringify(sdp))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decompressSDP(code: string): RTCSessionDescriptionInit {
  const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return JSON.parse(atob(padded));
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    // Local network usually works without STUN, but add as fallback
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

export function useP2PConnection(): UseP2PConnectionReturn {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [role, setRole] = useState<Role>(null);
  const [localCode, setLocalCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const messageHandlerRef = useRef<((data: any) => void) | null>(null);
  const iceCandidatesRef = useRef<RTCIceCandidate[]>([]);

  const cleanup = useCallback(() => {
    dcRef.current?.close();
    pcRef.current?.close();
    dcRef.current = null;
    pcRef.current = null;
    iceCandidatesRef.current = [];
  }, []);

  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    dcRef.current = channel;
    channel.onopen = () => setStatus("connected");
    channel.onclose = () => {
      setStatus("idle");
      cleanup();
    };
    channel.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        messageHandlerRef.current?.(data);
      } catch {
        // ignore non-JSON messages
      }
    };
  }, [cleanup]);

  const createPC = useCallback(() => {
    cleanup();
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        iceCandidatesRef.current.push(e.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setStatus("failed");
        setError("انقطع الاتصال");
      }
    };

    return pc;
  }, [cleanup]);

  // Wait for ICE gathering to complete
  const waitForICE = useCallback((pc: RTCPeerConnection): Promise<void> => {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") {
        resolve();
        return;
      }
      const check = () => {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", check);
          resolve();
        }
      };
      pc.addEventListener("icegatheringstatechange", check);
      // Timeout after 5 seconds
      setTimeout(resolve, 5000);
    });
  }, []);

  const createRoom = useCallback(async () => {
    try {
      setStatus("creating");
      setError(null);
      const pc = createPC();

      const channel = pc.createDataChannel("game", { ordered: true });
      setupDataChannel(channel);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForICE(pc);

      const fullOffer = pc.localDescription!;
      setLocalCode(compressSDP(fullOffer));
      setRole("host");
      setStatus("waiting");
    } catch (err) {
      setStatus("failed");
      setError("فشل في إنشاء الغرفة");
    }
  }, [createPC, setupDataChannel, waitForICE]);

  const joinRoom = useCallback(async (offerCode: string) => {
    try {
      setStatus("connecting");
      setError(null);
      const pc = createPC();

      pc.ondatachannel = (e) => setupDataChannel(e.channel);

      const offer = decompressSDP(offerCode.trim());
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForICE(pc);

      const fullAnswer = pc.localDescription!;
      setLocalCode(compressSDP(fullAnswer));
      setRole("guest");
      setStatus("waiting");
    } catch (err) {
      setStatus("failed");
      setError("رمز الغرفة غير صالح");
    }
  }, [createPC, setupDataChannel, waitForICE]);

  const completeConnection = useCallback(async (answerCode: string) => {
    try {
      setStatus("connecting");
      const pc = pcRef.current;
      if (!pc) throw new Error("No connection");

      const answer = decompressSDP(answerCode.trim());
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      setStatus("failed");
      setError("فشل في إتمام الاتصال");
    }
  }, []);

  const sendMessage = useCallback((data: any) => {
    if (dcRef.current?.readyState === "open") {
      dcRef.current.send(JSON.stringify(data));
    }
  }, []);

  const onMessage = useCallback((handler: (data: any) => void) => {
    messageHandlerRef.current = handler;
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus("idle");
    setRole(null);
    setLocalCode("");
    setError(null);
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    status,
    role,
    localCode,
    error,
    createRoom,
    joinRoom,
    completeConnection,
    sendMessage,
    onMessage,
    disconnect,
  };
}
