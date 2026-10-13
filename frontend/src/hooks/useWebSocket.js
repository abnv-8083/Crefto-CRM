import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useWebSocket = (onMessage) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [mode, setMode] = useState('connecting'); // 'live' | 'connecting' | 'polling'
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      setIsConnected(false);
      setMode('polling');
      return;
    }

    // Determine WS URL
    let wsUrl = import.meta.env.VITE_WS_URL;

    // Check if running on Vercel host without explicit external WebSocket server configured
    const isVercelHost = typeof window !== 'undefined' && (
      window.location.hostname.endsWith('.vercel.app') ||
      window.location.hostname === 'vercel.app'
    );

    if (!wsUrl && isVercelHost) {
      // Vercel serverless functions do not support persistent WebSockets.
      // Automatically fallback to polling to prevent console connection errors.
      setIsConnected(false);
      setMode('polling');
      return;
    }

    if (!wsUrl) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In dev with Vite proxy, ws on current host /ws routes to backend port 5000
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }

    try {
      setMode('connecting');
      const urlWithToken = `${wsUrl}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(urlWithToken);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setIsConnected(true);
        setMode('live');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (onMessageRef.current) {
            onMessageRef.current(payload);
          }
        } catch (_) {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnection up to 3 times with backoff if user is still logged in
        if (localStorage.getItem('token') && reconnectAttemptsRef.current < 3) {
          reconnectAttemptsRef.current += 1;
          const delay = reconnectAttemptsRef.current * 3000;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          // Exceeded max attempts or serverless environment: graceful fallback to polling
          setMode('polling');
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (_) {
      setIsConnected(false);
      setMode('polling');
    }
  }, [user]);

  useEffect(() => {
    connect();

    // Ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        } catch (_) {}
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  return { isConnected, mode, send };
};

export default useWebSocket;
