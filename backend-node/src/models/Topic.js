import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    topicText: { type: String, required: true },
    petMessage: { type: String, required: true },
    difficultyLevel: { type: String, default: "easy" },
    moodTag: { type: String, default: "neutral" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "topics" },
);

export const Topic = mongoose.model("Topic", TopicSchema);
