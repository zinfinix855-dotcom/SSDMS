import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://127.0.0.1:5000';

/**
 * useSocket — connects to the backend Socket.io server and listens for real-time events.
 * Updated to support namespaced events: feed:update, stage:update, file:update.
 * 
 * @param {Function} onEvent - callback invoked with event data
 * @param {Object} options - config { stage: 'Finance', file: 'SS-001', type: 'feed' | 'stage' | 'file' }
 * @returns {{ socketRef: React.MutableRefObject, disconnect: Function }}
 */
export default function useSocket(onEvent, options = { type: 'feed' }) {
    const socketRef = useRef(null);
    const callbackRef = useRef(onEvent);

    useEffect(() => {
        callbackRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 5000
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log(`[Socket] Connected (${options.type}):`, socket.id);
            
            if (options.stage) {
                socket.emit('subscribe-stage', options.stage);
            }
            if (options.file) {
                socket.emit('subscribe-file', options.file);
            }
        });

        // Listen based on requested type
        if (options.type === 'feed') {
            socket.on('feed:batch', (batch) => {
                if (Array.isArray(batch)) {
                    batch.forEach(event => callbackRef.current?.(event));
                }
            });
        } else {
            const eventChannel = options.type === 'stage' ? 'stage:update' : 
                                 options.type === 'file' ? 'file:update' : 'v1/events';

            socket.on(eventChannel, (event) => {
                callbackRef.current?.(event);
            });
        }

        socket.on('disconnect', (reason) => {
            console.warn('[Socket] Disconnected:', reason);
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
        });

        return () => {
            if (options.stage) socket.emit('unsubscribe-stage', options.stage);
            if (options.file) socket.emit('unsubscribe-file', options.file);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [options.type, options.stage, options.file]);

    return {
        socketRef,
        disconnect: () => socketRef.current?.disconnect()
    };
}
