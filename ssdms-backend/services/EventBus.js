const EventEmitter = require('events');

/**
 * EventBus is a lightweight EventEmitter for internal system communication.
 * It decouples core workflow logic from secondary side-effects (notifications, analytics, etc.).
 */
class EventBus extends EventEmitter {}

module.exports = new EventBus();
