import { z } from "zod";

export const emailSchema = z
	.string()
	.min(1, "Email is required")
	.email("Enter a valid email");

export const passwordSchema = z.string().min(6, "At least 6 characters");

export const signInSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;
