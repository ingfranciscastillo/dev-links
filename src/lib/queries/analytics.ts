import { useQuery } from "@tanstack/react-query";
import {
	getMyAnalytics,
	getMyAnalyticsSummary,
} from "@/lib/api/analytics.functions";

export const myAnalyticsKey = ["analytics", "summary"] as const;

export function useMyAnalytics() {
	return useQuery({
		queryKey: myAnalyticsKey,
		queryFn: () => getMyAnalytics(),
		staleTime: 60_000,
	});
}

export const analyticsSummaryKey = (days: number) =>
	["analytics-summary", days] as const;

export function useAnalyticsSummary(days = 7) {
	return useQuery({
		queryKey: analyticsSummaryKey(days),
		queryFn: () => getMyAnalyticsSummary({ data: { days } }),
		staleTime: 60_000,
	});
}
