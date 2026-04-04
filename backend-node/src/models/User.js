import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    //alowing name to be null as an third party login may not provide name
    name: {
      type: String,
      required: false,
      default: null,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "please enter a valid email address"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    preferredLanguage: { type: String, default: "en" },
  },
  { timestamps: true, collection: "users" },
);

export const User = mongoose.model("User", UserSchema);
