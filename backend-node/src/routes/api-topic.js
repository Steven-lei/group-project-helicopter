import { Router } from "express";
import { Topic } from "../models/Topic.js";
import { fail, ok } from "../utils/response.js";
const router = Router();
router.get("/", async (req, res) => {
  try {
    const topics = await Topic.find(
      {},
      "_id category topicText petMessage suggestedDurationSec",
    ).lean();
    return ok(res, topics || []);
  } catch (error) {
    return fail(res, error.message || "Failed to get next topic", 500);
  }
});

router.get("/next", async (req, res) => {
  const { moodTag } = req.query;

  const query = { isActive: true };
  if (moodTag) {
    query.moodTag = moodTag;
  }
  try {
    let topics = await Topic.find(query).lean();

    if (!topics.length && moodTag) {
      topics = await Topic.find({ isActive: true }).lean();
    }

    if (!topics.length) {
      return fail(res, "No available topic found", 404);
    }

    const topic = topics[Math.floor(Math.random() * topics.length)];

    return ok(res, {
      topicId: topic._id,
      category: topic.category,
      topicText: topic.topicText,
      petMessage: topic.petMessage,
      suggestedDurationSec: 30,
    });
  } catch (error) {
    console.error("Error fetching next topic:", error);
    return fail(res, error.message || "Failed to get next topic", 500);
  }
});
router.get("/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const topic = await Topic.findById(_id).lean();
    if (!topic) {
      return fail(res, "Topic not found", 404);
    }
    return ok(res, topic);
  } catch (error) {
    console.error("Error fetching topic:", error);
    fail(res, error.message || `Failed to get topic ${_id}`, 500);
  }
});
export default router;
