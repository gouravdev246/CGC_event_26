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
    organizationId: {
      type: String,
      default: null,
      trim: true,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    stripePriceId: {
      type: String,
      default: null,
    },
    subscription: {
      plan: {
        type: String,
        enum: ["Free", "Starter", "Pro", "Enterprise"],
        default: "Free",
      },
      status: {
        type: String,
        default: "active", // active, past_due, canceled, incomplete, trialing, unpaid
      },
      billingCycle: {
        type: String,
        default: "monthly",
      },
      currentPeriodStart: {
        type: Date,
        default: Date.now,
      },
      currentPeriodEnd: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      renewsOn: {
        type: String,
        default: "Never (Free Tier)",
      },
      documentLimit: {
        type: Number,
        default: 2, // Free: 2, Starter: 5, Pro: 12, Enterprise: Custom
      },
      documentsUsed: {
        type: Number,
        default: 0,
      },
      requestLimit: {
        type: Number,
        default: 100, // Free: 100, Starter: 1000, Pro: 2500, Enterprise: Custom
      },
      requestsUsed: {
        type: Number,
        default: 0,
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
