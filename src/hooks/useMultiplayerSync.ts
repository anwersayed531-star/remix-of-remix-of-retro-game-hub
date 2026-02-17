import { useCallback, useEffect, useRef } from "react";
import { useP2PConnection, Role, ConnectionStatus } from "./useP2PConnection";

interface GameMessage {
  type: "state" | "action" | "reset" | "ping" | "pong";
  payload?: any;
  timestamp: number;
}

interface UseMultiplayerSyncReturn {
  // Connection
  status: ConnectionStatus;
  role: Role;
  localCode: string;
  error: string | null;
  createRoom: () => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  completeConnection: (code: string) => Promise<void>;
  disconnect: () => void;
  // Game sync
  sendGameState: (state: any) => void;
  sendAction: (action: any) => void;
  sendReset: () => void;
  onGameState: (handler: (state: any) => void) => void;
  onAction: (handler: (action: any) => void) => void;
  onReset: (handler: () => void) => void;
  isMyTurn: (currentTurn: string, hostValue: string, guestValue: string) => boolean;
}

export function useMultiplayerSync(): UseMultiplayerSyncReturn {
  const p2p = useP2PConnection();

  const gameStateHandlerRef = useRef<((state: any) => void) | null>(null);
  const actionHandlerRef = useRef<((action: any) => void) | null>(null);
  const resetHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    p2p.onMessage((msg: GameMessage) => {
      switch (msg.type) {
        case "state":
          gameStateHandlerRef.current?.(msg.payload);
          break;
        case "action":
          actionHandlerRef.current?.(msg.payload);
          break;
        case "reset":
          resetHandlerRef.current?.();
          break;
        case "ping":
          p2p.sendMessage({ type: "pong", timestamp: Date.now() });
          break;
      }
    });
  }, [p2p]);

  const sendGameState = useCallback((state: any) => {
    p2p.sendMessage({ type: "state", payload: state, timestamp: Date.now() });
  }, [p2p]);

  const sendAction = useCallback((action: any) => {
    p2p.sendMessage({ type: "action", payload: action, timestamp: Date.now() });
  }, [p2p]);

  const sendReset = useCallback(() => {
    p2p.sendMessage({ type: "reset", timestamp: Date.now() });
  }, [p2p]);

  const onGameState = useCallback((handler: (state: any) => void) => {
    gameStateHandlerRef.current = handler;
  }, []);

  const onAction = useCallback((handler: (action: any) => void) => {
    actionHandlerRef.current = handler;
  }, []);

  const onReset = useCallback((handler: () => void) => {
    resetHandlerRef.current = handler;
  }, []);

  const isMyTurn = useCallback((currentTurn: string, hostValue: string, guestValue: string) => {
    if (p2p.role === "host") return currentTurn === hostValue;
    if (p2p.role === "guest") return currentTurn === guestValue;
    return false;
  }, [p2p.role]);

  return {
    status: p2p.status,
    role: p2p.role,
    localCode: p2p.localCode,
    error: p2p.error,
    createRoom: p2p.createRoom,
    joinRoom: p2p.joinRoom,
    completeConnection: p2p.completeConnection,
    disconnect: p2p.disconnect,
    sendGameState,
    sendAction,
    sendReset,
    onGameState,
    onAction,
    onReset,
    isMyTurn,
  };
}
