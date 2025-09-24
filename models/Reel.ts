import mongoose, { Document, Model } from 'mongoose';

export interface IReel extends Document {
  imageUrl: string;
  caption?: string;
  createdBy?: string;
  createdAt?: Date;
  likes?: number;
  likedBy?: string[];
  comments?: {
    userId?: string;
    userName?: string;
    text: string;
    createdAt?: Date;
  }[];
}

const ReelSchema = new mongoose.Schema<IReel>({
  imageUrl: { type: String, required: true },
  caption: { type: String },
  createdBy: { type: String, default: 'Anonymous' },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  comments: {
    type: [
      {
        userId: { type: String },
        userName: { type: String },
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
});

const Reel: Model<IReel> =
  mongoose.models.Reel || mongoose.model<IReel>('Reel', ReelSchema);
export default Reel;
