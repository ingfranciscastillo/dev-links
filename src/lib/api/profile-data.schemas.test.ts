import { describe, expect, it } from "vitest";
import { LIMITS } from "@/lib/schemas";
import {
	articleInput,
	idInput,
	linkInput,
	projectInput,
	reorderInput,
	snippetInput,
	supportLinkInput,
	talkInput,
	updateTalkInput,
} from "./profile-data.schemas";

const UUID = "3f2b8a4e-9c1d-4e7f-8a2b-1c3d5e7f9a0b";
const ok = (
	schema: { safeParse: (v: unknown) => { success: boolean } },
	v: unknown,
) => schema.safeParse(v).success;

describe("server-side length limits", () => {
	it("rejects a snippet over the limit (each profile view highlights it)", () => {
		const base = { title: "t", language: "ts" };
		expect(
			ok(snippetInput, { ...base, code: "x".repeat(LIMITS.snippetCode) }),
		).toBe(true);
		expect(
			ok(snippetInput, { ...base, code: "x".repeat(LIMITS.snippetCode + 1) }),
		).toBe(false);
		expect(
			ok(snippetInput, { ...base, code: "x".repeat(2 * 1024 * 1024) }),
		).toBe(false);
	});

	it.each([
		[
			"link title",
			linkInput,
			{ title: "x".repeat(LIMITS.linkTitle + 1), url: "https://a.com" },
		],
		[
			"link description",
			linkInput,
			{
				title: "t",
				url: "https://a.com",
				description: "x".repeat(LIMITS.linkDescription + 1),
			},
		],
		[
			"link url",
			linkInput,
			{ title: "t", url: `https://a.com/${"x".repeat(LIMITS.url)}` },
		],
		[
			"project tech count",
			projectInput,
			{ name: "p", tech: Array(LIMITS.projectTech + 1).fill("ts") },
		],
		[
			"project tech item",
			projectInput,
			{ name: "p", tech: ["x".repeat(LIMITS.techItem + 1)] },
		],
		[
			"article title",
			articleInput,
			{
				title: "x".repeat(LIMITS.articleTitle + 1),
				url: "https://a.com",
				date: "2026-01-01",
			},
		],
		[
			"talk description",
			talkInput,
			{ title: "t", description: "x".repeat(LIMITS.talkDescription + 1) },
		],
	])("rejects oversized %s", (_label, schema, value) => {
		expect(ok(schema, value)).toBe(false);
	});
});

describe("ids and dates", () => {
	it("requires UUID ids", () => {
		expect(ok(idInput, { id: UUID })).toBe(true);
		expect(ok(idInput, { id: "not-a-uuid" })).toBe(false);
		expect(ok(idInput, { id: "1; drop table links" })).toBe(false);
	});

	it("bounds reorder lists", () => {
		expect(ok(reorderInput, { ids: [UUID] })).toBe(true);
		expect(ok(reorderInput, { ids: Array(1001).fill(UUID) })).toBe(false);
		expect(ok(reorderInput, { ids: ["x"] })).toBe(false);
	});

	it("validates article dates", () => {
		const base = { title: "t", url: "https://a.com" };
		expect(ok(articleInput, { ...base, date: "2026-09-01" })).toBe(true);
		expect(
			ok(articleInput, { ...base, date: "2026-09-01T10:00:00.000Z" }),
		).toBe(true);
		expect(ok(articleInput, { ...base, date: "yesterday" })).toBe(false);
	});

	it("validates talk dates and normalises empty to null", () => {
		expect(ok(talkInput, { title: "t", date: "2026-02-30x" })).toBe(false);
		expect(updateTalkInput.parse({ id: UUID, date: "" }).date).toBeNull();
		expect(updateTalkInput.parse({ id: UUID, date: "2026-09-01" }).date).toBe(
			"2026-09-01",
		);
	});
});

describe("support links", () => {
	it("only accepts known platforms", () => {
		const base = { category: "support", url: "https://ko-fi.com/x" };
		expect(ok(supportLinkInput, { ...base, platform: "kofi" })).toBe(true);
		expect(ok(supportLinkInput, { ...base, platform: "evil<script>" })).toBe(
			false,
		);
	});
});

describe("mass assignment", () => {
	it("drops fields that aren't part of the schema", () => {
		const parsed = linkInput.parse({
			title: "t",
			url: "https://a.com",
			userId: "someone-else",
			id: UUID,
			position: -1,
		});
		expect(parsed).toEqual({ title: "t", url: "https://a.com" });
	});
});
