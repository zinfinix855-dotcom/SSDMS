const { Server } = require('socket.io');
const cookie = require('cookie');
const { verifyToken } = require('../utils/jwt');
const EventBus = require('./EventBus');
const logger = require('../utils/logger');

/**
 * SocketService provides the real-time bridge between the internal EventBus and connected clients.
 */
class SocketService {
    constructor() {
        this.io = null;
        this.eventBuffer = [];
        this.throttleTimer = null;
    }

    initialize(server) {
        // FIX: Match CORS policy with app.js — never allow wildcard in production
        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',')
            : ['http://localhost:5173', 'http://localhost:3000'];

        this.io = new Server(server, {
            cors: {
                origin: (origin, callback) => {
                    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                        callback(null, true);
                    } else {
                        callback(new Error('Socket CORS: origin not allowed'));
                    }
                },
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        // Authentication Middleware
        this.io.use((socket, next) => {
            try {
                const cookies = socket.handshake.headers.cookie;
                if (!cookies) return next(new Error('Authentication error: No cookies found'));
                
                const parsedCookies = cookie.parse(cookies);
                const token = parsedCookies.ssdms_token;
                
                if (!token) return next(new Error('Authentication error: Token missing'));
                
                const decoded = verifyToken(token);
                socket.data.user = decoded;
                next();
            } catch (err) {
                logger.error('Socket Auth Error:', err.message);
                next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on('connection', (socket) => {
            logger.info(`Socket connected: ${socket.id}`);

            socket.on('subscribe-stage', (stage) => {
                socket.join(`stage:${stage}`);
                logger.debug(`Socket ${socket.id} joined stage room: stage:${stage}`);
            });

            socket.on('unsubscribe-stage', (stage) => {
                socket.leave(`stage:${stage}`);
                logger.debug(`Socket ${socket.id} left stage room: stage:${stage}`);
            });

            socket.on('subscribe-file', (visitNumber) => {
                socket.join(`file:${visitNumber}`);
                logger.debug(`Socket ${socket.id} joined file room: file:${visitNumber}`);
            });

            socket.on('unsubscribe-file', (visitNumber) => {
                socket.leave(`file:${visitNumber}`);
                logger.debug(`Socket ${socket.id} left file room: file:${visitNumber}`);
            });

            socket.on('disconnect', () => {
                logger.info(`Socket disconnected: ${socket.id}`);
            });
        });

        this.setupEventBridge();
    }

    setupEventBridge() {
        const eventsToForward = [
            'WORKFLOW_STATE_CHANGED',
            'SLA_VIOLATION',
            'INTEGRITY_VIOLATION',
            'BULK_ACTION_COMPLETED',
            'BULK_JOB_STARTED'
        ];

        eventsToForward.forEach(eventName => {
            EventBus.on(eventName, (data) => {
                if (!this.io) return;

                // 1. Target specific stage rooms (Surgical Update)
                if (data.toStage || data.fromStage) {
                    const stages = new Set([data.toStage, data.fromStage].filter(Boolean));
                    stages.forEach(s => {
                        this.io.to(`stage:${s}`).emit('stage:update', data);
                    });
                }

                // 2. Target specific file room (Detail Page)
                if (data.visitNumber) {
                    this.io.to(`file:${data.visitNumber}`).emit('file:update', data);
                }

                // 3. Global Dashboard Feed (Throttled & Batch-friendly)
                this.bufferGlobalEvent(data);
            });
        });
    }

    /**
     * Throttles high-frequency global events using batching (Phase 2 Requirement)
     */
    bufferGlobalEvent(payload) {
        this.eventBuffer.push(payload);

        if (!this.throttleTimer) {
            this.throttleTimer = setTimeout(() => {
                if (this.eventBuffer.length > 0) {
                    // Send entire batch at once for frontend efficiency
                    this.io.emit('feed:batch', this.eventBuffer);
                    this.eventBuffer = [];
                }
                this.throttleTimer = null;
            }, 300); // 300ms batching window as requested
        }
    }
}

module.exports = new SocketService();

