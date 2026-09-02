import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AddCircleIcon } from "@solar-icons/react/line-duotone";
import {
	EyeClosedIcon,
	EyeIcon,
	LinkIcon,
	PenIcon,
	SortVerticalIcon,
	TrashBin2Icon,
} from "@solar-icons/react/linear";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import toast from "react-hot-toast";

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
import { domainOf, iconForUrl } from "@/lib/icons";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import {
	useAddLink,
	useProfileCore,
	useProfileData,
	useRemoveLink,
	useReorderLinks,
	useToggleLink,
	useUpdateLink,
} from "@/lib/queries/profile-data";
import { type LinkItem, linkSchema } from "@/lib/schemas";
import { zodField } from "@/lib/schemas/field";

export const Route = createFileRoute("/_authenticated/dashboard/links")({
	head: () => ({ meta: [{ title: "Links — DevLinks" }] }),
	component: LinksPage,
});

function LinksPage() {
	const data = useProfileData();
	const core = useProfileCore();
	const addLink = useAddLink();
	const updateLink = useUpdateLink();
	const removeLink = useRemoveLink();
	const toggleLink = useToggleLink();
	const reorderLinks = useReorderLinks();

	const [editing, setEditing] = useState<LinkItem | "new" | null>(null);

	const isPro = core.data?.plan === "pro";
	const atCap = !isPro && data.links.length >= PLAN_LIMITS.free.links;

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 6 },
		}),
	);

	function onDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		const ids = data.links.map((link) => link.id);
		const oldIndex = ids.indexOf(String(active.id));
		const newIndex = ids.indexOf(String(over.id));

		if (oldIndex === -1 || newIndex === -1) return;

		reorderLinks.mutate(arrayMove(ids, oldIndex, newIndex));
	}

	return (
		<>
			<header className="border-b border-border pb-8">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					03 / Links
				</p>

				<div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
							Links.
						</h1>

						<p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
							The destinations you want visitors to find. Drag to reorder.
							{!isPro &&
								` ${data.links.length}/${PLAN_LIMITS.free.links} used on the Free plan.`}
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
						New link
					</Button>
				</div>
			</header>

			{data.links.length === 0 ? (
				<div className="mt-8">
					<EmptyState
						icon={LinkIcon}
						title="No links yet"
						description="Add your portfolio, GitHub, latest post, or anywhere else you want to send visitors."
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
								Add your first link
							</Button>
						}
					/>
				</div>
			) : (
				<div className="mt-8">
					<div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center border-t border-border py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground sm:grid-cols-[3rem_minmax(0,1fr)_12rem_auto]">
						<span>Order</span>
						<span>Link</span>
						<span className="hidden sm:block">Status</span>
						<span className="text-right">Actions</span>
					</div>

					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={onDragEnd}
					>
						<SortableContext
							items={data.links.map((link) => link.id)}
							strategy={verticalListSortingStrategy}
						>
							<ul>
								{data.links.map((link) => (
									<LinkRow
										key={link.id}
										link={link}
										onEdit={() => setEditing(link)}
										onToggle={() => toggleLink.mutate(link.id)}
										onRemove={() => {
											removeLink.mutate(link.id, {
												onSuccess: () => toast.success("Link removed"),
												onError: () => toast.error("Couldn't remove link"),
											});
										}}
									/>
								))}
							</ul>
						</SortableContext>
					</DndContext>
				</div>
			)}

			{editing !== null ? (
				<LinkDialog
					initial={editing === "new" ? null : editing}
					onClose={() => setEditing(null)}
					onSubmit={(values) => {
						if (editing === "new") {
							addLink.mutate(values, {
								onSuccess: () => {
									toast.success("Link created");
									setEditing(null);
								},
								onError: (err) =>
									toast.error(
										err instanceof Error ? err.message : "Couldn't create link",
									),
							});
						} else {
							updateLink.mutate(
								{
									id: editing.id,
									...values,
								},
								{
									onSuccess: () => {
										toast.success("Link updated");
										setEditing(null);
									},
									onError: () => toast.error("Couldn't update link"),
								},
							);
						}
					}}
					pending={addLink.isPending || updateLink.isPending}
				/>
			) : null}
		</>
	);
}

function LinkRow({
	link,
	onEdit,
	onToggle,
	onRemove,
}: {
	link: LinkItem;
	onEdit: () => void;
	onToggle: () => void;
	onRemove: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: link.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.55 : 1,
	};

	const Icon = iconForUrl(link.url);

	return (
		<li
			ref={setNodeRef}
			style={style}
			className={`group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center border-b border-border py-5 sm:grid-cols-[3rem_minmax(0,1fr)_12rem_auto] ${
				link.active ? "" : "opacity-55"
			}`}
		>
			<button
				type="button"
				{...attributes}
				{...listeners}
				className="flex h-8 w-8 cursor-grab touch-none items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
				aria-label="Drag to reorder"
			>
				<SortVerticalIcon className="h-4 w-4" strokeWidth={1.5} />
			</button>

			<div className="flex min-w-0 items-center gap-4 pr-4">
				<div className="flex h-9 w-9 shrink-0 items-center justify-center border border-border bg-surface text-muted-foreground">
					<Icon className="h-4 w-4" strokeWidth={1.5} />
				</div>

				<div className="min-w-0">
					<p className="truncate font-medium text-foreground">{link.title}</p>

					<p className="mt-1 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
						{domainOf(link.url)}
					</p>

					{link.description && (
						<p className="mt-2 hidden truncate text-xs text-muted-foreground sm:block">
							{link.description}
						</p>
					)}
				</div>
			</div>

			<div className="hidden sm:block">
				<span
					className={`inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] ${
						link.active ? "text-brand" : "text-muted-foreground"
					}`}
				>
					<span
						className={`h-1.5 w-1.5 rounded-full ${
							link.active ? "bg-brand" : "border border-muted-foreground"
						}`}
					/>
					{link.active ? "Visible" : "Hidden"}
				</span>
			</div>

			<div className="flex items-center justify-end gap-1">
				<button
					type="button"
					onClick={onToggle}
					className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
					title={link.active ? "Hide" : "Show"}
					aria-label={link.active ? "Hide link" : "Show link"}
				>
					{link.active ? (
						<EyeIcon className="h-4 w-4" strokeWidth={1.5} />
					) : (
						<EyeClosedIcon className="h-4 w-4" strokeWidth={1.5} />
					)}
				</button>

				<button
					type="button"
					onClick={onEdit}
					className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
					title="Edit"
					aria-label="Edit link"
				>
					<PenIcon className="h-4 w-4" strokeWidth={1.5} />
				</button>

				<button
					type="button"
					onClick={onRemove}
					className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-destructive"
					title="Delete"
					aria-label="Delete link"
				>
					<TrashBin2Icon className="h-4 w-4" strokeWidth={1.5} />
				</button>
			</div>
		</li>
	);
}

type LinkFormValues = {
	title: string;
	url: string;
	description: string;
};

function LinkDialog({
	initial,
	onClose,
	onSubmit,
	pending,
}: {
	initial: LinkItem | null;
	onClose: () => void;
	onSubmit: (values: LinkFormValues) => void;
	pending?: boolean;
}) {
	const form = useForm({
		defaultValues: {
			title: initial?.title ?? "",
			url: initial?.url ?? "",
			description: initial?.description ?? "",
		},
		onSubmit: async ({ value }) => {
			onSubmit(value);
		},
	});

	return (
		<ModalShell title={initial ? "Edit link" : "New link"} onClose={onClose}>
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
							onChange: zodField(linkSchema.shape.title),
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
										placeholder="My portfolio"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
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
							onChange: zodField(linkSchema.shape.url),
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
										placeholder="https://..."
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
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

					<form.Field name="description">
						{(field) => (
							<Field>
								<FieldLabel
									htmlFor={field.name}
									className="font-mono text-[10px] uppercase tracking-[0.08em]"
								>
									Description
									<span className="ml-1 text-muted-foreground">(optional)</span>
								</FieldLabel>

								<textarea
									id={field.name}
									name={field.name}
									rows={3}
									placeholder="Short line shown below the title"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									className="mt-2 w-full resize-none border-b border-border bg-transparent px-0 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
								/>
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
						{pending ? "Saving..." : initial ? "Save link" : "Create link"}
					</Button>
				</div>
			</form>
		</ModalShell>
	);
}
