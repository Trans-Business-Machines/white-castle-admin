import { z } from "zod"

const passwordSchema = z.string()
  .regex(/[A-Z]/, "Password must have at least one uppercase letter")
  .regex(/[a-z]/, "Password must have at least one lowercase letter")
  .regex(/[0-9]/, "Password must have at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must have one special character")
  .min(8, "Password must be at least 8 characters")


export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username."),
  password: z.string().min(1, "Enter your password."),
})


export const forgotPasswordSchema = z.object({
  email: z.email()
})

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  })


export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type LoginValues = z.infer<typeof loginSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
