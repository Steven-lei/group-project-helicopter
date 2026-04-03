import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, default: '' },
    preferredLanguage: { type: String, default: 'en' }
  },
  { timestamps: true, collection: 'users' }
);

export const User = mongoose.model('User', UserSchema);
