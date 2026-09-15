export function hueFromString(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
	return h % 360;
}

// Sugerencia de username al hacer onboarding (ver /onboarding) — no random,
// determinístico a partir del nombre, para que la mayoría pueda aceptarlo
// tal cual en vez de terminar con una URL pública fea para siempre.
// Se ajusta al subset más estricto de las dos validaciones de username que
// existen hoy (usernameValidator del plugin de better-auth en auth.ts, y
// profileInput.username en profile-data.functions.ts): solo a-z0-9-,
// empieza y termina alfanumérico, 3-24 caracteres.
export function slugifyUsername(input: string): string {
	let slug = input
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	if (slug.length < 3) slug = `${slug}-dev`.replace(/^-+/, "");
	slug = slug.slice(0, 24).replace(/-+$/, "");
	if (slug.length < 3) slug = "dev";

	return slug;
}
