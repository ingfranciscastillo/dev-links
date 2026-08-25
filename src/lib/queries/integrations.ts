import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	deleteIntegrationAccount,
	listMyIntegrationAccounts,
	refreshIntegration,
	upsertIntegrationAccount,
} from "@/lib/api/integrations/account.functions";
import type { Provider } from "@/lib/integrations/types";

export const integrationAccountsKey = ["integration-accounts"] as const;

export function useIntegrationAccounts() {
	return useQuery({
		queryKey: integrationAccountsKey,
		queryFn: () => listMyIntegrationAccounts(),
	});
}

export function useUpsertIntegrationAccount() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: {
			provider: Provider;
			handle: string;
			config?: Record<string, unknown>;
		}) => upsertIntegrationAccount({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: integrationAccountsKey });
		},
	});
}

export function useDeleteIntegrationAccount() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (provider: Provider) =>
			deleteIntegrationAccount({ data: { provider } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: integrationAccountsKey });
		},
	});
}

export function useRefreshIntegration() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (provider: Provider) =>
			refreshIntegration({ data: { provider } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: integrationAccountsKey });
		},
	});
}
