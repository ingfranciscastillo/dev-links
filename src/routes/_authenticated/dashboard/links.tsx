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
import { createFileRoute } from "@tanstack/react-router";
import {
	Eye,
	EyeOff,
	GripVertical,
	Link as LinkIcon,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ModalShell } from "@/components/dashboard/ModalShell";
import {
	EmptyState,
	SectionHeader,
} from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { domainOf, iconForUrl } from "@/lib/icons";
import {
	useAddLink,
	useProfileData,
	useRemoveLink,
	useReorderLinks,
	useToggleLink,
	useUpdateLink,
} from "@/lib/queries/profile-data";
import { type LinkItem, linkSchema } from "@/lib/schemas";

export const Route = createFileRoute("/_authenticated/dashboard/links")({
	head: () => ({ meta: [{ title: "Links — DevLinks" }] }),
	component: LinksPage,
});

const formSchema = linkSchema.omit({ id: true, active: true });

function LinksPage() {
	const data = useProfileData();
	const addLink = useAddLink();
	const updateLink = useUpdateLink();
	const removeLink = useRemoveLink();
	const toggleLink = useToggleLink();
	const reorderLinks = useReorderLinks();
	const [editing, setEditing] = useState<LinkItem | "new" | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);

	function onDragEnd(e: DragEndEvent) {
		const { active, over } = e;
		if (!over || active.id === over.id) return;
		const ids = data.links.map((l) => l.id);
		const oldIdx = ids.indexOf(String(active.id));
		const newIdx = ids.indexOf(String(over.id));
		if (oldIdx === -1 || newIdx === -1) return;
		reorderLinks.mutate(arrayMove(ids, oldIdx, newIdx));
	}

	return (
		<DashboardShell>
			<SectionHeader
				eyebrow="Content"
				title="Links"
				description="Anything you want visitors to click. Drag to reorder."
				action={
					<Button onClick={() => setEditing("new")}>
						<Plus className="h-4 w-4" /> New link
					</Button>
				}
			/>

			{data.links.length === 0 ? (
				<EmptyState
					icon={LinkIcon}
					title="No links yet"
					description="Add your portfolio, GitHub, latest post, anywhere you want to send visitors."
					action={
						<Button onClick={() => setEditing("new")}>
							<Plus className="h-4 w-4" /> Add your first link
						</Button>
					}
				/>
			) : (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={onDragEnd}
				>
					<SortableContext
						items={data.links.map((l) => l.id)}
						strategy={verticalListSortingStrategy}
					>
						<ul className="space-y-2">
							{data.links.map((l) => (
								<LinkRow
									key={l.id}
									link={l}
									onEdit={() => setEditing(l)}
									onToggle={() => toggleLink.mutate(l.id)}
									onRemove={() => {
										removeLink.mutate(l.id, {
											onSuccess: () => window.alert("Link removed"),
											onError: () => window.alert("Couldn't remove link"),
										});
									}}
								/>
							))}
						</ul>
					</SortableContext>
				</DndContext>
			)}

			{editing !== null ? (
				<LinkDialog
					initial={editing === "new" ? null : editing}
					onClose={() => setEditing(null)}
					onSubmit={(values) => {
						if (editing === "new") {
							addLink.mutate(values, {
								onSuccess: () => {
									window.alert("Link created");
									setEditing(null);
								},
								onError: () => window.alert("Couldn't create link"),
							});
						} else {
							updateLink.mutate(
								{ id: editing.id, ...values },
								{
									onSuccess: () => {
										window.alert("Link updated");
										setEditing(null);
									},
									onError: () => window.alert("Couldn't update link"),
								},
							);
						}
					}}
					pending={addLink.isPending || updateLink.isPending}
				/>
			) : null}
		</DashboardShell>
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
		opacity: isDragging ? 0.6 : 1,
	};
	const Icon = iconForUrl(link.url);

	return (
		<li
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-3 rounded-xl border border-hairline bg-surface/40 p-3 ${
				link.active ? "" : "opacity-60"
			}`}
		>
			<button
				type="button"
				{...attributes}
				{...listeners}
				className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground"
				aria-label="Drag to reorder"
			>
				<GripVertical className="h-4 w-4" />
			</button>
			<span className="grid h-9 w-9 place-items-center rounded-md border border-hairline bg-background text-muted-foreground">
				<Icon className="h-4 w-4" />
			</span>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium">{link.title}</p>
				<p className="truncate text-xs text-muted-foreground">
					{domainOf(link.url)}
				</p>
			</div>
			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={onToggle}
					className="rounded-md p-2 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
					title={link.active ? "Hide" : "Show"}
				>
					{link.active ? (
						<Eye className="h-4 w-4" />
					) : (
						<EyeOff className="h-4 w-4" />
					)}
				</button>
				<button
					type="button"
					onClick={onEdit}
					className="rounded-md p-2 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
					title="Edit"
				>
					<Pencil className="h-4 w-4" />
				</button>
				<button
					type="button"
					onClick={onRemove}
					className="rounded-md p-2 text-muted-foreground hover:bg-surface-elevated hover:text-destructive"
					title="Delete"
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</div>
		</li>
	);
}

function LinkDialog({
	initial,
	onClose,
	onSubmit,
	pending,
}: {
	initial: LinkItem | null;
	onClose: () => void;
	onSubmit: (values: z.infer<typeof formSchema>) => void;
	pending?: boolean;
}) {
	const [errors, setErrors] = useState<Record<string, string | undefined>>({});
	const fields = {
		title: initial?.title ?? "",
		url: initial?.url ?? "",
		description: initial?.description ?? "",
	};

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const parsed = formSchema.safeParse({
			title: fd.get("title"),
			url: fd.get("url"),
			description: fd.get("description") || "",
		});
		if (!parsed.success) {
			const f = parsed.error.flatten().fieldErrors;
			setErrors({
				title: f.title?.[0],
				url: f.url?.[0],
				description: f.description?.[0],
			});
			return;
		}
		setErrors({});
		onSubmit(parsed.data);
	}

	return (
		<ModalShell title={initial ? "Edit link" : "New link"} onClose={onClose}>
			<form onSubmit={handleSubmit} className="space-y-4" noValidate>
				<div className="space-y-1.5">
					<Label htmlFor="title">Title</Label>
					<Input
						id="title"
						name="title"
						defaultValue={fields.title}
						placeholder="My portfolio"
					/>
					{errors.title ? (
						<p className="text-xs text-destructive">{errors.title}</p>
					) : null}
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="url">URL</Label>
					<Input
						id="url"
						name="url"
						type="url"
						defaultValue={fields.url}
						placeholder="https://…"
					/>
					{errors.url ? (
						<p className="text-xs text-destructive">{errors.url}</p>
					) : null}
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="description">Description (optional)</Label>
					<Input
						id="description"
						name="description"
						defaultValue={fields.description}
						placeholder="Short line shown below the title"
					/>
					{errors.description ? (
						<p className="text-xs text-destructive">{errors.description}</p>
					) : null}
				</div>
				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" disabled={pending}>
						{initial ? "Save" : "Create"}
					</Button>
				</div>
			</form>
		</ModalShell>
	);
}
