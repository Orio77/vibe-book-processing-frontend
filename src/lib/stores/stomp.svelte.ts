import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Job } from '../types/job';
import { getAuthToken } from '$lib/api/index';

class StompStore {
    client: Client | null = null;
    isConnected = $state(false);
    activeJobs = $state<Job[]>([]);

    connect() {
        if (this.client?.active) return;
        
        const token = getAuthToken();
        if (!token) return;

        this.client = new Client({
            // Assuming default spring boot setup with sockjs fallback
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                this.isConnected = true;
                this.client?.subscribe('/user/queue/jobs/completed', async (message) => {
                    if (message.body) {
                        try {
                            const jobId = Number(message.body);
                            if (!isNaN(jobId)) {
                                // Fetch the actual Job object to see if it's COMPLETED or FAILED
                                const { fetchQueueJob } = await import('$lib/api/index');
                                const job = await fetchQueueJob(jobId);
                                this.updateJobStatus(
                                    job.id, 
                                    job.status as Job['status'], 
                                    job.errorText ?? undefined
                                );
                            }
                        } catch (e) {
                            console.error('Failed to process STOMP job completion', e);
                        }
                    }
                });
            },
            onDisconnect: () => {
                this.isConnected = false;
            },
            onStompError: (frame) => {
                console.error('STOMP error', frame);
            }
        });
        
        this.client.activate();
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }
        this.isConnected = false;
    }

    addJob(jobId: number, type: Job['type'], metadata?: { chapterId?: number; ideaId?: number }) {
        const existingIndex = this.activeJobs.findIndex(j => j.id === jobId);
        if (existingIndex >= 0) return;
        
        this.activeJobs = [...this.activeJobs, {
            id: jobId,
            type,
            status: 'QUEUED',
            ...metadata
        }];
    }

    updateJobStatus(jobId: number, status: Job['status'], error?: string) {
        const index = this.activeJobs.findIndex(j => j.id === jobId);
        if (index !== -1) {
            const newJobs = [...this.activeJobs];
            newJobs[index] = { ...newJobs[index], status, error };
            
            // Remove completed or failed jobs after 3 seconds
            if (status === 'COMPLETED' || status === 'FAILED') {
                setTimeout(() => {
                    this.removeJob(jobId);
                }, 3000);
            }
            
            this.activeJobs = newJobs;
        }
    }

    removeJob(id: number) {
        this.activeJobs = this.activeJobs.filter(j => j.id !== id);
    }
}

export const stompStore = new StompStore();
