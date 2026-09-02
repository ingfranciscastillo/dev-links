import { authClient } from "@/lib/auth-client";

export async function startProCheckout(): Promise<void> {
	const { data, error } = await authClient.dodopayments.checkoutSession({
		slug: "pro",
	});

	if (error || !data) {
		throw new Error(error?.message ?? "Couldn't start checkout");
	}

	window.location.href = data.url;
}

export async function openBillingPortal(): Promise<void> {
	const { data, error } = await authClient.dodopayments.customer.portal();

	if (error || !data) {
		throw new Error(error?.message ?? "Couldn't open billing portal");
	}

	if (data.redirect) {
		window.location.href = data.url;
	}
}
