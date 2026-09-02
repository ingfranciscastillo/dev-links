// Límites por plan, alineados con la tabla de /pricing (Pricing.tsx).
// "Sync frequency" y "Priority support" no son gateables desde la app
// (son comportamiento de infra / soporte humano), así que no viven aquí.
export const PLAN_LIMITS = {
	free: {
		links: 5,
		projects: 5,
		snippets: 5,
		integrations: 5,
		analytics: false,
		customCss: false,
		branding: true,
	},
	pro: {
		links: Number.POSITIVE_INFINITY,
		projects: Number.POSITIVE_INFINITY,
		snippets: Number.POSITIVE_INFINITY,
		integrations: Number.POSITIVE_INFINITY,
		analytics: true,
		customCss: true,
		branding: false,
	},
} as const;

export function isPro(plan: string | null | undefined): boolean {
	return plan === "pro";
}

export function limitsFor(plan: string | null | undefined) {
	return isPro(plan) ? PLAN_LIMITS.pro : PLAN_LIMITS.free;
}
