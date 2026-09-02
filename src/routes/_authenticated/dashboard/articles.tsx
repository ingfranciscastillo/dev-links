import { AddCircleIcon } from "@solar-icons/react/line-duotone";
import { NotesIcon, PenIcon, TrashBin2Icon } from "@solar-icons/react/linear";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { ModalShell } from "@/components/dashboard/ModalShell";
import { EmptyState } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	useAddArticle,
	useProfileData,
	useRemoveArticle,
	useUpdateArticle,
} from "@/lib/queries/profile-data";
import { type ArticleItem, articleSchema } from "@/lib/schemas";
import { zodField } from "@/lib/schemas/field";

export const Route = createFileRoute("/_authenticated/dashboard/articles")({
	head: () => ({ meta: [{ title: "Articles — DevLinks" }] }),
	component: ArticlesPage,
});

function ArticlesPage() {
	const data = useProfileData();
	const addArticle = useAddArticle();
	const updateArticle = useUpdateArticle();
	const removeArticle = useRemoveArticle();
	const [editing, setEditing] = useState<ArticleItem | "new" | null>(null);
	const [removing, setRemoving] = useState<ArticleItem | null>(null);

	const sorted = [...data.articles].sort((a, b) => (a.date < b.date ? 1 : -1));

	return (
		<>
			<header className="border-b border-border pb-8">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					06 / Articles
				</p>

				<div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
					<div className="min-w-0">
						<h1 className="font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
							Articles.
						</h1>

						<p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
							Posts and writing you want visitors to discover on your profile.
						</p>
					</div>

					<Button
						onClick={() => setEditing("new")}
						className="h-10 shrink-0 rounded-none bg-foreground px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
					>
						<AddCircleIcon
							secondaryOpacity={0}
							size={25}
							className="h-3.5 w-3.5"
							strokeWidth={1.7}
						/>
						New article
					</Button>
				</div>
			</header>

			{sorted.length === 0 ? (
				<div className="mt-8">
					<EmptyState
						icon={NotesIcon}
						title="No articles yet"
						description="Blog posts, talks, gists — anything with a URL."
						action={
							<Button
								onClick={() => setEditing("new")}
								className="h-10 rounded-none bg-foreground px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
							>
								<AddCircleIcon
									secondaryOpacity={0}
									size={25}
									className="h-3.5 w-3.5"
									strokeWidth={1.7}
								/>
								Add your first article
							</Button>
						}
					/>
				</div>
			) : (
				<div className="mt-8">
					<div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center border-t border-border py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground sm:grid-cols-[5rem_minmax(0,1fr)_9rem_auto]">
						<span>Date</span>
						<span>Article</span>
						<span className="hidden sm:block">Source</span>
						<span className="text-right">Actions</span>
					</div>

					<div>
						{sorted.map((article, index) => (
							<ArticleRow
								key={article.id}
								article={article}
								index={index}
								onEdit={() => setEditing(article)}
								onRemove={() => setRemoving(article)}
							/>
						))}
					</div>
				</div>
			)}

			{editing !== null ? (
				<ArticleDialog
					initial={editing === "new" ? null : editing}
					onClose={() => setEditing(null)}
					onSubmit={(values) => {
						if (editing === "new") {
							addArticle.mutate(values, {
								onSuccess: () => {
									toast.success("Article added");
									setEditing(null);
								},
								onError: () => toast.error("Couldn't add article"),
							});
						} else {
							updateArticle.mutate(
								{
									id: editing.id,
									...values,
								},
								{
									onSuccess: () => {
										toast.success("Article updated");
										setEditing(null);
									},
									onError: () => toast.error("Couldn't update article"),
								},
							);
						}
					}}
					pending={addArticle.isPending || updateArticle.isPending}
				/>
			) : null}

			{removing ? (
				<ConfirmDialog
					title="Delete article"
					description={`"${removing.title}" will be removed from your public page. This can't be undone.`}
					pending={removeArticle.isPending}
					onClose={() => setRemoving(null)}
					onConfirm={() => {
						removeArticle.mutate(removing.id, {
							onSuccess: () => {
								toast.success("Article removed");
								setRemoving(null);
							},
							onError: (err) =>
								toast.error(
									err instanceof Error
										? err.message
										: "Couldn't remove article",
								),
						});
					}}
				/>
			) : null}
		</>
	);
}

function ArticleRow({
	article,
	index,
	onEdit,
	onRemove,
}: {
	article: ArticleItem;
	index: number;
	onEdit: () => void;
	onRemove: () => void;
}) {
	const date = new Date(article.date);

	return (
		<article className="group border-b border-border py-6 sm:py-7">
			<div className="grid gap-4 sm:grid-cols-[5rem_minmax(0,1fr)_9rem_auto] sm:items-center">
				<div>
					<p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
						{date.toLocaleDateString(undefined, {
							month: "short",
							day: "2-digit",
						})}
					</p>

					<p className="mt-1 font-mono text-[9px] tabular-nums text-muted-foreground">
						{date.getFullYear()}
					</p>
				</div>

				<div className="min-w-0">
					<div className="flex items-start gap-3">
						<span className="shrink-0 font-mono text-[9px] tabular-nums text-muted-foreground">
							{String(index + 1).padStart(2, "0")}
						</span>

						<h2 className="min-w-0 truncate font-display text-2xl tracking-tight sm:text-3xl">
							{article.title}
						</h2>
					</div>

					<div className="mt-2 pl-7">
						{article.summary && (
							<p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
								{article.summary}
							</p>
						)}

						<div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground sm:hidden">
							{article.source && <span>{article.source}</span>}
							{article.source && <span>/</span>}
							<a
								href={article.url}
								target="_blank"
								rel="noreferrer"
								className="transition-colors hover:text-brand"
							>
								Open ↗
							</a>
						</div>
					</div>
				</div>

				<div className="hidden min-w-0 sm:block">
					{article.source && (
						<p className="truncate font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
							{article.source}
						</p>
					)}
				</div>

				<div className="flex items-center justify-end gap-2">
					<a
						href={article.url}
						target="_blank"
						rel="noreferrer"
						className="hidden font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-brand sm:inline-flex"
					>
						Open ↗
					</a>

					<button
						type="button"
						onClick={onEdit}
						className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
						title="Edit"
						aria-label={`Edit ${article.title}`}
					>
						<PenIcon className="h-4 w-4" strokeWidth={1.5} />
					</button>

					<button
						type="button"
						onClick={onRemove}
						className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-destructive"
						title="Delete"
						aria-label={`Delete ${article.title}`}
					>
						<TrashBin2Icon className="h-4 w-4" strokeWidth={1.5} />
					</button>
				</div>
			</div>
		</article>
	);
}

type ArticleFormValues = {
	title: string;
	url: string;
	source: string;
	date: string;
	summary: string;
};

function ArticleDialog({
	initial,
	onClose,
	onSubmit,
	pending,
}: {
	initial: ArticleItem | null;
	onClose: () => void;
	onSubmit: (value: ArticleFormValues) => void;
	pending?: boolean;
}) {
	const today = new Date().toISOString().slice(0, 10);

	const form = useForm({
		defaultValues: {
			title: initial?.title ?? "",
			url: initial?.url ?? "",
			source: initial?.source ?? "",
			date: initial?.date?.slice(0, 10) ?? today,
			summary: initial?.summary ?? "",
		},
		onSubmit: async ({ value }) => {
			onSubmit(value);
		},
	});

	return (
		<ModalShell
			title={initial ? "Edit article" : "New article"}
			onClose={onClose}
		>
			{(requestClose) => (
				<form
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						form.handleSubmit();
					}}
					className="flex flex-col"
					noValidate
				>
					<FieldGroup className="gap-5">
						<form.Field
							name="title"
							validators={{
								onChange: zodField(articleSchema.shape.title),
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

						<form.Field
							name="url"
							validators={{
								onChange: zodField(articleSchema.shape.url),
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
											URL
										</FieldLabel>

										<Input
											id={field.name}
											name={field.name}
											type="url"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											aria-invalid={invalid || undefined}
											className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 font-mono text-sm shadow-none focus-visible:border-brand focus-visible:ring-0"
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

						<div className="grid gap-5 sm:grid-cols-2">
							<form.Field name="source">
								{(field) => (
									<Field>
										<FieldLabel
											htmlFor={field.name}
											className="font-mono text-[10px] uppercase tracking-[0.08em]"
										>
											Source
										</FieldLabel>

										<Input
											id={field.name}
											name={field.name}
											placeholder="Dev.to"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
										/>
									</Field>
								)}
							</form.Field>

							<form.Field name="date">
								{(field) => (
									<Field>
										<FieldLabel
											htmlFor={field.name}
											className="font-mono text-[10px] uppercase tracking-[0.08em]"
										>
											Date
										</FieldLabel>

										<Input
											id={field.name}
											name={field.name}
											type="date"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
										/>
									</Field>
								)}
							</form.Field>
						</div>

						<form.Field name="summary">
							{(field) => (
								<Field>
									<FieldLabel
										htmlFor={field.name}
										className="font-mono text-[10px] uppercase tracking-[0.08em]"
									>
										Summary
									</FieldLabel>

									<Textarea
										id={field.name}
										name={field.name}
										rows={3}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										className="mt-2 resize-none rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
									/>
								</Field>
							)}
						</form.Field>
					</FieldGroup>

					<div className="mt-6 flex items-center justify-between border-t border-border pt-5">
						<button
							type="button"
							onClick={requestClose}
							className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
						>
							Cancel
						</button>

						<Button
							type="submit"
							disabled={pending || !form.state.canSubmit}
							className="h-10 rounded-none bg-foreground px-5 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
						>
							{pending ? "Saving..." : initial ? "Save article" : "Add article"}
						</Button>
					</div>
				</form>
			)}
		</ModalShell>
	);
}
