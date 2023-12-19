import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    name: String,
    password: String,
    email: String,
    phone: String,
    avatar: String,
    role: {
      type: String,
      ref: "Role",
    },
    roleNumber: {
      type: Number,
      default: null,
    },

    verifyToken: {
      token: String,
      expirationTime: Date,
    },
    otpCode: {
      otp: String,
      expirationTime: Date,
    },
  },
  { versionKey: false, timestamps: true }
);
userSchema.plugin(mongoosePaginate);
export default mongoose.model("User", userSchema);
