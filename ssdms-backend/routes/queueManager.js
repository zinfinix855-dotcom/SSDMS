const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const queueService = require('../services/QueueService');
const { protect, restrictTo } = require('../middlewares/auth');

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/v1/admin/queues');

createBullBoard({
    queues: Object.values(queueService.queues).map(q => new BullMQAdapter(q)),
    serverAdapter: serverAdapter
});

// We return a middleware array so protect/restrictTo can run before the specific router
module.exports = [protect, restrictTo('Admin'), serverAdapter.getRouter()];
