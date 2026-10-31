import { z } from "zod";

// Password rules: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordValidation = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(100, "Password must not exceed 100 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Register validation schema
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    password: passwordValidation,
  })
  .strict();

// Login validation schema
export const loginSchema = z
  .object({
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

// Send OTP schema
export const sendOtpSchema = z
  .object({
    email: z.string().trim().email("Invalid email address").toLowerCase(),
  })
  .strict();

// Verify OTP schema
export const verifyOtpSchema = z
  .object({
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    otp: z.string().trim().length(6, "OTP must be exactly 6 digits"),
  })
  .strict();

