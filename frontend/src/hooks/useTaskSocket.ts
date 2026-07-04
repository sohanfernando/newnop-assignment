import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../api/client';
import type { Task } from '../types';

interface TaskSocketHandlers {
  onTaskUpserted: (task: Task) => void;
  onTaskDeleted: (id: number) => void;
}

export function useTaskSocket({ onTaskUpserted, onTaskDeleted }: TaskSocketHandlers) {
  const handlersRef = useRef({ onTaskUpserted, onTaskDeleted });
  handlersRef.current = { onTaskUpserted, onTaskDeleted };
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      client.subscribe('/topic/tasks', (message) => {
        const task = JSON.parse(message.body) as Task;
        handlersRef.current.onTaskUpserted(task);
      });
      client.subscribe('/topic/tasks/deleted', (message) => {
        const id = JSON.parse(message.body) as number;
        handlersRef.current.onTaskDeleted(id);
      });
    };
    client.onDisconnect = () => setIsConnected(false);
    client.onWebSocketClose = () => setIsConnected(false);

    client.activate();

    return () => {
      client.deactivate();
    };
  }, []);

  return { isConnected };
}
