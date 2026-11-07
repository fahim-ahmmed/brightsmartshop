import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  userId: { type: String },
  password: { type: String, required: true },
  profileImage: {
    type: String,
    default: "https://api.dicebear.com/7.x/bottts/svg?seed=Avatar", // ডেমো প্রোফাইল পিক
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);