import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { Code2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
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
	useAddSnippet,
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
	const addSnippet = useAddSnippet();
	const updateSnippet = useUpdateSnippet();
	const removeSnippet = useRemoveSnippet();
	const [editing, setEditing] = useState<SnippetItem | "new" | null>(null);

	return (
		<>
			<SectionHeader
				eyebrow="Content"
				title="Snippets"
				description="Small pieces of code you reach for often, shared on your public page."
				action={
					<Button onClick={() => setEditing("new")}>
						<Plus className="h-4 w-4" /> New snippet
					</Button>
				}
			/>

			{data.snippets.length === 0 ? (
				<EmptyState
					icon={Code2}
					title="No snippets yet"
					description="Save that one-liner you always forget."
					action={
						<Button onClick={() => setEditing("new")}>
							<Plus className="h-4 w-4" /> Add your first snippet
						</Button>
					}
				/>
			) : (
				<div className="grid gap-3">
					{data.snippets.map((s) => (
						<article
							key={s.id}
							className="overflow-hidden rounded-xl border border-hairline bg-surface/40"
						>
							<header className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
								<div className="flex items-center gap-2">
									<span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
										{s.language}
									</span>
									<span className="text-sm font-medium">{s.title}</span>
								</div>
								<div className="flex gap-1">
									<button
										type="button"
										onClick={() => setEditing(s)}
										className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
										title="Edit"
									>
										<Pencil className="h-4 w-4" />
									</button>
									<button
										type="button"
										onClick={() => {
											removeSnippet.mutate(s.id, {
												onSuccess: () => toast.success("Snippet removed"),
												onError: () => toast.error("Couldn't remove snippet"),
											});
										}}
										className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-destructive"
										title="Delete"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							</header>
							<pre className="overflow-x-auto bg-background/60 p-4 font-mono text-xs leading-relaxed">
								<code>{s.code}</code>
							</pre>
						</article>
					))}
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
								onError: () => toast.error("Couldn't create snippet"),
							});
						} else {
							updateSnippet.mutate(
								{ id: editing.id, ...values },
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
		</>
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
	onSubmit: (v: SnippetFormValues) => void;
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
					<div className="grid grid-cols-[1fr_120px] gap-3">
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

						<form.Field name="language">
							{(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Language</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="ts"
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
									<FieldLabel htmlFor={field.name}>Code</FieldLabel>
									<Textarea
										id={field.name}
										name={field.name}
										rows={10}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className="font-mono text-xs"
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

				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" disabled={pending || !form.state.canSubmit}>
						{initial ? "Save" : "Create"}
					</Button>
				</div>
			</form>
		</ModalShell>
	);
}
