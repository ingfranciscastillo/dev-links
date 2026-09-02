import { AddCircleIcon } from "@solar-icons/react/line-duotone";
import {
	ArrowRightUpIcon,
	FolderIcon,
	PenIcon,
	TrashBin2Icon,
} from "@solar-icons/react/linear";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import toast from "react-hot-toast";
import { GithubIcon } from "#/components/brand-icons";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import {
	useAddProject,
	useProfileCore,
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
	const core = useProfileCore();
	const addProject = useAddProject();
	const updateProject = useUpdateProject();
	const removeProject = useRemoveProject();
	const [editing, setEditing] = useState<ProjectItem | "new" | null>(null);

	const isPro = core.data?.plan === "pro";
	const atCap = !isPro && data.projects.length >= PLAN_LIMITS.free.projects;

	return (
		<>
			<header className="border-b border-border pb-8">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					04 / Projects
				</p>

				<div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
							Projects.
						</h1>

						<p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
							Highlight what you&apos;ve built. Add repositories, demos, and
							your stack.
							{!isPro &&
								` ${data.projects.length}/${PLAN_LIMITS.free.projects} used on the Free plan.`}
						</p>
					</div>

					<Button
						onClick={() => setEditing("new")}
						disabled={atCap}
						title={
							atCap ? "Free plan limit reached — upgrade to Pro" : undefined
						}
						className="h-10 rounded-none bg-foreground px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground disabled:pointer-events-none disabled:opacity-50"
					>
						<AddCircleIcon
							secondaryOpacity={0}
							size={25}
							className="h-3.5 w-3.5"
							strokeWidth={1.7}
						/>
						New project
					</Button>
				</div>
			</header>

			{data.projects.length === 0 ? (
				<div className="mt-8">
					<EmptyState
						icon={FolderIcon}
						title="No projects yet"
						description="Add the ones you&apos;re proud of — side projects count too."
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
								Add your first project
							</Button>
						}
					/>
				</div>
			) : (
				<div className="mt-8">
					<div className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center border-t border-border py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground sm:grid-cols-[4rem_minmax(0,1.4fr)_12rem_8rem_auto]">
						<span>#</span>
						<span>Project</span>
						<span className="hidden sm:block">Stack</span>
						<span className="hidden sm:block">Status</span>
						<span className="text-right">Actions</span>
					</div>

					<div>
						{data.projects.map((project, index) => (
							<ProjectRow
								key={project.id}
								project={project}
								index={index}
								onEdit={() => setEditing(project)}
								onRemove={() => {
									removeProject.mutate(project.id, {
										onSuccess: () => toast.success("Project removed"),
										onError: () => toast.error("Couldn't remove project"),
									});
								}}
							/>
						))}
					</div>
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
								.map((value) => value.trim())
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
								onError: (err) =>
									toast.error(
										err instanceof Error
											? err.message
											: "Couldn't create project",
									),
							});
						} else {
							updateProject.mutate(
								{
									id: editing.id,
									...projectValues,
								},
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
		</>
	);
}

function ProjectRow({
	project,
	index,
	onEdit,
	onRemove,
}: {
	project: ProjectItem;
	index: number;
	onEdit: () => void;
	onRemove: () => void;
}) {
	return (
		<article className="group grid gap-5 border-b border-border py-6 sm:grid-cols-[4rem_minmax(0,1.4fr)_12rem_8rem_auto] sm:items-center sm:px-3 sm:py-7">
			<span className="font-mono text-[10px] tabular-nums text-muted-foreground">
				{String(index + 1).padStart(2, "0")}
			</span>

			<div className="min-w-0">
				<div className="flex items-start gap-3">
					<h2 className="truncate font-display text-2xl tracking-tight sm:text-3xl">
						{project.name}
					</h2>

					<div className="shrink-0 sm:hidden">
						<StatusLabel status={project.status} />
					</div>
				</div>

				<p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
					{project.description}
				</p>

				<div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 sm:hidden">
					{project.tech.map((technology) => (
						<span
							key={technology}
							className="font-mono text-[9px] uppercase tracking-[0.04em] text-muted-foreground"
						>
							{technology}
						</span>
					))}
				</div>
			</div>

			<div className="hidden flex-wrap gap-x-3 gap-y-1 sm:flex">
				{project.tech.map((technology) => (
					<span
						key={technology}
						className="font-mono text-[9px] uppercase tracking-[0.04em] text-muted-foreground"
					>
						{technology}
					</span>
				))}
			</div>

			<div className="hidden sm:block">
				<StatusLabel status={project.status} />
			</div>

			<div className="flex items-center justify-end gap-1">
				{project.github ? (
					<a
						href={project.github}
						target="_blank"
						rel="noreferrer"
						className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
						title="GitHub"
						aria-label={`Open ${project.name} on GitHub`}
					>
						<GithubIcon className="h-4 w-4" />
					</a>
				) : null}

				{project.demo ? (
					<a
						href={project.demo}
						target="_blank"
						rel="noreferrer"
						className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-brand"
						title="Demo"
						aria-label={`Open ${project.name} demo`}
					>
						<ArrowRightUpIcon className="h-4 w-4" strokeWidth={1.5} />
					</a>
				) : null}

				<button
					type="button"
					onClick={onEdit}
					className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
					title="Edit"
					aria-label={`Edit ${project.name}`}
				>
					<PenIcon className="h-4 w-4" strokeWidth={1.5} />
				</button>

				<button
					type="button"
					onClick={onRemove}
					className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-destructive"
					title="Delete"
					aria-label={`Delete ${project.name}`}
				>
					<TrashBin2Icon className="h-4 w-4" strokeWidth={1.5} />
				</button>
			</div>
		</article>
	);
}

function StatusLabel({ status }: { status: ProjectItem["status"] }) {
	const label = {
		shipped: "Shipped",
		wip: "In progress",
		archived: "Archived",
	}[status];

	const color = {
		shipped: "text-brand",
		wip: "text-foreground",
		archived: "text-muted-foreground",
	}[status];

	return (
		<span
			className={`inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] ${color}`}
		>
			<span
				className={`h-1.5 w-1.5 rounded-full ${
					status === "shipped"
						? "bg-brand"
						: status === "wip"
							? "border border-foreground"
							: "border border-muted-foreground"
				}`}
			/>

			{label}
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
	onSubmit: (value: ProjectFormValues) => void;
	pending?: boolean;
}) {
	const form = useForm({
		defaultValues: {
			name: initial?.name ?? "",
			description: initial?.description ?? "",
			tech: initial?.tech.join(", ") ?? "",
			github: initial?.github ?? "",
			demo: initial?.demo ?? "",
			status: initial?.status ?? "shipped",
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
				className="flex flex-col"
				noValidate
			>
				<FieldGroup className="gap-5">
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
									<FieldLabel
										htmlFor={field.name}
										className="font-mono text-[10px] uppercase tracking-[0.08em]"
									>
										Name
									</FieldLabel>

									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
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
									<FieldLabel
										htmlFor={field.name}
										className="font-mono text-[10px] uppercase tracking-[0.08em]"
									>
										Description
									</FieldLabel>

									<Textarea
										id={field.name}
										name={field.name}
										rows={3}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={invalid || undefined}
										className="mt-2 resize-none rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
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
								<FieldLabel
									htmlFor={field.name}
									className="font-mono text-[10px] uppercase tracking-[0.08em]"
								>
									Tech
									<span className="ml-1 text-muted-foreground">
										(comma separated)
									</span>
								</FieldLabel>

								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="TypeScript, React, Postgres"
									className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
								/>
							</Field>
						)}
					</form.Field>

					<div className="grid gap-5 sm:grid-cols-2">
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
										<FieldLabel
											htmlFor={field.name}
											className="font-mono text-[10px] uppercase tracking-[0.08em]"
										>
											GitHub URL
										</FieldLabel>

										<Input
											id={field.name}
											name={field.name}
											type="url"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
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
										<FieldLabel
											htmlFor={field.name}
											className="font-mono text-[10px] uppercase tracking-[0.08em]"
										>
											Demo URL
										</FieldLabel>

										<Input
											id={field.name}
											name={field.name}
											type="url"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
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
					</div>

					<form.Field name="status">
						{(field) => (
							<Field>
								<FieldLabel
									htmlFor="status-select"
									className="font-mono text-[10px] uppercase tracking-[0.08em]"
								>
									Status
								</FieldLabel>

								<Select
									value={field.state.value}
									onValueChange={(value) =>
										field.handleChange(value as ProjectFormValues["status"])
									}
								>
									<SelectTrigger
										id="status-select"
										className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus:ring-0"
									>
										<SelectValue />
									</SelectTrigger>

									<SelectContent>
										{STATUS_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						)}
					</form.Field>
				</FieldGroup>

				<div className="mt-6 flex items-center justify-between border-t border-border pt-5">
					<button
						type="button"
						onClick={onClose}
						className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
					>
						Cancel
					</button>

					<Button
						type="submit"
						disabled={pending || !form.state.canSubmit}
						className="h-10 rounded-none bg-foreground px-5 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
					>
						{pending
							? "Saving..."
							: initial
								? "Save project"
								: "Create project"}
					</Button>
				</div>
			</form>
		</ModalShell>
	);
}
