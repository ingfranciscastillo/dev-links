import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addArticle,
	addLink,
	addProject,
	addSnippet,
	applyThemeTemplate,
	getMyProfileCore,
	getMyProfileData,
	removeArticle,
	removeLink,
	removeProject,
	removeSnippet,
	reorderLinks,
	resetTheme,
	toggleLink,
	updateArticle,
	updateDiscovery,
	updateLink,
	updateProject,
	updateSnippet,
	updateTheme,
	upsertMyProfile,
	wipeProfileData,
} from "@/lib/api/profile-data.functions";
import {
	type ArticleItem,
	defaultTheme,
	emptyProfileData,
	type LinkItem,
	type ProfileData,
	type ProjectItem,
	type SnippetItem,
} from "@/lib/schemas";
import type { ThemeV2 } from "@/lib/theme-config";

export const profileDataKey = ["profile-data"] as const;
export const profileCoreKey = ["profile-core"] as const;

export function useProfileDataQuery() {
	return useQuery({
		queryKey: profileDataKey,
		queryFn: () => getMyProfileData(),
	});
}

export function useProfileData(): ProfileData {
	return useProfileDataQuery().data ?? emptyProfileData;
}

export function useProfileCore() {
	return useQuery({
		queryKey: profileCoreKey,
		queryFn: () => getMyProfileCore(),
	});
}

export function useUpdateProfile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: {
			name: string;
			username: string;
			bio?: string;
			location?: string;
			website?: string;
		}) => upsertMyProfile({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: profileCoreKey });
		},
	});
}

export function useUpdateDiscovery() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: {
			country?: string;
			primaryLanguage?: string;
			seniority?: string;
			technologies?: string[];
			available?: boolean;
		}) => updateDiscovery({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: profileDataKey });
			queryClient.invalidateQueries({ queryKey: profileCoreKey });
		},
	});
}

function rollback(
	queryClient: ReturnType<typeof useQueryClient>,
	previous?: ProfileData,
) {
	if (previous) queryClient.setQueryData(profileDataKey, previous);
}

// ---------- links ----------

export function useAddLink() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { title: string; url: string; description?: string }) =>
			addLink({ data: input }),
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			const tempId = `optimistic-${crypto.randomUUID()}`;
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return {
					...c,
					links: [
						...c.links,
						{
							id: tempId,
							title: input.title,
							url: input.url,
							description: input.description ?? "",
							active: true,
						},
					],
				};
			});
			return { previous, tempId };
		},
		onSuccess: (result, _input, ctx) => {
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return {
					...c,
					links: c.links.map((l) => (l.id === ctx?.tempId ? result : l)),
				};
			});
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

export function useUpdateLink() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { id: string } & Partial<LinkItem>) =>
			updateLink({ data: input }),
		onMutate: async ({ id, ...patch }) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return {
					...c,
					links: c.links.map((l) => (l.id === id ? { ...l, ...patch } : l)),
				};
			});
			return { previous };
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

export function useRemoveLink() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => removeLink({ data: { id } }),
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return { ...c, links: c.links.filter((l) => l.id !== id) };
			});
			return { previous };
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

export function useReorderLinks() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (ids: string[]) => reorderLinks({ data: { ids } }),
		onMutate: async (ids) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				const byId = new Map(c.links.map((l) => [l.id, l]));
				return {
					...c,
					links: ids
						.map((id) => byId.get(id))
						.filter((l): l is LinkItem => !!l),
				};
			});
			return { previous };
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

export function useToggleLink() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => toggleLink({ data: { id } }),
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return {
					...c,
					links: c.links.map((l) =>
						l.id === id ? { ...l, active: !l.active } : l,
					),
				};
			});
			return { previous };
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

// ---------- projects ----------

export function useAddProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: Omit<ProjectItem, "id">) => addProject({ data: input }),
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			const tempId = `optimistic-${crypto.randomUUID()}`;
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return { ...c, projects: [{ ...input, id: tempId }, ...c.projects] };
			});
			return { previous, tempId };
		},
		onSuccess: (result, _input, ctx) => {
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return {
					...c,
					projects: c.projects.map((p) => (p.id === ctx?.tempId ? result : p)),
				};
			});
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

export function useUpdateProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { id: string } & Partial<ProjectItem>) =>
			updateProject({ data: input }),
		onMutate: async ({ id, ...patch }) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return {
					...c,
					projects: c.projects.map((p) =>
						p.id === id ? { ...p, ...patch } : p,
					),
				};
			});
			return { previous };
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

export function useRemoveProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => removeProject({ data: { id } }),
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return { ...c, projects: c.projects.filter((p) => p.id !== id) };
			});
			return { previous };
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

// ---------- snippets ----------

export function useAddSnippet() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: Omit<SnippetItem, "id">) => addSnippet({ data: input }),
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			const tempId = `optimistic-${crypto.randomUUID()}`;
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return { ...c, snippets: [{ ...input, id: tempId }, ...c.snippets] };
			});
			return { previous, tempId };
		},
		onSuccess: (result, _input, ctx) => {
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return {
					...c,
					snippets: c.snippets.map((s) => (s.id === ctx?.tempId ? result : s)),
				};
			});
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

export function useUpdateSnippet() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { id: string } & Partial<SnippetItem>) =>
			updateSnippet({ data: input }),
		onMutate: async ({ id, ...patch }) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return {
					...c,
					snippets: c.snippets.map((s) =>
						s.id === id ? { ...s, ...patch } : s,
					),
				};
			});
			return { previous };
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

export function useRemoveSnippet() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => removeSnippet({ data: { id } }),
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return { ...c, snippets: c.snippets.filter((s) => s.id !== id) };
			});
			return { previous };
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

// ---------- articles ----------

export function useAddArticle() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: Omit<ArticleItem, "id">) => addArticle({ data: input }),
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			const tempId = `optimistic-${crypto.randomUUID()}`;
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return { ...c, articles: [{ ...input, id: tempId }, ...c.articles] };
			});
			return { previous, tempId };
		},
		onSuccess: (result, _input, ctx) => {
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return {
					...c,
					articles: c.articles.map((a) => (a.id === ctx?.tempId ? result : a)),
				};
			});
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

export function useUpdateArticle() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { id: string } & Partial<ArticleItem>) =>
			updateArticle({ data: input }),
		onMutate: async ({ id, ...patch }) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return {
					...c,
					articles: c.articles.map((a) =>
						a.id === id ? { ...a, ...patch } : a,
					),
				};
			});
			return { previous };
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

export function useRemoveArticle() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => removeArticle({ data: { id } }),
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => {
				const c = d ?? emptyProfileData;
				return { ...c, articles: c.articles.filter((a) => a.id !== id) };
			});
			return { previous };
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

// ---------- theme ----------

export function useUpdateTheme() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (patch: Partial<ThemeV2>) => {
			const current =
				queryClient.getQueryData<ProfileData>(profileDataKey)?.theme ??
				defaultTheme;
			const next = { ...current, ...patch };
			await updateTheme({ data: next });
			return next;
		},
		onMutate: async (patch) => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			const current = previous?.theme ?? defaultTheme;
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => ({
				...(d ?? emptyProfileData),
				theme: { ...current, ...patch },
				templateId: null,
			}));
			return { previous };
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

export function useApplyThemeTemplate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (templateId: string) =>
			applyThemeTemplate({ data: { templateId } }),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

export function useResetTheme() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => resetTheme(),
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: profileDataKey });
			const previous = queryClient.getQueryData<ProfileData>(profileDataKey);
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => ({
				...(d ?? emptyProfileData),
				theme: defaultTheme,
				templateId: null,
			}));
			return { previous };
		},
		onError: (_e, _i, ctx) => rollback(queryClient, ctx?.previous),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}

// ---------- wipe ----------

export function useWipeProfileData() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => wipeProfileData(),
		onSuccess: () => {
			queryClient.setQueryData<ProfileData>(profileDataKey, (d) => ({
				...emptyProfileData,
				theme: d?.theme ?? defaultTheme,
				templateId: d?.templateId ?? null,
			}));
		},
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: profileDataKey }),
	});
}
