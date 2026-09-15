import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ location }) => {
		const session = await getSession();

		if (!session) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}

		// GitHub/Google sign-in creates the account directly — there's no
		// signup form to require a username (unlike email/password, see
		// /signup). Without this, a first-time OAuth user reaches the
		// dashboard with username: null and everything reading it breaks
		// silently (empty profile URL, etc).
		if (!session.user.username && location.pathname !== "/onboarding") {
			throw redirect({ to: "/onboarding" });
		}

		return { user: session.user };
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return <Outlet />;
}
