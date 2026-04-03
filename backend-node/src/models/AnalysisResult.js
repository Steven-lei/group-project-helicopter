import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true },
    title: { type: String, required: true },
    points: { type: Number, required: true, min: 1 },
    reminderMinutes: { type: Number, default: 15 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null }
  },
  { _id: false }
);

const MusicRecommendationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    thumbnail: { type: String, default: '' },
    channelTitle: { type: String, default: '' },
    category: { type: String, required: true },
    source: { type: String, default: 'fallback-search' },
    description: { type: String, default: '' }
  },
  { _id: false }
);

const AnalysisResultSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    topicId: { type: String, required: true },
    topicText: { type: String, required: true },
    turnIndex: { type: Number, required: true },
    videoPath: { type: String, required: true },
    transcript: { type: String, default: '' },

    sentimentScore: { type: Number, required: true },
    sentimentLabel: { type: String, required: true },
    confidence: { type: Number, required: true },

    scriptScore: { type: Number, default: 50 },
    textScore: { type: Number, default: 50 },
    audioScore: { type: Number, default: 50 },
    facialScore: { type: Number, default: 50 },
    videoScore: { type: Number, default: 50 },
    finalScore: { type: Number, default: 50 },

    aiFeedback: { type: String, default: '' },
    petMood: { type: String, required: true },
    petReply: { type: String, required: true },

    tasks: { type: [TaskSchema], default: [] },
    musicRecommendations: { type: [MusicRecommendationSchema], default: [] },

    videoFeatures: {
      brightness: { type: Number, default: 0 },
      motion: { type: Number, default: 0 },
      durationSec: { type: Number, default: 0 },
      frameSampleCount: { type: Number, default: 0 },
      edgeDensity: { type: Number, default: 0 },
      facePresenceRatio: { type: Number, default: 0 },
      avgFaceAreaRatio: { type: Number, default: 0 },
      smileFrameRatio: { type: Number, default: 0 }
    },
    audioFeatures: {
      available: { type: Boolean, default: false },
      durationSec: { type: Number, default: 0 },
      rmsMean: { type: Number, default: 0 },
      rmsStd: { type: Number, default: 0 },
      zeroCrossingRate: { type: Number, default: 0 },
      spectralCentroid: { type: Number, default: 0 },
      tempo: { type: Number, default: 0 },
      pitchMean: { type: Number, default: 0 },
      pitchStd: { type: Number, default: 0 },
      silenceRatio: { type: Number, default: 0 },
      speechActivityRatio: { type: Number, default: 0 }
    },
    textFeatures: {
      available: { type: Boolean, default: false },
      tokenCount: { type: Number, default: 0 },
      positiveCount: { type: Number, default: 0 },
      negativeCount: { type: Number, default: 0 },
      supportCount: { type: Number, default: 0 },
      intensifierCount: { type: Number, default: 0 },
      negationCount: { type: Number, default: 0 },
      firstPersonCount: { type: Number, default: 0 },
      sentimentBalance: { type: Number, default: 0 },
      lexicalDiversity: { type: Number, default: 0 },
      topicAlignment: { type: Number, default: 0 },
      questionMarks: { type: Number, default: 0 },
      exclamationMarks: { type: Number, default: 0 }
    },
    modalityScores: {
      script: { type: Number, default: 0 },
      text: { type: Number, default: 0 },
      audio: { type: Number, default: 0 },
      facial: { type: Number, default: 0 },
      video: { type: Number, default: 0 },
      final: { type: Number, default: 0 }
    },
    modalityWeights: {
      script: { type: Number, default: 0 },
      audio: { type: Number, default: 0 },
      facial: { type: Number, default: 0 }
    },
    modalityConfidences: {
      script: { type: Number, default: 0 },
      text: { type: Number, default: 0 },
      audio: { type: Number, default: 0 },
      facial: { type: Number, default: 0 },
      video: { type: Number, default: 0 },
      final: { type: Number, default: 0 }
    },
    multimodalVersion: { type: String, default: 'video-audio-text-v2' }
  },
  { timestamps: true, collection: 'analysis_results' }
);

export const AnalysisResult = mongoose.model('AnalysisResult', AnalysisResultSchema);
