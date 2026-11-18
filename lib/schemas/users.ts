import { z } from "zod"
import { passwordSchema } from "@/lib/schemas/auth"

export const createUserSchema = z.object({
  email: z.email("Enter a valid email address."),
  roles: z.array(z.string()).min(1, "Choose at least one role."),
  password: passwordSchema,
})

export type CreateUserValues = z.infer<typeof createUserSchema>

/** Shapes form values into the body `POST /auth/users` expects. */
export function toCreateUserPayload(values: CreateUserValues) {
  return {
    email: values.email.trim().toLowerCase(),
    password: values.password,
    role: values.roles[0],
    roles: values.roles,
    must_change_password: true as const,
  }
}

export type CreateUserPayload = ReturnType<typeof toCreateUserPayload>
