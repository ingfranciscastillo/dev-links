import { AddCircleIcon } from "@solar-icons/react/line-duotone";
import {
	MicrophoneIcon,
	PenIcon,
	TrashBin2Icon,
} from "@solar-icons/react/linear";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { ModalShell } from "@/components/dashboard/ModalShell";
import { EmptyState } from "@/components/dashboard/SectionHeader";
import { PageTitle } from "@/components/motion/PageTitle";
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
	useAddTalk,
	useProfileData,
	useRemoveTalk,
	useUpdateTalk,
} from "@/lib/queries/profile-data";
import { talkSchema, type TalkItem } from "@/lib/schemas";
import { zodField } from "@/lib/schemas/field";

export const Route = createFileRoute("/_authenticated/dashboard/talks")({
	head: () => ({
		meta: [
			{ title: "Talks & slides — DevLinks" },
			{
				name: "description",
				content:
					"Add the conference talks, meetups and slide decks you want on your DevLinks profile.",
			},
		],
	}),
	component: TalksPage,
});

function TalksPage() {
	const data = useProfileData();
	const addTalk = useAddTalk();
	const updateTalk = useUpdateTalk();
	const removeTalk = useRemoveTalk();
	const [editing, setEditing] = useState<TalkItem | "new" | null>(null);
	const [removing, setRemoving] = useState<TalkItem | null>(null);

	const sorted = [...data.talks].sort((a, b) =>
		(b.date ?? "").localeCompare(a.date ?? ""),
	);

	return (
		<>
			<header className="border-b border-border pb-8">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					11 / Talks
				</p>

				<div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
					<div className="min-w-0">
						<PageTitle className="font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
							Talks & slides.
						</PageTitle>

						<p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
							Conference talks, meetups and workshops, with links to slides and
							video.
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
						New talk
					</Button>
				</div>
			</header>

			{sorted.length === 0 ? (
				<div className="mt-8">
					<EmptyState
						icon={MicrophoneIcon}
						title="No talks yet"
						description="Add a talk with its event, slides and recording."
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
								Add your first talk
							</Button>
						}
					/>
				</div>
			) : (
				<div className="mt-8">
					<div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center border-t border-border py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground sm:grid-cols-[5rem_minmax(0,1fr)_auto]">
						<span>Date</span>
						<span>Talk</span>
						<span className="text-right">Actions</span>
					</div>

					<div>
						{sorted.map((talk) => (
							<TalkRow
								key={talk.id}
								talk={talk}
								onEdit={() => setEditing(talk)}
								onRemove={() => setRemoving(talk)}
							/>
						))}
					</div>
				</div>
			)}

			{editing !== null ? (
				<TalkDialog
					initial={editing === "new" ? null : editing}
					onClose={() => setEditing(null)}
					onSubmit={(values) => {
						if (editing === "new") {
							addTalk.mutate(values, {
								onSuccess: () => {
									toast.success("Talk added");
									setEditing(null);
								},
								onError: (err) =>
									toast.error(
										err instanceof Error ? err.message : "Couldn't add talk",
									),
							});
						} else {
							updateTalk.mutate(
								{ id: editing.id, ...values },
								{
									onSuccess: () => {
										toast.success("Talk updated");
										setEditing(null);
									},
									onError: (err) =>
										toast.error(
											err instanceof Error
												? err.message
												: "Couldn't update talk",
										),
								},
							);
						}
					}}
					pending={addTalk.isPending || updateTalk.isPending}
				/>
			) : null}

			{removing ? (
				<ConfirmDialog
					title="Delete talk"
					description={`"${removing.title}" will be removed from your public page. This can't be undone.`}
					pending={removeTalk.isPending}
					onClose={() => setRemoving(null)}
					onConfirm={() => {
						removeTalk.mutate(removing.id, {
							onSuccess: () => {
								toast.success("Talk removed");
								setRemoving(null);
							},
							onError: (err) =>
								toast.error(
									err instanceof Error ? err.message : "Couldn't remove talk",
								),
						});
					}}
				/>
			) : null}
		</>
	);
}

function TalkRow({
	talk,
	onEdit,
	onRemove,
}: {
	talk: TalkItem;
	onEdit: () => void;
	onRemove: () => void;
}) {
	const date = talk.date ? new Date(talk.date) : null;

	return (
		<article className="group border-b border-border py-6 sm:py-7">
			<div className="grid gap-4 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center">
				<div>
					{date ? (
						<>
							<p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
								{date.toLocaleDateString(undefined, {
									month: "short",
									day: "2-digit",
								})}
							</p>

							<p className="mt-1 font-mono text-[9px] tabular-nums text-muted-foreground">
								{date.getFullYear()}
							</p>
						</>
					) : (
						<p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
							TBD
						</p>
					)}
				</div>

				<div className="min-w-0">
					<h2 className="min-w-0 truncate font-display text-2xl tracking-tight sm:text-3xl">
						{talk.title}
					</h2>

					{talk.event && (
						<p className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
							{talk.event}
						</p>
					)}

					{talk.description && (
						<p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							{talk.description}
						</p>
					)}

					{(talk.slidesUrl || talk.videoUrl) && (
						<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.08em]">
							{talk.slidesUrl && (
								<a
									href={talk.slidesUrl}
									target="_blank"
									rel="noreferrer"
									className="text-muted-foreground transition-colors hover:text-brand"
								>
									Slides ↗
								</a>
							)}
							{talk.videoUrl && (
								<a
									href={talk.videoUrl}
									target="_blank"
									rel="noreferrer"
									className="text-muted-foreground transition-colors hover:text-brand"
								>
									Watch ↗
								</a>
							)}
						</div>
					)}
				</div>

				<div className="flex items-center justify-end gap-1">
					<button
						type="button"
						onClick={onEdit}
						className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
						title="Edit"
						aria-label={`Edit ${talk.title}`}
					>
						<PenIcon className="h-4 w-4" strokeWidth={1.5} />
					</button>

					<button
						type="button"
						onClick={onRemove}
						className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-destructive"
						title="Delete"
						aria-label={`Delete ${talk.title}`}
					>
						<TrashBin2Icon className="h-4 w-4" strokeWidth={1.5} />
					</button>
				</div>
			</div>
		</article>
	);
}

function TalkDialog({
	initial,
	onClose,
	onSubmit,
	pending,
}: {
	initial: TalkItem | null;
	onClose: () => void;
	onSubmit: (values: Omit<TalkItem, "id">) => void;
	pending?: boolean;
}) {
	const form = useForm({
		defaultValues: {
			title: initial?.title ?? "",
			event: initial?.event ?? "",
			description: initial?.description ?? "",
			date: initial?.date?.slice(0, 10) ?? "",
			slidesUrl: initial?.slidesUrl ?? "",
			videoUrl: initial?.videoUrl ?? "",
		},
		onSubmit: async ({ value }) => {
			onSubmit({
				title: value.title,
				event: value.event,
				description: value.description,
				date: value.date || null,
				slidesUrl: value.slidesUrl || null,
				videoUrl: value.videoUrl || null,
			});
		},
	});

	return (
		<ModalShell title={initial ? "Edit talk" : "New talk"} onClose={onClose}>
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
								onChange: zodField(talkSchema.shape.title),
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
											placeholder="Edge-first React in production"
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

						<div className="grid gap-5 sm:grid-cols-2">
							<form.Field name="event">
								{(field) => (
									<Field>
										<FieldLabel
											htmlFor={field.name}
											className="font-mono text-[10px] uppercase tracking-[0.08em]"
										>
											Event
										</FieldLabel>

										<Input
											id={field.name}
											name={field.name}
											placeholder="ReactConf 2026"
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
											<span className="ml-1 text-muted-foreground">
												(optional)
											</span>
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

						<form.Field name="description">
							{(field) => (
								<Field>
									<FieldLabel
										htmlFor={field.name}
										className="font-mono text-[10px] uppercase tracking-[0.08em]"
									>
										Description
										<span className="ml-1 text-muted-foreground">
											(optional)
										</span>
									</FieldLabel>

									<Textarea
										id={field.name}
										name={field.name}
										rows={3}
										placeholder="What the talk was about"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										className="mt-2 resize-none rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
									/>
								</Field>
							)}
						</form.Field>

						<div className="grid gap-5 sm:grid-cols-2">
							<form.Field
								name="slidesUrl"
								validators={{
									onChange: zodField(talkSchema.shape.slidesUrl),
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
												Slides URL
												<span className="ml-1 text-muted-foreground">
													(optional)
												</span>
											</FieldLabel>

											<Input
												id={field.name}
												name={field.name}
												type="url"
												placeholder="https://speakerdeck.com/…"
												value={field.state.value ?? ""}
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

							<form.Field
								name="videoUrl"
								validators={{
									onChange: zodField(talkSchema.shape.videoUrl),
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
												Video URL
												<span className="ml-1 text-muted-foreground">
													(optional)
												</span>
											</FieldLabel>

											<Input
												id={field.name}
												name={field.name}
												type="url"
												placeholder="https://youtube.com/watch?v=…"
												value={field.state.value ?? ""}
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
						</div>
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
							{pending ? "Saving..." : initial ? "Save talk" : "Add talk"}
						</Button>
					</div>
				</form>
			)}
		</ModalShell>
	);
}
