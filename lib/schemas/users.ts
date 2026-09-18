import { z } from "zod"
import { passwordSchema } from "@/lib/schemas/auth"

export const createUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Enter the user's full name.")
    .max(100, "Keep the name under 100 characters."),
  username: z
    .string()
    .trim()
    .min(3, "Username needs at least 3 characters.")
    .max(50, "Keep the username under 50 characters.")
    .regex(
      /^[A-Za-z0-9._-]+$/,
      "Use letters, numbers, dots, hyphens or underscores only."
    ),
  email: z.email("Enter a valid email address."),
  role: z.string().min(1, "Choose a role."),
  password: passwordSchema,
})

export type CreateUserValues = z.infer<typeof createUserSchema>

/** Shapes form values into the body `POST /auth/users` expects. */
export function toCreateUserPayload(values: CreateUserValues) {
  return {
    username: values.username.trim().toLowerCase(),
    email: values.email.trim().toLowerCase(),
    full_name: values.full_name.trim(),
    password: values.password,
    role: values.role,
    must_change_password: true as const,
  }
}

export type CreateUserPayload = ReturnType<typeof toCreateUserPayload>
