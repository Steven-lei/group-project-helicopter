import { Topic } from '../models/Topic.js';
import { ok, fail } from '../utils/response.js';

export async function getNextTopic(req, res) {
  const { moodTag } = req.query;

  const query = { isActive: true };
  if (moodTag) {
    query.moodTag = moodTag;
  }

  let topics = await Topic.find(query).lean();

  if (!topics.length && moodTag) {
    topics = await Topic.find({ isActive: true }).lean();
  }

  if (!topics.length) {
    return fail(res, 'No available topic found', 404);
  }

  const topic = topics[Math.floor(Math.random() * topics.length)];

  return ok(res, {
    topicId: topic._id,
    category: topic.category,
    topicText: topic.topicText,
    petMessage: topic.petMessage,
    suggestedDurationSec: 30
  });
}
