import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    subscription: {
      plan: {
        type: String,
        default: "Developer Pro",
      },
      status: {
        type: String,
        default: "active",
      },
      billingCycle: {
        type: String,
        default: "monthly",
      },
      renewsOn: {
        type: String,
        default: "November 30, 2026",
      },
      requestLimit: {
        type: Number,
        default: 50000,
      },
      tokenLimit: {
        type: Number,
        default: 2000000,
      },
      requestsUsed: {
        type: Number,
        default: 142,
      },
      tokensUsed: {
        type: Number,
        default: 48500,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Remove password when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export const User = mongoose.model("User", userSchema);

