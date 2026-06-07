import mongoose from "mongoose";
import bcrypt = require("bcryptjs");

export type UserRole = "admin" | "canteen" | "worker";

export interface IUser extends mongoose.Document {
  username: string;
  password: string;
  role: UserRole;
  name: string;
  canteenId?: mongoose.Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "canteen", "worker"],
      required: true,
    },
    name: { type: String, required: true },
    canteenId: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen" },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
