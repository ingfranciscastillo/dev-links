import { ArrowUpRight } from "lucide-react";
import type { StackOverflowPayload } from "@/lib/integrations/types";

export function StackOverflowBlock({
	payload,
}: {
	payload: StackOverflowPayload;
}) {
	const { user, answers } = payload;
	return (
		<section>
			<div className="mb-4 flex items-baseline justify-between">
				<h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
					Stack Overflow
				</h2>
				<a
					href={user.link}
					target="_blank"
					rel="noreferrer"
					className="font-mono text-xs text-muted-foreground hover:text-foreground"
				>
					{user.display_name} · {user.reputation.toLocaleString()} rep
				</a>
			</div>
			<div className="rounded-xl border border-hairline bg-surface p-4">
				<div className="flex items-center gap-4 text-xs">
					<Badge color="bg-amber-400" count={user.badges.gold} label="gold" />
					<Badge
						color="bg-zinc-300"
						count={user.badges.silver}
						label="silver"
					/>
					<Badge
						color="bg-orange-400"
						count={user.badges.bronze}
						label="bronze"
					/>
				</div>
				{answers.length > 0 && (
					<ul className="mt-4 divide-y divide-hairline">
						{answers.map((a) => (
							<li key={a.answer_id}>
								<a
									href={a.link}
									target="_blank"
									rel="noreferrer"
									className="flex items-center justify-between gap-4 py-2 text-sm hover:text-foreground"
								>
									<span className="min-w-0 truncate">{a.title}</span>
									<span className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground">
										+{a.score}
										<ArrowUpRight className="h-3.5 w-3.5" />
									</span>
								</a>
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}

function Badge({
	color,
	count,
	label,
}: {
	color: string;
	count: number;
	label: string;
}) {
	return (
		<span className="inline-flex items-center gap-1.5 text-muted-foreground">
			<span className={`h-2 w-2 rounded-full ${color}`} />
			<span className="font-medium text-foreground">{count}</span>
			{label}
		</span>
	);
}
