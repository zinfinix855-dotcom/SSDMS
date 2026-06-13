const { Queue } = require('bullmq');
const { createClient, connectionConfig } = require('../config/redis');

(async () => {
  try {
    const connection = createClient();
    const q = new Queue('ai-scoring', { connection, defaultJobOptions: { removeOnComplete: true } });

    const job = await q.add('recalculate', { visitNumber: 'TEST-ENQUEUE-1' }, { jobId: 'test-enqueue-1' });
    console.log('Enqueued job id:', job.id);
    await q.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed to enqueue test job:', err.message);
    process.exit(1);
  }
})();
