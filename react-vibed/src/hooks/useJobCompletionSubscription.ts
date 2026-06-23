import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAuthToken } from '../lib/api';
import { resolveWsEndpoint } from '../lib/api/core/client';

export function useJobCompletionSubscription(
    onCompleted: (jobId: number) => void,
    enabled: boolean = true,
) {
    useEffect(() => {
        if (!enabled) return;

        const buildConnectHeaders = (): Record<string, string> => {
            const token = getAuthToken();
            if (!token) return {};
            return { Authorization: `Bearer ${token}` };
        };

        const endpoint = resolveWsEndpoint();
        const client = new Client({
            webSocketFactory: () => new SockJS(endpoint),
            connectHeaders: buildConnectHeaders(),
            reconnectDelay: 4000,
            heartbeatIncoming: 15000,
            heartbeatOutgoing: 15000,
            beforeConnect: () => {
                client.connectHeaders = buildConnectHeaders();
            },
            onStompError: (frame) => {
                console.error('STOMP job subscription error.', frame.headers, frame.body);
            },
            onWebSocketError: (event) => {
                console.error('WebSocket job subscription error.', event);
            },
            onWebSocketClose: (event) => {
                if (!event.wasClean) {
                    console.warn('Job completion socket closed unexpectedly.', event.code, event.reason);
                }
            },
        });

        client.onConnect = () => {
            client.subscribe('/user/queue/jobs/completed', (message) => {
                const parsed = Number(message.body);
                if (Number.isFinite(parsed)) {
                    onCompleted(parsed);
                }
            });
        };

        client.activate();

        return () => {
            client.deactivate().catch(() => undefined);
        };
    }, [onCompleted, enabled]);
}
