import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    averageSentimentScore: { type: Number, default: null },
    currentMoodScore: { type: Number, default: 50, min: 0, max: 100 },
    completedTaskPoints: { type: Number, default: 0 },
    status: { type: String, default: 'active' }
  },
  { timestamps: true, collection: 'sessions' }
);

export const Session = mongoose.model('Session', SessionSchema);
