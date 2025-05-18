import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
}

export const useWebSocket = (stationId: string, token: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [listeners, setListeners] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  
  const connectWebSocket = useCallback(() => {
    if (!token || !stationId) return;
    
    const wsUrl = `ws://localhost:8000/ws/station/${stationId}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'chat_message':
          setMessages((prev) => [...prev, message.data]);
          break;
          
        case 'listener_joined':
          setListeners((prev) => [...prev, message.data]);
          break;
          
        case 'listener_left':
          setListeners((prev) => 
            prev.filter((listener) => listener.user_id !== message.data.user_id)
          );
          break;
          
        case 'tip_received':
          setTips((prev) => [...prev, message.data]);
          break;
          
        case 'track_update':
          setCurrentTrack(message.data);
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };
    
    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, [stationId, token]);
  
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);
  
  const sendChatMessage = useCallback((content: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        content
      }));
    }
  }, []);
  
  const sendTip = useCallback((toUserId: string, amount: number, message?: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'tip',
        to_user_id: toUserId,
        amount,
        message
      }));
    }
  }, []);
  
  const updateCurrentTrack = useCallback((track: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'track_update',
        track
      }));
    }
  }, []);
  
  return {
    isConnected,
    messages,
    listeners,
    tips,
    currentTrack,
    sendChatMessage,
    sendTip,
    updateCurrentTrack
  };
};
