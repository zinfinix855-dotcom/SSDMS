const { Queue, Worker } = require('bullmq');
const { createClient } = require('../config/redis');

async function main() {
  const connection = createClient();
  const queueName = 'ai-scoring';
  const queue = new Queue(queueName, { connection });

  console.log('Enqueuing test job...');
  const job = await queue.add('recalculate', { visitNumber: 'RECOVERY-TEST-1' }, { jobId: 'recovery-test-1' });
  console.log('Job enqueued:', job.id);

  // Start a temporary worker to process the job and report results
  const worker = new Worker(queueName, async (job) => {
    console.log('Worker processing job', job.id, job.name, job.data);
    // simulate processing
    await new Promise(r => setTimeout(r, 1000));
    return { ok: true };
  }, { connection, concurrency: 1 });

  worker.on('completed', (job) => {
    console.log('Job completed:', job.id);
    cleanup(0);
  });

  worker.on('failed', (job, err) => {
    console.error('Job failed:', job.id, err.message);
    cleanup(1);
  });

  worker.on('error', (err) => {
    console.error('Worker error', err.message);
  });

  // cleanup helper
  async function cleanup(code = 0) {
    try { await worker.close(); } catch(e){}
    try { await queue.close(); } catch(e){}
    process.exit(code);
  }

  // timeout
  setTimeout(() => {
    console.error('Test timed out');
    cleanup(2);
  }, 30000).unref();
}

main().catch(err => { console.error(err); process.exit(1); });
