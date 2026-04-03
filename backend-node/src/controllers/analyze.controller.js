import fs from 'node:fs/promises';
import path from 'node:path';
import { AnalysisResult } from '../models/AnalysisResult.js';
import { Session } from '../models/Session.js';
import { analyzeWithAi } from '../services/ai-client.service.js';
import { getMusicRecommendations } from '../services/music-recommendation.service.js';
import {
  generateTasks,
  mapPetMood,
  generatePetReply,
  generateTaskCelebration
} from '../services/recommendation.service.js';
import { fail, ok } from '../utils/response.js';

export async function analyzeVideo(req, res) {
  const { userId, sessionId, topicId, topicText, turnIndex, transcript = '' } = req.body;
  const videoFile = req.file;

  if (!videoFile) {
    return fail(res, 'Video file is required');
  }

  if (!userId || !sessionId || !topicId || !topicText || !turnIndex) {
    await fs.unlink(videoFile.path).catch(() => {});
    return fail(res, 'userId, sessionId, topicId, topicText, and turnIndex are required');
  }

  const session = await Session.findById(sessionId);
  if (!session) {
    await fs.unlink(videoFile.path).catch(() => {});
    return fail(res, 'Session not found', 404);
  }

  try {
    const aiData = await analyzeWithAi({
      videoPath: videoFile.path,
      topicText,
      transcript
    });

    const scriptScore = Number(
      aiData?.scriptScore ?? aiData?.textScore ?? aiData?.modality_scores?.script ?? aiData?.modality_scores?.text ?? 50
    );
    const textScore = Number(
      aiData?.textScore ?? aiData?.scriptScore ?? aiData?.modality_scores?.text ?? aiData?.modality_scores?.script ?? scriptScore
    );
    const audioScore = Number(aiData?.audioScore ?? aiData?.modality_scores?.audio ?? 50);
    const facialScore = Number(
      aiData?.facialScore ?? aiData?.videoScore ?? aiData?.modality_scores?.facial ?? aiData?.modality_scores?.video ?? 50
    );
    const videoScore = Number(
      aiData?.videoScore ?? aiData?.facialScore ?? aiData?.modality_scores?.video ?? aiData?.modality_scores?.facial ?? facialScore
    );
    const finalScore = Number(
      aiData?.finalScore ?? aiData?.sentiment_score ?? aiData?.modality_scores?.final ?? 50
    );

    const label = aiData?.sentiment_label ?? 'neutral';
    const confidence = Number(aiData?.confidence ?? aiData?.modality_confidences?.final ?? 0.5);
    const videoFeatures = aiData?.video_features ?? {};
    const audioFeatures = aiData?.audio_features ?? {};
    const textFeatures = aiData?.text_features ?? {};
    const modalityScores = {
      script: scriptScore,
      text: textScore,
      audio: audioScore,
      facial: facialScore,
      video: videoScore,
      final: finalScore,
      ...(aiData?.modality_scores ?? {})
    };
    const modalityWeights = {
      script: Number(aiData?.modality_weights?.script ?? aiData?.modality_weights?.text ?? 0.4),
      audio: Number(aiData?.modality_weights?.audio ?? 0.3),
      facial: Number(aiData?.modality_weights?.facial ?? aiData?.modality_weights?.video ?? 0.3)
    };
    const modalityConfidences = {
      script: Number(aiData?.modality_confidences?.script ?? aiData?.modality_confidences?.text ?? 0),
      text: Number(aiData?.modality_confidences?.text ?? aiData?.modality_confidences?.script ?? 0),
      audio: Number(aiData?.modality_confidences?.audio ?? 0),
      facial: Number(aiData?.modality_confidences?.facial ?? aiData?.modality_confidences?.video ?? 0),
      video: Number(aiData?.modality_confidences?.video ?? aiData?.modality_confidences?.facial ?? 0),
      final: Number(aiData?.modality_confidences?.final ?? confidence)
    };
    const usedTranscript = aiData?.transcript ?? transcript ?? '';
    const multimodalVersion = aiData?.multimodal_version ?? 'video-audio-text-v2';

    const tasks = generateTasks(finalScore);
    const musicRecommendations = await getMusicRecommendations(finalScore, process.env.YOUTUBE_API_KEY);
    const aiFeedback = aiData?.ai_feedback || '';
    const petReply = aiFeedback || generatePetReply(finalScore);

    // Keep the pet state aligned with the latest multimodal analysis result.
    session.currentMoodScore = finalScore;
    await session.save();
    const sessionMood = mapPetMood(finalScore);

    const relativeVideoPath = path.join('uploads', path.basename(videoFile.path)).replaceAll('\\', '/');

    const saved = await AnalysisResult.create({
      userId,
      sessionId,
      topicId,
      topicText,
      turnIndex: Number(turnIndex),
      videoPath: relativeVideoPath,
      transcript: usedTranscript,
      sentimentScore: finalScore,
      sentimentLabel: label,
      confidence,
      scriptScore,
      textScore,
      audioScore,
      facialScore,
      videoScore,
      finalScore,
      aiFeedback,
      petMood: sessionMood,
      petReply,
      tasks,
      musicRecommendations,
      videoFeatures,
      audioFeatures,
      textFeatures,
      modalityScores,
      modalityWeights,
      modalityConfidences,
      multimodalVersion
    });

    return ok(res, {
      analysisId: saved._id,
      sessionId,
      topicId,
      topicText,
      turnIndex: Number(turnIndex),
      transcript: usedTranscript,
      sentimentScore: finalScore,
      sentimentLabel: label,
      confidence,
      scriptScore,
      textScore,
      audioScore,
      facialScore,
      videoScore,
      finalScore,
      aiFeedback,
      petMood: sessionMood,
      petReply,
      tasks,
      musicRecommendations,
      currentMoodScore: session.currentMoodScore,
      completedTaskPoints: session.completedTaskPoints,
      videoFeatures,
      audioFeatures,
      textFeatures,
      modalityScores,
      modalityWeights,
      modalityConfidences,
      multimodalVersion,
      createdAt: saved.createdAt
    });
  } catch (error) {
    await fs.unlink(videoFile.path).catch(() => {});
    throw error;
  }
}

export async function completeTask(req, res) {
  const { analysisId, taskId } = req.params;

  const analysis = await AnalysisResult.findById(analysisId);
  if (!analysis) {
    return fail(res, 'Analysis result not found', 404);
  }

  const session = await Session.findById(analysis.sessionId);
  if (!session) {
    return fail(res, 'Session not found', 404);
  }

  const task = analysis.tasks.find((item) => item.taskId === taskId);
  if (!task) {
    return fail(res, 'Task not found', 404);
  }

  if (task.completed) {
    return ok(res, {
      analysisId: analysis._id,
      task,
      currentMoodScore: session.currentMoodScore,
      completedTaskPoints: session.completedTaskPoints,
      petMood: mapPetMood(session.currentMoodScore),
      petReply: 'This task was already completed earlier.'
    });
  }

  task.completed = true;
  task.completedAt = new Date();

  session.currentMoodScore = Math.min(100, session.currentMoodScore + task.points);
  session.completedTaskPoints += task.points;

  await analysis.save();
  await session.save();

  const nextMood = mapPetMood(session.currentMoodScore);

  return ok(res, {
    analysisId: analysis._id,
    task,
    currentMoodScore: session.currentMoodScore,
    completedTaskPoints: session.completedTaskPoints,
    petMood: nextMood,
    petReply: generateTaskCelebration(task.title, nextMood)
  });
}
