import { Router } from "express";
import { Session } from "../models/Session.js";
import { ok, fail } from "../utils/response.js";
import {
  summarizeSession,
  mapPetMood,
} from "../services/recommendation.service.js";
import { AnalysisResult } from "../models/AnalysisResult.js";
function createSessionId() {
  return `sess_${Date.now()}`;
}
const router = Router();
router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find({}).sort({
      createdAt: -1,
    });
    return ok(res, sessions || []);
  } catch (error) {
    return fail(res, error.message || "Failed to get sessions", 500);
  }
});
router.post("/", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return fail(res, "userId is required");
  }

  const session = await Session.create({
    _id: createSessionId(),
    userId,
    startTime: new Date(),
    currentMoodScore: 50,
    completedTaskPoints: 0,
    status: "active",
  });

  return ok(
    res,
    {
      sessionId: session._id,
      startTime: session.startTime,
      currentMoodScore: session.currentMoodScore,
      petMood: mapPetMood(session.currentMoodScore),
      petGreeting: "Hi! I am ready to spend some time with you today.",
    },
    201,
  );
});
router.patch("/:sessionId/end", async (req, res) => {
  const { sessionId } = req.params;
  const session = await Session.findById(sessionId);

  if (!session) {
    return fail(res, "Session not found", 404);
  }

  const results = await AnalysisResult.find({ sessionId }).lean();
  const averageSentimentScore = results.length
    ? Math.round(
        results.reduce((sum, item) => sum + item.sentimentScore, 0) /
          results.length,
      )
    : null;

  session.endTime = new Date();
  session.averageSentimentScore = averageSentimentScore;
  session.status = "completed";
  await session.save();

  return ok(res, {
    sessionId: session._id,
    endTime: session.endTime,
    averageSentimentScore,
    currentMoodScore: session.currentMoodScore,
    completedTaskPoints: session.completedTaskPoints,
    summary: summarizeSession(results),
  });
});
router.get("/:sessionId/results", async (req, res) => {
  const { sessionId } = req.params;
  const session = await Session.findById(sessionId).lean();
  if (!session) {
    return fail(res, "Session not found", 404);
  }

  const results = await AnalysisResult.find({ sessionId })
    .sort({ turnIndex: 1, createdAt: 1 })
    .lean();

  return ok(res, {
    session: {
      sessionId: session._id,
      currentMoodScore: session.currentMoodScore,
      completedTaskPoints: session.completedTaskPoints,
      petMood: mapPetMood(session.currentMoodScore),
      status: session.status,
    },
    results: results.map((item) => ({
      analysisId: item._id,
      turnIndex: item.turnIndex,
      topicText: item.topicText,
      transcript: item.transcript,
      sentimentScore: item.sentimentScore,
      sentimentLabel: item.sentimentLabel,
      confidence: item.confidence,
      scriptScore: item.scriptScore,
      textScore: item.textScore,
      audioScore: item.audioScore,
      facialScore: item.facialScore,
      videoScore: item.videoScore,
      finalScore: item.finalScore,
      aiFeedback: item.aiFeedback,
      modalityScores: item.modalityScores,
      modalityWeights: item.modalityWeights,
      modalityConfidences: item.modalityConfidences,
      petMood: item.petMood,
      petReply: item.petReply,
      tasks: item.tasks,
      musicRecommendations: item.musicRecommendations || [],
      createdAt: item.createdAt,
    })),
  });
});

export default router;
