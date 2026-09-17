import { useQuery } from "@tanstack/react-query";
import {
	getMyAnalytics,
	getMyAnalyticsSummary,
} from "@/lib/api/analytics.functions";

export const myAnalyticsKey = (days: number) =>
	["analytics", "summary", days] as const;

export function useMyAnalytics(days: 7 | 30 | 90 = 30) {
	return useQuery({
		queryKey: myAnalyticsKey(days),
		queryFn: () => getMyAnalytics({ data: { days } }),
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
