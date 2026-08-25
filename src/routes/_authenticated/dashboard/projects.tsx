import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { Folder, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	useAddProject,
	useProfileData,
	useRemoveProject,
	useUpdateProject,
} from "@/lib/queries/profile-data";
import { type ProjectItem, projectSchema } from "@/lib/schemas";
import { zodField } from "@/lib/schemas/field";

export const Route = createFileRoute("/_authenticated/dashboard/projects")({
	head: () => ({ meta: [{ title: "Projects — DevLinks" }] }),
	component: ProjectsPage,
});

type ProjectFormValues = {
	name: string;
	description: string;
	tech: string;
	github: string;
	demo: string;
	status: "shipped" | "wip" | "archived";
};

const STATUS_OPTIONS = [
	{ value: "shipped", label: "Shipped" },
	{ value: "wip", label: "Work in progress" },
	{ value: "archived", label: "Archived" },
] as const;

function ProjectsPage() {
	const data = useProfileData();
	const addProject = useAddProject();
	const updateProject = useUpdateProject();
	const removeProject = useRemoveProject();
	const [editing, setEditing] = useState<ProjectItem | "new" | null>(null);

	return (
		<DashboardShell>
			<SectionHeader
				eyebrow="Content"
				title="Projects"
				description="Highlight what you've built. Add repo, demo, and tech stack."
				action={
					<Button onClick={() => setEditing("new")}>
						<Plus className="h-4 w-4" /> New project
					</Button>
				}
			/>

			{data.projects.length === 0 ? (
				<EmptyState
					icon={Folder}
					title="No projects yet"
					description="Add the ones you're proud of — side-projects count too."
					action={
						<Button onClick={() => setEditing("new")}>
							<Plus className="h-4 w-4" /> Add your first project
						</Button>
					}
				/>
			) : (
				<div className="grid gap-3 sm:grid-cols-2">
					{data.projects.map((p) => (
						<article
							key={p.id}
							className="rounded-xl border border-hairline bg-surface/40 p-4"
						>
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<p className="truncate font-medium">{p.name}</p>
									<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
										{p.description}
									</p>
								</div>
								<StatusBadge status={p.status} />
							</div>
							<div className="mt-3 flex flex-wrap gap-1.5">
								{p.tech.map((t) => (
									<span
										key={t}
										className="rounded-md bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
									>
										{t}
									</span>
								))}
							</div>
							<div className="mt-4 flex items-center justify-between">
								<div className="flex gap-3 text-xs text-muted-foreground">
									{p.github ? (
										<a
											href={p.github}
											target="_blank"
											rel="noreferrer"
											className="hover:text-foreground"
										>
											GitHub →
										</a>
									) : null}
									{p.demo ? (
										<a
											href={p.demo}
											target="_blank"
											rel="noreferrer"
											className="hover:text-foreground"
										>
											Demo →
										</a>
									) : null}
								</div>
								<div className="flex gap-1">
									<button
										type="button"
										onClick={() => setEditing(p)}
										className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
										title="Edit"
									>
										<Pencil className="h-4 w-4" />
									</button>
									<button
										type="button"
										onClick={() => {
											removeProject.mutate(p.id, {
												onSuccess: () => toast.success("Project removed"),
												onError: () => toast.error("Couldn't remove project"),
											});
										}}
										className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-destructive"
										title="Delete"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							</div>
						</article>
					))}
				</div>
			)}

			{editing !== null ? (
				<ProjectDialog
					initial={editing === "new" ? null : editing}
					onClose={() => setEditing(null)}
					onSubmit={(values) => {
						const projectValues = {
							name: values.name,
							description: values.description,
							tech: values.tech
								.split(",")
								.map((s) => s.trim())
								.filter(Boolean),
							github: values.github || "",
							demo: values.demo || "",
							status: values.status,
						};

						if (editing === "new") {
							addProject.mutate(projectValues, {
								onSuccess: () => {
									toast.success("Project created");
									setEditing(null);
								},
								onError: () => toast.error("Couldn't create project"),
							});
						} else {
							updateProject.mutate(
								{ id: editing.id, ...projectValues },
								{
									onSuccess: () => {
										toast.success("Project updated");
										setEditing(null);
									},
									onError: () => toast.error("Couldn't update project"),
								},
							);
						}
					}}
					pending={addProject.isPending || updateProject.isPending}
				/>
			) : null}
		</DashboardShell>
	);
}

function StatusBadge({ status }: { status: ProjectItem["status"] }) {
	const map = {
		shipped: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
		wip: "border-amber-500/30 bg-amber-500/10 text-amber-500",
		archived: "border-muted-foreground/20 bg-muted text-muted-foreground",
	} as const;
	return (
		<span
			className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${map[status]}`}
		>
			{status}
		</span>
	);
}

function ProjectDialog({
	initial,
	onClose,
	onSubmit,
	pending,
}: {
	initial: ProjectItem | null;
	onClose: () => void;
	onSubmit: (v: ProjectFormValues) => void;
	pending?: boolean;
}) {
	const form = useForm({
		defaultValues: {
			name: initial?.name ?? "",
			description: initial?.description ?? "",
			tech: initial?.tech.join(", ") ?? "",
			github: initial?.github ?? "",
			demo: initial?.demo ?? "",
			status: initial?.status ?? ("shipped" as const),
		},
		onSubmit: async ({ value }) => {
			onSubmit(value);
		},
	});

	return (
		<ModalShell
			title={initial ? "Edit project" : "New project"}
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
						name="name"
						validators={{
							onChange: zodField(projectSchema.shape.name),
						}}
					>
						{(field) => {
							const invalid =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;
							return (
								<Field data-invalid={invalid}>
									<FieldLabel htmlFor={field.name}>Name</FieldLabel>
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
						name="description"
						validators={{
							onChange: zodField(projectSchema.shape.description),
						}}
					>
						{(field) => {
							const invalid =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;
							return (
								<Field data-invalid={invalid}>
									<FieldLabel htmlFor={field.name}>Description</FieldLabel>
									<Textarea
										id={field.name}
										name={field.name}
										rows={3}
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

					<form.Field name="tech">
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>
									Tech (comma separated)
								</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="TypeScript, React, Postgres"
								/>
							</Field>
						)}
					</form.Field>

					<div className="grid gap-4 sm:grid-cols-2">
						<form.Field
							name="github"
							validators={{
								onChange: zodField(projectSchema.shape.github),
							}}
						>
							{(field) => {
								const invalid =
									field.state.meta.isTouched &&
									field.state.meta.errors.length > 0;
								return (
									<Field data-invalid={invalid}>
										<FieldLabel htmlFor={field.name}>GitHub URL</FieldLabel>
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

						<form.Field
							name="demo"
							validators={{
								onChange: zodField(projectSchema.shape.demo),
							}}
						>
							{(field) => {
								const invalid =
									field.state.meta.isTouched &&
									field.state.meta.errors.length > 0;
								return (
									<Field data-invalid={invalid}>
										<FieldLabel htmlFor={field.name}>Demo URL</FieldLabel>
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
					</div>

					<form.Field name="status">
						{(field) => (
							<Field>
								<FieldLabel htmlFor="status-select">Status</FieldLabel>
								<Select
									value={field.state.value}
									onValueChange={(v) =>
										field.handleChange(v as ProjectFormValues["status"])
									}
								>
									<SelectTrigger id="status-select">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{STATUS_OPTIONS.map((opt) => (
											<SelectItem key={opt.value} value={opt.value}>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						)}
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
