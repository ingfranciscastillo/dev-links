import { z } from "zod";

export const emailSchema = z
	.email("Enter a valid email")
	.min(1, "Email is required");

// Debe coincidir con minPasswordLength de better-auth (src/lib/auth.ts).
export const passwordSchema = z.string().min(8, "At least 8 characters");

export const signInSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
});

export const usernameSchema = z
	.string()
	.min(3, "At least 3 characters")
	.max(24, "At most 24 characters")
	.regex(/^[a-z0-9_-]+$/, "Only a-z, 0-9, _ and -");

export const nameSchema = z.string().min(2, "Tell us your name");

export const signUpSchema = z.object({
	name: nameSchema,
	username: usernameSchema,
	email: emailSchema,
	password: passwordSchema,
});

export const resetPasswordSchema = z
	.object({
		password: passwordSchema,
		confirm: z.string().min(1, "Confirm your password"),
	})
	.refine((d) => d.password === d.confirm, {
		message: "Passwords don't match",
		path: ["confirm"],
	});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
