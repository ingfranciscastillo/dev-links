import { ArrowRightUpIcon } from "@solar-icons/react/linear";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";

import { GithubIcon } from "@/components/brand-icons";
import { authClient } from "@/lib/auth-client";

import { ThemeToggle } from "./ThemeToggle";

const nav = [
	{ label: "Features", href: "/#features" },
	{ label: "Examples", href: "/#examples" },
	{ label: "Pricing", href: "/#pricing" },
	{ label: "Discover", href: "/discover" },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function Header() {
	const { data: session } = authClient.useSession();
	const user = session?.user ?? null;
	const isAuthenticated = Boolean(user);
	const reduceMotion = useReducedMotion();

	return (
		<header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm">
			<motion.div
				className="mx-auto flex h-16 max-w-editorial items-center justify-between border-b border-border px-5 sm:px-8"
				initial={reduceMotion ? false : { opacity: 0, y: -12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{
					duration: reduceMotion ? 0.01 : 0.55,
					ease,
				}}
			>
				<motion.div
					initial={reduceMotion ? false : { opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.5,
						delay: reduceMotion ? 0 : 0.05,
						ease,
					}}
				>
					<Link to="/" className="group flex items-center gap-2.5">
						<span className="font-display text-xl leading-none tracking-[-0.03em] text-foreground">
							DevLinks
						</span>

						<span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition-colors group-hover:text-brand">
							01
						</span>
					</Link>
				</motion.div>

				<motion.nav
					className="hidden items-center gap-7 md:flex"
					initial={reduceMotion ? false : { opacity: 0, y: -6 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.45,
						delay: reduceMotion ? 0 : 0.12,
						ease,
					}}
				>
					{nav.map((item, index) => (
						<motion.a
							key={item.href}
							href={item.href}
							className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
							initial={reduceMotion ? false : { opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								duration: reduceMotion ? 0.01 : 0.4,
								delay: reduceMotion ? 0 : 0.16 + index * 0.05,
								ease,
							}}
						>
							{item.label}
						</motion.a>
					))}
				</motion.nav>

				<motion.div
					className="flex items-center gap-4"
					initial={reduceMotion ? false : { opacity: 0, x: 10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.5,
						delay: reduceMotion ? 0 : 0.1,
						ease,
					}}
				>
					<a
						href="https://github.com"
						target="_blank"
						rel="noreferrer"
						aria-label="GitHub"
						className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
					>
						<GithubIcon size={16} />
					</a>

					<ThemeToggle />

					{isAuthenticated && user ? (
						<Link
							to="/dashboard"
							className="group inline-flex items-center gap-2 border border-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand hover:text-brand"
						>
							Dashboard
							<ArrowRightUpIcon
								size={13}
								className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
							/>
						</Link>
					) : (
						<>
							<Link
								to="/login"
								search={{ redirect: undefined }}
								className="hidden font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
							>
								Sign in
							</Link>

							<Link
								to="/signup"
								search={{ username: undefined }}
								className="group inline-flex items-center gap-2 border border-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand hover:text-brand"
							>
								Get started
								<ArrowRightUpIcon
									size={13}
									className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
								/>
							</Link>
						</>
					)}
				</motion.div>
			</motion.div>
		</header>
	);
}
