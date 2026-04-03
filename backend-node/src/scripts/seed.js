import dotenv from 'dotenv';
import { connectDb } from '../config/db.js';
import { Topic } from '../models/Topic.js';
import { User } from '../models/User.js';
import { TOPIC_SEED } from '../data/topics.seed.js';

dotenv.config();

async function run() {
  await connectDb(process.env.MONGODB_URI);

  await User.updateOne(
    { _id: 'user_001' },
    {
      $set: {
        name: 'Demo User',
        email: 'demo@example.com',
        preferredLanguage: 'en'
      }
    },
    { upsert: true }
  );

  for (const topic of TOPIC_SEED) {
    await Topic.updateOne({ _id: topic._id }, { $set: topic }, { upsert: true });
  }

  console.log(`Seed completed: ${TOPIC_SEED.length} topics and demo user`);
  process.exit(0);
}

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
