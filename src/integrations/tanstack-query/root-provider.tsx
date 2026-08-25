import { QueryClient } from "@tanstack/react-query";

export function getContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// >0 evita refetch inmediato tras la hidratación SSR.
				staleTime: 30_000,
			},
		},
	});

	return {
		queryClient,
	};
}
export default function TanstackQueryProvider() {}
