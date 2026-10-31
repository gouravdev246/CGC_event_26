import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "./auth.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_rag_service_2026_dev";

// In-memory user store fallback when MongoDB is not currently running locally
const inMemoryUsers = new Map();

// Helper to generate JWT token with user identity
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId || null
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Register user - Strictly validates and creates a new account
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 2 characters.",
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // 1. If MongoDB is connected, use Mongoose
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "This email is already registered. Please log in.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      });

      const token = generateToken(user);
      return res.status(201).json({
        success: true,
        message: "Registration successful. Welcome aboard!",
        user,
        token,
      });
    }

    // 2. In-memory fallback if MongoDB is not connected
    if (inMemoryUsers.has(normalizedEmail)) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered. Please log in.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      _id: `mem_user_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    inMemoryUsers.set(normalizedEmail, newUser);

    const token = generateToken(newUser);
    const { password: _, ...userSafe } = newUser;

    return res.status(201).json({
      success: true,
      message: "Registration successful. Welcome aboard!",
      user: userSafe,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
      error: error.message,
    });
  }
};

// Login user - Strictly authenticates credentials; returns 404 if email is not registered
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. If MongoDB is connected, check Mongoose
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({
          success: false,
          notRegistered: true,
          message: "Email is not registered. Please sign up to create an account.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid password. Please check your credentials.",
        });
      }

      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: "Login successful.",
        user,
        token,
      });
    }

    // 2. Fallback to in-memory store
    const memUser = inMemoryUsers.get(normalizedEmail);
    if (!memUser) {
      return res.status(404).json({
        success: false,
        notRegistered: true,
        message: "Email is not registered. Please sign up to create an account.",
      });
    }

    const isMatch = await bcrypt.compare(password, memUser.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password. Please check your credentials.",
      });
    }

    const token = generateToken(memUser);
    const { password: _, ...userSafe } = memUser;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: userSafe,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
      error: error.message,
    });
  }
};

// Get current user profile - Requires valid JWT
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId);
      if (user) {
        return res.status(200).json({
          success: true,
          user,
        });
      }
    }

    // In-memory lookup
    for (const [_, u] of inMemoryUsers) {
      if (u._id === userId) {
        const { password: _, ...userSafe } = u;
        return res.status(200).json({
          success: true,
          user: userSafe,
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: "User account not found.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error fetching profile.",
      error: error.message,
    });
  }
};

// Change password - Verifies current password and updates securely
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required.",
      });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }

    // 1. If MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User account not found.",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password does not match.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password updated successfully.",
      });
    }

    // 2. In-memory fallback
    let memUser = null;
    for (const [_, u] of inMemoryUsers) {
      if (u._id === userId) {
        memUser = u;
        break;
      }
    }

    if (!memUser) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, memUser.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password does not match.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    memUser.password = await bcrypt.hash(newPassword, salt);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error changing password.",
      error: error.message,
    });
  }
};

// Plan tier templates
const PLAN_TIERS = {
  "Starter": {
    plan: "Starter",
    price: "$19/month",
    requestLimit: 10000,
    tokenLimit: 500000,
  },
  "Developer Pro": {
    plan: "Developer Pro",
    price: "$49/month",
    requestLimit: 50000,
    tokenLimit: 2000000,
  },
  "Enterprise Scale": {
    plan: "Enterprise Scale",
    price: "$199/month",
    requestLimit: 250000,
    tokenLimit: 10000000,
  }
};

// Get user subscription plan and usage metrics
export const getSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    let subscription = null;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId);
      if (user) {
        subscription = user.subscription || {
          plan: "Developer Pro",
          status: "active",
          billingCycle: "monthly",
          renewsOn: "November 30, 2026",
          requestLimit: 50000,
          tokenLimit: 2000000,
          requestsUsed: 142,
          tokensUsed: 48500
        };
      }
    } else {
      for (const [_, u] of inMemoryUsers) {
        if (u._id === userId) {
          subscription = u.subscription || {
            plan: "Developer Pro",
            status: "active",
            billingCycle: "monthly",
            renewsOn: "November 30, 2026",
            requestLimit: 50000,
            tokenLimit: 2000000,
            requestsUsed: 142,
            tokensUsed: 48500
          };
          break;
        }
      }
    }

    if (!subscription) {
      subscription = {
        plan: "Developer Pro",
        status: "active",
        billingCycle: "monthly",
        renewsOn: "November 30, 2026",
        requestLimit: 50000,
        tokenLimit: 2000000,
        requestsUsed: 142,
        tokensUsed: 48500
      };
    }

    return res.status(200).json({
      success: true,
      subscription,
      tiers: PLAN_TIERS
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error fetching subscription.",
      error: error.message,
    });
  }
};

// Upgrade or manage subscription plan
export const updateSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan } = req.body;

    if (!plan || !PLAN_TIERS[plan]) {
      return res.status(400).json({
        success: false,
        message: `Invalid plan. Must be one of: ${Object.keys(PLAN_TIERS).join(', ')}`,
      });
    }

    const tierInfo = PLAN_TIERS[plan];
    const updatedSub = {
      plan: tierInfo.plan,
      status: "active",
      billingCycle: "monthly",
      renewsOn: "November 30, 2026",
      requestLimit: tierInfo.requestLimit,
      tokenLimit: tierInfo.tokenLimit,
      requestsUsed: 142,
      tokensUsed: 48500
    };

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId);
      if (user) {
        user.subscription = updatedSub;
        await user.save();
      }
    } else {
      for (const [_, u] of inMemoryUsers) {
        if (u._id === userId) {
          u.subscription = updatedSub;
          break;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Subscription successfully updated to ${plan}.`,
      subscription: updatedSub
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error updating subscription.",
      error: error.message,
    });
  }
};
