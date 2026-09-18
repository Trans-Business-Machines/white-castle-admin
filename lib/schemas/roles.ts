import { z } from "zod"

export const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter a role name of at least 2 characters.")
    .max(50, "Keep the role name under 50 characters.")
    .regex(
      /^[A-Za-z0-9 _-]+$/,
      "Use letters, numbers, spaces, hyphens or underscores only."
    ),
  description: z
    .string()
    .trim()
    .min(1, "Describe what this role can do.")
    .max(200, "Keep the description under 200 characters."),
})

export type RoleValues = z.infer<typeof roleSchema>

export function toRolePayload(values: RoleValues) {
  const trimmed = values.name.trim().replace(/\s+/g, " ")
  return {
    name: trimmed.toLowerCase().replace(/[\s-]+/g, "_"),
    label: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
    description: values.description.trim(),
  }
}

export type RolePayload = ReturnType<typeof toRolePayload>
