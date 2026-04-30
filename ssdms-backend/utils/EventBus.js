const EventEmitter = require('events');

class EventBus extends EventEmitter {}

// Create a single instance to be used across the application
const eventBus = new EventBus();

// Define Event Types
const EVENT_TYPES = {
    FILE_CREATED: 'FILE_CREATED',
    FILE_FORWARDED: 'FILE_FORWARDED',
    FILE_RETURNED: 'FILE_RETURNED',
    SLA_VIOLATION: 'SLA_VIOLATION',
    STATUS_CHANGED: 'STATUS_CHANGED'
};

module.exports = {
    eventBus,
    EVENT_TYPES
};
