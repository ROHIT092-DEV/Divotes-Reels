import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  email: string;
  role: "admin" | "user";
}

const UserSchema = new Schema<IUser>({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["admin", "user"], default: "user" },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
