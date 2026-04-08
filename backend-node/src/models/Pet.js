import mongoose from "mongoose";

const PetSchema = new mongoose.Schema(
  {
    petType: {
      type: String,
      required: true,
      default: "pockmon 1",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true, collection: "pets" },
);

export const Pet = mongoose.model("Pet", PetSchema);
