import { AddCircleIcon } from "@solar-icons/react/line-duotone";
import {
	HeartIcon,
	PenIcon,
	TrashBin2Icon,
	UsersGroupRoundedIcon,
} from "@solar-icons/react/linear";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { ModalShell } from "@/components/dashboard/ModalShell";
import { EmptyState } from "@/components/dashboard/SectionHeader";
import { SUPPORT_PLATFORM_LABEL } from "@/components/profile/SupportBlock";
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
import {
	useAddSupportLink,
	useProfileData,
	useRemoveSupportLink,
	useUpdateSupportLink,
} from "@/lib/queries/profile-data";
import { type SupportLinkItem, supportLinkSchema } from "@/lib/schemas";
import { zodField } from "@/lib/schemas/field";

export const Route = createFileRoute("/_authenticated/dashboard/support")({
	head: () => ({
		meta: [
			{ title: "Support & community — DevLinks" },
			{
				name: "description",
				content:
					"Add Buy Me a Coffee, Ko-fi, GitHub Sponsors and your Discord or Slack community to your DevLinks profile.",
			},
		],
	}),
	component: SupportPage,
});

type Category = "support" | "community";

const SUPPORT_PLATFORMS = [
	"buymeacoffee",
	"kofi",
	"ghsponsors",
	"patreon",
] as const;
const COMMUNITY_PLATFORMS = ["discord", "slack"] as const;

function SupportPage() {
	const data = useProfileData();
	const addSupportLink = useAddSupportLink();
	const updateSupportLink = useUpdateSupportLink();
	const removeSupportLink = useRemoveSupportLink();

	const [editing, setEditing] = useState<{
		link: SupportLinkItem | null;
		category: Category;
	} | null>(null);
	const [removing, setRemoving] = useState<SupportLinkItem | null>(null);

	const support = data.supportLinks.filter((l) => l.category !== "community");
	const community = data.supportLinks.filter((l) => l.category === "community");

	return (
		<>
			<header className="border-b border-border pb-8">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					10 / Support
				</p>

				<div className="mt-5">
					<h1 className="font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
						Support & community.
					</h1>

					<p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
						Let people back your work and join your community, right from your
						public page.
					</p>
				</div>
			</header>

			<Group
				title="Support"
				addLabel="Add support link"
				onAdd={() => setEditing({ link: null, category: "support" })}
				items={support}
				emptyIcon={HeartIcon}
				emptyTitle="No support links yet"
				emptyDescription="Buy Me a Coffee, Ko-fi, GitHub Sponsors or Patreon."
				onEdit={(link) => setEditing({ link, category: "support" })}
				onRemove={setRemoving}
			/>

			<Group
				title="Community"
				addLabel="Add community link"
				onAdd={() => setEditing({ link: null, category: "community" })}
				items={community}
				emptyIcon={UsersGroupRoundedIcon}
				emptyTitle="No community yet"
				emptyDescription="Invite people to your Discord server or Slack workspace."
				onEdit={(link) => setEditing({ link, category: "community" })}
				onRemove={setRemoving}
			/>

			{editing ? (
				<SupportDialog
					initial={editing.link}
					category={editing.category}
					onClose={() => setEditing(null)}
					onSubmit={(values) => {
						if (editing.link === null) {
							addSupportLink.mutate(values, {
								onSuccess: () => {
									toast.success("Link added");
									setEditing(null);
								},
								onError: (err) =>
									toast.error(
										err instanceof Error ? err.message : "Couldn't add link",
									),
							});
						} else {
							updateSupportLink.mutate(
								{ id: editing.link.id, ...values },
								{
									onSuccess: () => {
										toast.success("Link updated");
										setEditing(null);
									},
									onError: (err) =>
										toast.error(
											err instanceof Error
												? err.message
												: "Couldn't update link",
										),
								},
							);
						}
					}}
					pending={addSupportLink.isPending || updateSupportLink.isPending}
				/>
			) : null}

			{removing ? (
				<ConfirmDialog
					title="Delete link"
					description={`"${
						removing.label ||
						SUPPORT_PLATFORM_LABEL[removing.platform] ||
						removing.platform
					}" will be removed from your public page. This can't be undone.`}
					pending={removeSupportLink.isPending}
					onClose={() => setRemoving(null)}
					onConfirm={() => {
						removeSupportLink.mutate(removing.id, {
							onSuccess: () => {
								toast.success("Link removed");
								setRemoving(null);
							},
							onError: (err) =>
								toast.error(
									err instanceof Error ? err.message : "Couldn't remove link",
								),
						});
					}}
				/>
			) : null}
		</>
	);
}

function Group({
	title,
	addLabel,
	onAdd,
	items,
	emptyIcon,
	emptyTitle,
	emptyDescription,
	onEdit,
	onRemove,
}: {
	title: string;
	addLabel: string;
	onAdd: () => void;
	items: SupportLinkItem[];
	emptyIcon: React.ComponentType<{ className?: string }>;
	emptyTitle: string;
	emptyDescription: string;
	onEdit: (link: SupportLinkItem) => void;
	onRemove: (link: SupportLinkItem) => void;
}) {
	return (
		<section className="border-b border-border py-8">
			<div className="mb-6 flex items-center justify-between gap-4">
				<h2 className="font-display text-2xl tracking-[-0.02em]">{title}</h2>

				<Button
					onClick={onAdd}
					className="h-9 rounded-none bg-foreground px-3 font-mono text-[9px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
				>
					<AddCircleIcon
						secondaryOpacity={0}
						size={20}
						className="h-3.5 w-3.5"
						strokeWidth={1.7}
					/>
					{addLabel}
				</Button>
			</div>

			{items.length === 0 ? (
				<EmptyState
					icon={emptyIcon}
					title={emptyTitle}
					description={emptyDescription}
				/>
			) : (
				<ul>
					{items.map((link) => (
						<li
							key={link.id}
							className="flex items-center gap-4 border-t border-border py-4"
						>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-foreground">
									{link.label ||
										SUPPORT_PLATFORM_LABEL[link.platform] ||
										link.platform}
								</p>
								<p className="mt-1 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
									{link.url}
								</p>
							</div>

							<div className="flex items-center gap-1">
								<button
									type="button"
									onClick={() => onEdit(link)}
									className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
									title="Edit"
									aria-label={`Edit ${link.label || link.platform}`}
								>
									<PenIcon className="h-4 w-4" strokeWidth={1.5} />
								</button>

								<button
									type="button"
									onClick={() => onRemove(link)}
									className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-destructive"
									title="Delete"
									aria-label={`Delete ${link.label || link.platform}`}
								>
									<TrashBin2Icon className="h-4 w-4" strokeWidth={1.5} />
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function SupportDialog({
	initial,
	category,
	onClose,
	onSubmit,
	pending,
}: {
	initial: SupportLinkItem | null;
	category: Category;
	onClose: () => void;
	onSubmit: (values: Omit<SupportLinkItem, "id">) => void;
	pending?: boolean;
}) {
	const options =
		category === "community" ? COMMUNITY_PLATFORMS : SUPPORT_PLATFORMS;

	const form = useForm({
		defaultValues: {
			platform: initial?.platform ?? options[0],
			label: initial?.label ?? "",
			url: initial?.url ?? "",
			serverId: initial?.serverId ?? "",
		},
		onSubmit: async ({ value }) => {
			onSubmit({
				category,
				platform: value.platform,
				label: value.label.trim(),
				url: value.url.trim(),
				serverId: value.serverId.trim() || null,
			});
		},
	});

	return (
		<ModalShell
			title={
				initial
					? "Edit link"
					: category === "community"
						? "New community link"
						: "New support link"
			}
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
						<form.Field name="platform">
							{(field) => (
								<Field>
									<FieldLabel
										htmlFor="platform-select"
										className="font-mono text-[10px] uppercase tracking-[0.08em]"
									>
										Platform
									</FieldLabel>

									<Select
										value={field.state.value}
										onValueChange={(value) => field.handleChange(value)}
									>
										<SelectTrigger
											id="platform-select"
											className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus:ring-0"
										>
											<SelectValue />
										</SelectTrigger>

										<SelectContent>
											{options.map((platform) => (
												<SelectItem key={platform} value={platform}>
													{SUPPORT_PLATFORM_LABEL[platform]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							)}
						</form.Field>

						<form.Field name="label">
							{(field) => (
								<Field>
									<FieldLabel
										htmlFor={field.name}
										className="font-mono text-[10px] uppercase tracking-[0.08em]"
									>
										Label
										<span className="ml-1 text-muted-foreground">
											(optional)
										</span>
									</FieldLabel>

									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="Buy me a coffee"
										className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
									/>
								</Field>
							)}
						</form.Field>

						<form.Field
							name="url"
							validators={{
								onChange: zodField(supportLinkSchema.shape.url),
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
											placeholder="https://ko-fi.com/you"
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

						<form.Subscribe selector={(state) => state.values.platform}>
							{(platform) =>
								platform === "discord" ? (
									<form.Field name="serverId">
										{(field) => (
											<Field>
												<FieldLabel
													htmlFor={field.name}
													className="font-mono text-[10px] uppercase tracking-[0.08em]"
												>
													Discord server ID
													<span className="ml-1 text-muted-foreground">
														(optional)
													</span>
												</FieldLabel>

												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
													placeholder="123456789012345678"
													className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 font-mono text-sm shadow-none focus-visible:border-brand focus-visible:ring-0"
												/>
											</Field>
										)}
									</form.Field>
								) : null
							}
						</form.Subscribe>
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
							{pending ? "Saving..." : initial ? "Save link" : "Add link"}
						</Button>
					</div>
				</form>
			)}
		</ModalShell>
	);
}
