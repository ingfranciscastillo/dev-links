import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ModalShell } from "@/components/dashboard/ModalShell";
import {
	EmptyState,
	SectionHeader,
} from "@/components/dashboard/SectionHeader";
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

	const sorted = [...data.articles].sort((a, b) => (a.date < b.date ? 1 : -1));

	return (
		<DashboardShell>
			<SectionHeader
				eyebrow="Content"
				title="Articles"
				description="Posts and writing you want on your page. Add manually for now."
				action={
					<Button onClick={() => setEditing("new")}>
						<Plus className="h-4 w-4" /> New article
					</Button>
				}
			/>

			{sorted.length === 0 ? (
				<EmptyState
					icon={FileText}
					title="No articles yet"
					description="Blog posts, talks, gists — anything with a URL."
					action={
						<Button onClick={() => setEditing("new")}>
							<Plus className="h-4 w-4" /> Add your first article
						</Button>
					}
				/>
			) : (
				<div className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline bg-surface/40">
					{sorted.map((a) => (
						<div key={a.id} className="flex items-center gap-4 p-4">
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{a.title}</p>
								<p className="mt-1 truncate text-xs text-muted-foreground">
									{a.source ? `${a.source} · ` : ""}
									{new Date(a.date).toLocaleDateString()}
									{a.summary ? ` · ${a.summary}` : ""}
								</p>
							</div>
							<div className="flex gap-1">
								<a
									href={a.url}
									target="_blank"
									rel="noreferrer"
									className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
								>
									Open ↗
								</a>
								<button
									type="button"
									onClick={() => setEditing(a)}
									className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
									title="Edit"
								>
									<Pencil className="h-4 w-4" />
								</button>
								<button
									type="button"
									onClick={() => {
										removeArticle.mutate(a.id, {
											onSuccess: () => window.alert("Article removed"),
											onError: () => window.alert("Couldn't remove article"),
										});
									}}
									className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-destructive"
									title="Delete"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{editing !== null ? (
				<ArticleDialog
					initial={editing === "new" ? null : editing}
					onClose={() => setEditing(null)}
					onSubmit={(v) => {
						if (editing === "new") {
							addArticle.mutate(v, {
								onSuccess: () => {
									window.alert("Article added");
									setEditing(null);
								},
								onError: () => window.alert("Couldn't add article"),
							});
						} else {
							updateArticle.mutate(
								{ id: editing.id, ...v },
								{
									onSuccess: () => {
										window.alert("Article updated");
										setEditing(null);
									},
									onError: () => window.alert("Couldn't update article"),
								},
							);
						}
					}}
					pending={addArticle.isPending || updateArticle.isPending}
				/>
			) : null}
		</DashboardShell>
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
	onSubmit: (v: ArticleFormValues) => void;
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
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="flex flex-col gap-4"
				noValidate
			>
				<FieldGroup>
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
									<FieldLabel htmlFor={field.name}>Title</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
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

					<form.Field
						name="url"
						validators={{ onChange: zodField(articleSchema.shape.url) }}
					>
						{(field) => {
							const invalid =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;
							return (
								<Field data-invalid={invalid}>
									<FieldLabel htmlFor={field.name}>URL</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="url"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
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

					<div className="grid grid-cols-2 gap-3">
						<form.Field name="source">
							{(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Source</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="Dev.to"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</Field>
							)}
						</form.Field>

						<form.Field name="date">
							{(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Date</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="date"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</Field>
							)}
						</form.Field>
					</div>

					<form.Field name="summary">
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Summary</FieldLabel>
								<Textarea
									id={field.name}
									name={field.name}
									rows={3}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</Field>
						)}
					</form.Field>
				</FieldGroup>

				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" disabled={pending || !form.state.canSubmit}>
						{initial ? "Save" : "Add"}
					</Button>
				</div>
			</form>
		</ModalShell>
	);
}
