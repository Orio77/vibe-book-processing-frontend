import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

function resolveWsEndpoint(): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

    if (!baseUrl) {
        return '/ws';
    }

    const origin = new URL(baseUrl).origin;
    return `${origin}/ws`;
}

export function useJobCompletionSubscription(onCompleted: (jobId: number) => void) {
    useEffect(() => {
        const endpoint = resolveWsEndpoint();
        const client = new Client({
            webSocketFactory: () => new SockJS(endpoint),
            reconnectDelay: 4000,
            heartbeatIncoming: 15000,
            heartbeatOutgoing: 15000,
        });

        client.onConnect = () => {
            client.subscribe('/topic/jobs/completed', (message) => {
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
    }, [onCompleted]);
}
