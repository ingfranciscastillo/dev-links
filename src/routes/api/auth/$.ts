import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#/lib/auth";
import { methodNotAllowed } from "@/lib/http";

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			...methodNotAllowed(["GET", "POST"]),
			GET: ({ request }) => auth.handler(request),
			POST: ({ request }) => auth.handler(request),
		},
	},
});
