import {
	AddIcon,
	CodeSquareIcon,
	MenuDotsIcon,
	PenIcon,
	TrashBin2Icon,
} from "@solar-icons/react/linear";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import posthog from "posthog-js";
import { useState } from "react";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { LimitReachedModal } from "@/components/dashboard/LimitReachedModal";
import { ModalShell } from "@/components/dashboard/ModalShell";
import { EmptyState } from "@/components/dashboard/SectionHeader";
import { PageTitle } from "@/components/motion/PageTitle";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import {
	useAddSnippet,
	useProfileCore,
	useProfileData,
	useRemoveSnippet,
	useUpdateSnippet,
} from "@/lib/queries/profile-data";
import { type SnippetItem, snippetSchema } from "@/lib/schemas";
import { zodField } from "@/lib/schemas/field";

export const Route = createFileRoute("/_authenticated/dashboard/snippets")({
	head: () => ({ meta: [{ title: "Snippets — DevLinks" }] }),
	component: SnippetsPage,
});

type SnippetFormValues = {
	title: string;
	language: string;
	code: string;
};

function SnippetsPage() {
	const data = useProfileData();
	const core = useProfileCore();
	const addSnippet = useAddSnippet();
	const updateSnippet = useUpdateSnippet();
	const removeSnippet = useRemoveSnippet();
	const [editing, setEditing] = useState<SnippetItem | "new" | null>(null);
	const [removing, setRemoving] = useState<SnippetItem | null>(null);
	const [showUpgrade, setShowUpgrade] = useState(false);

	const isPro = core.data?.plan === "pro";
	const atCap = !isPro && data.snippets.length >= PLAN_LIMITS.free.snippets;

	function handleNewSnippet() {
		if (atCap) {
			posthog.capture("paywall_shown", { resource: "snippets" });
			setShowUpgrade(true);
			return;
		}
		setEditing("new");
	}

	return (
		<>
			<header className="border-b border-border pb-8">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					05 / Snippets
				</p>

				<div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
					<div className="min-w-0">
						<PageTitle className="font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
							Snippets.
						</PageTitle>

						<p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
							Small pieces of code you reach for often, shared on your public
							page.
							{!isPro &&
								` ${data.snippets.length}/${PLAN_LIMITS.free.snippets} used on the Free plan.`}
						</p>
					</div>

					<Button
						onClick={handleNewSnippet}
						className="h-10 shrink-0 rounded-none bg-foreground px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
					>
						<AddIcon className="h-3.5 w-3.5" strokeWidth={1} />
						New snippet
					</Button>
				</div>
			</header>

			{data.snippets.length === 0 ? (
				<div className="mt-8">
					<EmptyState
						icon={CodeSquareIcon}
						title="No snippets yet"
						description="Save that one-liner you always forget."
						action={
							<Button
								onClick={() => setEditing("new")}
								className="h-10 rounded-none bg-foreground px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
							>
								<AddIcon className="h-3.5 w-3.5" strokeWidth={1} />
								Add your first snippet
							</Button>
						}
					/>
				</div>
			) : (
				<div className="mt-8 space-y-8">
					<div className="flex items-center justify-between border-t border-border pt-3">
						<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
							{data.snippets.length.toString().padStart(2, "0")} snippets
						</p>

						<p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
							Code library
						</p>
					</div>

					<div className="space-y-8">
						{data.snippets.map((snippet, index) => (
							<SnippetEntry
								key={snippet.id}
								snippet={snippet}
								index={index}
								onEdit={() => setEditing(snippet)}
								onRemove={() => setRemoving(snippet)}
							/>
						))}
					</div>
				</div>
			)}

			{editing !== null ? (
				<SnippetDialog
					initial={editing === "new" ? null : editing}
					onClose={() => setEditing(null)}
					onSubmit={(values) => {
						if (editing === "new") {
							addSnippet.mutate(values, {
								onSuccess: () => {
									toast.success("Snippet created");
									setEditing(null);
								},
								onError: (err) =>
									toast.error(
										err instanceof Error
											? err.message
											: "Couldn't create snippet",
									),
							});
						} else {
							updateSnippet.mutate(
								{
									id: editing.id,
									...values,
								},
								{
									onSuccess: () => {
										toast.success("Snippet updated");
										setEditing(null);
									},
									onError: () => toast.error("Couldn't update snippet"),
								},
							);
						}
					}}
					pending={addSnippet.isPending || updateSnippet.isPending}
				/>
			) : null}

			{removing ? (
				<ConfirmDialog
					title="Delete snippet"
					description={`"${removing.title}" will be removed from your public page. This can't be undone.`}
					pending={removeSnippet.isPending}
					onClose={() => setRemoving(null)}
					onConfirm={() => {
						removeSnippet.mutate(removing.id, {
							onSuccess: () => {
								toast.success("Snippet removed");
								setRemoving(null);
							},
							onError: (err) =>
								toast.error(
									err instanceof Error
										? err.message
										: "Couldn't remove snippet",
								),
						});
					}}
				/>
			) : null}

			{showUpgrade && (
				<LimitReachedModal
					resource="snippets"
					limit={PLAN_LIMITS.free.snippets}
					onClose={() => setShowUpgrade(false)}
				/>
			)}
		</>
	);
}

function SnippetEntry({
	snippet,
	index,
	onEdit,
	onRemove,
}: {
	snippet: SnippetItem;
	index: number;
	onEdit: () => void;
	onRemove: () => void;
}) {
	return (
		<article className="border-b border-border pb-8">
			<header className="flex flex-col gap-4 border-t border-border py-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex min-w-0 items-baseline gap-3">
					<span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
						{String(index + 1).padStart(2, "0")}
					</span>

					<h2 className="truncate font-display text-2xl tracking-tight sm:text-3xl">
						{snippet.title}
					</h2>

					<span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] text-brand">
						{snippet.language}
					</span>
				</div>

				<div className="flex items-center self-end sm:self-auto">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
								aria-label={`${snippet.title} actions`}
							>
								<MenuDotsIcon className="h-4 w-4" strokeWidth={1.5} />
							</button>
						</DropdownMenuTrigger>

						<DropdownMenuContent>
							<DropdownMenuItem onSelect={onEdit}>
								<PenIcon className="h-4 w-4" strokeWidth={1.5} />
								Edit
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							<DropdownMenuItem variant="destructive" onSelect={onRemove}>
								<TrashBin2Icon className="h-4 w-4" strokeWidth={1.5} />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</header>

			<div className="overflow-hidden border border-border bg-surface">
				<pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-foreground sm:p-6">
					<code>{snippet.code}</code>
				</pre>
			</div>
		</article>
	);
}

function SnippetDialog({
	initial,
	onClose,
	onSubmit,
	pending,
}: {
	initial: SnippetItem | null;
	onClose: () => void;
	onSubmit: (value: SnippetFormValues) => void;
	pending?: boolean;
}) {
	const form = useForm({
		defaultValues: {
			title: initial?.title ?? "",
			language: initial?.language ?? "ts",
			code: initial?.code ?? "",
		},
		onSubmit: async ({ value }) => {
			onSubmit(value);
		},
	});

	return (
		<ModalShell
			title={initial ? "Edit snippet" : "New snippet"}
			onClose={onClose}
			footer={(requestClose) => (
				<>
					<button
						type="button"
						onClick={requestClose}
						className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
					>
						Cancel
					</button>

					<Button
						type="submit"
						form="snippet-dialog-form"
						disabled={pending || !form.state.canSubmit}
						className="h-10 rounded-none bg-foreground px-5 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
					>
						{pending
							? "Saving..."
							: initial
								? "Save snippet"
								: "Create snippet"}
					</Button>
				</>
			)}
		>
			{() => (
				<form
					id="snippet-dialog-form"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						form.handleSubmit();
					}}
					className="flex flex-col"
					noValidate
				>
					<FieldGroup className="gap-5">
						<div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_8rem]">
							<form.Field
								name="title"
								validators={{
									onChange: zodField(snippetSchema.shape.title),
								}}
							>
								{(field) => {
									const invalid =
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0;

									return (
										<Field data-invalid={invalid}>
											<FieldLabel
												htmlFor={field.name}
												className="font-mono text-[10px] uppercase tracking-[0.08em]"
											>
												Title
											</FieldLabel>

											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												aria-invalid={invalid || undefined}
												className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
											/>

											{invalid ? (
												<FieldError>
													{field.state.meta.errors.join(", ")}
												</FieldError>
											) : null}
										</Field>
									);
								}}
							</form.Field>

							<form.Field name="language">
								{(field) => (
									<Field>
										<FieldLabel
											htmlFor={field.name}
											className="font-mono text-[10px] uppercase tracking-[0.08em]"
										>
											Language
										</FieldLabel>

										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											placeholder="ts"
											className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 font-mono text-sm shadow-none focus-visible:border-brand focus-visible:ring-0"
										/>
									</Field>
								)}
							</form.Field>
						</div>

						<form.Field
							name="code"
							validators={{
								onChange: zodField(snippetSchema.shape.code),
							}}
						>
							{(field) => {
								const invalid =
									field.state.meta.isTouched &&
									field.state.meta.errors.length > 0;

								return (
									<Field data-invalid={invalid}>
										<FieldLabel
											htmlFor={field.name}
											className="font-mono text-[10px] uppercase tracking-[0.08em]"
										>
											Code
										</FieldLabel>

										<Textarea
											id={field.name}
											name={field.name}
											rows={12}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											className="mt-2 resize-none rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 font-mono text-xs leading-relaxed shadow-none focus-visible:border-brand focus-visible:ring-0"
											aria-invalid={invalid || undefined}
										/>

										{invalid ? (
											<FieldError>
												{field.state.meta.errors.join(", ")}
											</FieldError>
										) : null}
									</Field>
								);
							}}
						</form.Field>
					</FieldGroup>
				</form>
			)}
		</ModalShell>
	);
}
