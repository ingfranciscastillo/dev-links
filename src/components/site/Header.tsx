import {
	ArrowRightUpIcon,
	CloseIcon,
	HamburgerMenuIcon,
} from "@solar-icons/react/linear";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { GithubIcon } from "@/components/brand-icons";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "./ThemeToggle";

const nav = [
	{ label: "Features", href: "/#features" },
	{ label: "Pricing", href: "/#pricing" },
	{ label: "Discover", href: "/discover" },
	{ label: "Blog", href: "/blog" },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function Header() {
	const { data: session } = authClient.useSession();
	const user = session?.user ?? null;
	const isAuthenticated = Boolean(user);
	const reduceMotion = useReducedMotion();
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm">
			<motion.div
				className="mx-auto grid h-16 max-w-editorial grid-cols-[1fr_auto_1fr] items-center border-b border-border px-5 sm:px-8"
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
					<Link to="/" className="group flex w-fit items-center gap-2.5">
						<span className="font-display text-xl leading-none tracking-[-0.03em] text-foreground">
							DevLinks
						</span>

						<span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition-colors group-hover:text-brand">
							01
						</span>
					</Link>
				</motion.div>

				<motion.nav
					className="col-start-2 hidden items-center justify-self-center gap-7 md:flex"
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
					className="col-start-3 flex items-center justify-self-end gap-4"
					initial={reduceMotion ? false : { opacity: 0, x: 10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.5,
						delay: reduceMotion ? 0 : 0.1,
						ease,
					}}
				>
					<button
						type="button"
						onClick={() => setMobileOpen((open) => !open)}
						aria-label={mobileOpen ? "Close menu" : "Open menu"}
						aria-expanded={mobileOpen}
						className="relative inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-[color,transform] active:scale-90 hover:text-foreground md:hidden"
					>
						<HamburgerMenuIcon
							strokeWidth={1.7}
							className={cn(
								"absolute h-5 w-5 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
								mobileOpen ? "scale-50 opacity-0" : "scale-100 opacity-100",
							)}
						/>
						<CloseIcon
							strokeWidth={1.7}
							className={cn(
								"absolute h-5 w-5 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
								mobileOpen ? "scale-100 opacity-100" : "scale-50 opacity-0",
							)}
						/>
					</button>

					<a
						href="https://github.com/ingfranciscastillo/dev-links"
						target="_blank"
						rel="noreferrer"
						aria-label="GitHub"
						className="hidden text-muted-foreground transition-[color,transform] active:scale-90 hover:text-foreground sm:inline-flex"
					>
						<GithubIcon size={16} />
					</a>

					<ThemeToggle />

					{isAuthenticated && user ? (
						<Link
							to="/dashboard"
							className="group inline-flex items-center gap-2 border border-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-[color,border-color,transform] active:scale-[0.97] hover:border-brand hover:text-brand"
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
								className="group inline-flex items-center gap-2 border border-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-[color,border-color,transform] active:scale-[0.97] hover:border-brand hover:text-brand"
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

			<AnimatePresence>
				{mobileOpen && (
					<MobileMenuPanel
						onClose={() => setMobileOpen(false)}
						isAuthenticated={isAuthenticated}
						reduceMotion={Boolean(reduceMotion)}
					/>
				)}
			</AnimatePresence>
		</header>
	);
}

function MobileMenuPanel({
	onClose,
	isAuthenticated,
	reduceMotion,
}: {
	onClose: () => void;
	isAuthenticated: boolean;
	reduceMotion: boolean;
}) {
	return (
		<div className="fixed inset-x-0 top-16 z-40 md:hidden" role="presentation">
			<motion.button
				type="button"
				aria-label="Close menu"
				onClick={onClose}
				className="absolute inset-0 bg-background/80 backdrop-blur-sm"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: reduceMotion ? 0.01 : 0.2, ease }}
			/>

			<motion.div
				role="dialog"
				aria-modal="true"
				aria-label="Mobile navigation"
				className="relative border-b border-border bg-background"
				initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
				transition={{ duration: reduceMotion ? 0.01 : 0.22, ease }}
			>
				<nav className="flex flex-col px-5 py-2 sm:px-8">
					{nav.map((item, index) => (
						<motion.a
							key={item.href}
							href={item.href}
							onClick={onClose}
							className="border-b border-border py-3.5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors last:border-b-0 hover:text-foreground"
							initial={reduceMotion ? false : { opacity: 0, x: -8 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{
								duration: reduceMotion ? 0.01 : 0.3,
								delay: reduceMotion ? 0 : 0.04 * index,
								ease,
							}}
						>
							{item.label}
						</motion.a>
					))}
				</nav>

				<div className="flex items-center justify-between gap-4 border-t border-border px-5 py-4 sm:px-8">
					<a
						href="https://github.com/ingfranciscastillo/dev-links"
						target="_blank"
						rel="noreferrer"
						aria-label="GitHub"
						onClick={onClose}
						className="inline-flex items-center gap-2 text-muted-foreground transition-[color,transform] active:scale-90 hover:text-foreground"
					>
						<GithubIcon size={16} />
						<span className="font-mono text-[10px] uppercase tracking-widest">
							GitHub
						</span>
					</a>

					{!isAuthenticated && (
						<Link
							to="/login"
							search={{ redirect: undefined }}
							onClick={onClose}
							className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
						>
							Sign in
						</Link>
					)}
				</div>
			</motion.div>
		</div>
	);
}
