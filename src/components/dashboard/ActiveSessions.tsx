import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import toast from "react-hot-toast";

import { authClient } from "@/lib/auth-client";

const sessionsKey = ["auth", "sessions"] as const;

// better-auth treats listing sessions as sensitive: it needs a sign-in from
// the last hour (session.freshAge), otherwise 403 SESSION_NOT_FRESH.
class NotFreshError extends Error {}

// "Chrome on Windows" from a user-agent string — just enough to tell the
// user's devices apart; unknown values fall back to a generic label.
function describeDevice(userAgent: string | null | undefined): string {
	const ua = userAgent ?? "";
	const browser = /Edg\//.test(ua)
		? "Edge"
		: /OPR\/|Opera/.test(ua)
			? "Opera"
			: /Firefox\//.test(ua)
				? "Firefox"
				: /Chrome\//.test(ua)
					? "Chrome"
					: /Safari\//.test(ua)
						? "Safari"
						: null;
	const os = /Windows/.test(ua)
		? "Windows"
		: /Android/.test(ua)
			? "Android"
			: /iPhone|iPad|iPod/.test(ua)
				? "iOS"
				: /Mac OS X/.test(ua)
					? "macOS"
					: /Linux/.test(ua)
						? "Linux"
						: null;
	if (browser && os) return `${browser} on ${os}`;
	return browser ?? os ?? "Unknown device";
}

export function ActiveSessions() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { data: current } = authClient.useSession();

	async function reauthenticate() {
		await authClient.signOut();
		await navigate({
			to: "/login",
			search: { redirect: "/dashboard/settings" },
		});
	}

	const sessions = useQuery({
		queryKey: sessionsKey,
		queryFn: async () => {
			const { data, error } = await authClient.listSessions();
			if (error?.code === "SESSION_NOT_FRESH") throw new NotFreshError();
			if (error) throw new Error(error.message ?? "Couldn't load sessions");
			return [...data].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
		},
		retry: false,
	});

	const revokeOne = useMutation({
		mutationFn: async (token: string) => {
			const { error } = await authClient.revokeSession({ token });
			if (error) throw new Error(error.message ?? "Couldn't sign out device");
		},
		onSuccess: () => toast.success("Device signed out"),
		onError: (err) => toast.error(err.message),
		onSettled: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
	});

	const revokeOthers = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.revokeOtherSessions();
			if (error) throw new Error(error.message ?? "Couldn't sign out devices");
		},
		onSuccess: () => toast.success("Signed out of all other devices"),
		onError: (err) => toast.error(err.message),
		onSettled: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
	});

	const currentId = current?.session.id;
	const list = sessions.data ?? [];
	const others = list.filter((s) => s.id !== currentId);

	return (
		<div className="mt-7 max-w-2xl">
			{sessions.isPending ? (
				<p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
					Loading sessions…
				</p>
			) : sessions.error instanceof NotFreshError ? (
				<div>
					<p className="text-sm leading-relaxed text-muted-foreground">
						For your security, managing devices requires a recent sign-in. Sign
						in again to see and sign out your other sessions.
					</p>
					<button
						type="button"
						onClick={reauthenticate}
						className="mt-4 border border-border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-transform active:scale-[0.98] hover:border-foreground hover:text-foreground"
					>
						Sign in again
					</button>
				</div>
			) : sessions.isError ? (
				<p className="text-sm text-destructive">{sessions.error.message}</p>
			) : (
				<ul className="divide-y divide-border border-y border-border">
					{list.map((s) => {
						const isCurrent = s.id === currentId;
						return (
							<li
								key={s.id}
								className="flex items-center justify-between gap-4 py-3"
							>
								<div className="min-w-0">
									<p className="truncate text-sm">
										{describeDevice(s.userAgent)}
										{isCurrent && (
											<span className="ml-2 font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
												This device
											</span>
										)}
									</p>
									<p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
										Signed in {new Date(s.createdAt).toLocaleString()}
										{s.ipAddress ? ` · ${s.ipAddress}` : ""}
									</p>
								</div>

								{!isCurrent && (
									<button
										type="button"
										onClick={() => revokeOne.mutate(s.token)}
										disabled={revokeOne.isPending}
										className="shrink-0 border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-transform active:scale-[0.98] hover:border-foreground hover:text-foreground disabled:opacity-50"
									>
										Sign out
									</button>
								)}
							</li>
						);
					})}
				</ul>
			)}

			{others.length > 0 && (
				<button
					type="button"
					onClick={() => revokeOthers.mutate()}
					disabled={revokeOthers.isPending}
					className="mt-6 border border-border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-transform active:scale-[0.98] hover:border-foreground hover:text-foreground disabled:opacity-50"
				>
					{revokeOthers.isPending
						? "Signing out…"
						: "Sign out of all other devices"}
				</button>
			)}
		</div>
	);
}
