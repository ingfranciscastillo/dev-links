import {
	boolean,
	customType,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

const tsvector = customType<{ data: string }>({
	dataType() {
		return "tsvector";
	},
});

export const buttonStyle = pgEnum("button_style", [
	"solid",
	"outline",
	"ghost",
]);

export const integrationProvider = pgEnum("integration_provider", [
	"github",
	"devto",
	"hashnode",
	"medium",
	"stackoverflow",
]);

export const projectStatus = pgEnum("project_status", [
	"shipped",
	"wip",
	"archived",
]);

export const themeBackground = pgEnum("theme_background", [
	"dark",
	"light",
	"midnight",
	"paper",
]);

export const themeRadius = pgEnum("theme_radius", ["sharp", "soft", "round"]);

export const profiles = pgTable(
	"profiles",
	{
		id: text("id")
			.primaryKey()
			.references(() => user.id, { onDelete: "cascade" }),

		bio: text("bio"),
		location: text("location"),
		website: text("website"),
		plan: text("plan").notNull().default("free"),
		country: text("country"),
		available: boolean("available").notNull().default(false),
		seniority: text("seniority"),
		technologies: text("technologies").array().notNull().default([]),
		primaryLanguage: text("primary_language"),
		searchTsv: tsvector("search_tsv"),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => [index("profiles_search_tsv_idx").using("gin", table.searchTsv)],
);

export const links = pgTable(
	"links",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		title: text("title").notNull(),
		url: text("url").notNull(),
		description: text("description"),
		active: boolean("active").notNull().default(true),
		position: integer("position").notNull().default(0),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => [index("links_user_id_idx").on(table.userId)],
);

export const projects = pgTable(
	"projects",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		name: text("name").notNull(),
		description: text("description").notNull().default(""),
		tech: text("tech").array().notNull().default([]),
		github: text("github"),
		demo: text("demo"),
		status: projectStatus("status").notNull().default("shipped"),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => [index("projects_user_id_idx").on(table.userId)],
);

export const snippets = pgTable(
	"snippets",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		title: text("title").notNull(),
		language: text("language").notNull().default("ts"),
		code: text("code").notNull(),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => [index("snippets_user_id_idx").on(table.userId)],
);

export const articles = pgTable(
	"articles",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		title: text("title").notNull(),
		summary: text("summary"),
		url: text("url").notNull(),
		source: text("source"),

		date: timestamp("date", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => [index("articles_user_id_idx").on(table.userId)],
);

export const themes = pgTable("themes", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),

	accent: text("accent").notNull(),
	background: themeBackground("background").notNull(),
	radius: themeRadius("radius").notNull(),
	buttonStyle: buttonStyle("button_style").notNull(),
	config: jsonb("config").notNull().default({}),
	template: text("template"),

	updatedAt: timestamp("updated_at", {
		withTimezone: true,
	})
		.notNull()
		.defaultNow(),
});

export const integrationAccounts = pgTable(
	"integration_accounts",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		provider: integrationProvider("provider").notNull(),
		handle: text("handle").notNull(),
		config: jsonb("config").notNull().default({}),

		lastSyncedAt: timestamp("last_synced_at", {
			withTimezone: true,
		}),

		lastError: text("last_error"),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => [index("integration_accounts_user_id_idx").on(table.userId)],
);

export const integrationCache = pgTable(
	"integration_cache",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		provider: integrationProvider("provider").notNull(),
		kind: text("kind").notNull(),
		payload: jsonb("payload").notNull(),

		fetchedAt: timestamp("fetched_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		expiresAt: timestamp("expires_at", {
			withTimezone: true,
		}),

		etag: text("etag"),
	},
	(table) => [index("integration_cache_user_id_idx").on(table.userId)],
);

export const pageViews = pgTable(
	"page_views",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		profileUserId: text("profile_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		viewedAt: timestamp("viewed_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		ipHash: text("ip_hash"),
		ua: text("ua"),
		device: text("device"),
		browser: text("browser"),
		os: text("os"),
		country: text("country"),
		referrer: text("referrer"),
		path: text("path"),
	},
	(table) => [
		index("page_views_profile_user_id_idx").on(table.profileUserId),
		index("page_views_profile_viewed_at_idx").on(
			table.profileUserId,
			table.viewedAt,
		),
	],
);

export const linkClicks = pgTable(
	"link_clicks",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		profileUserId: text("profile_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		linkId: uuid("link_id").references(() => links.id, {
			onDelete: "set null",
		}),

		linkUrl: text("link_url").notNull(),
		linkTitle: text("link_title"),

		clickedAt: timestamp("clicked_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		ipHash: text("ip_hash"),
		ua: text("ua"),
		device: text("device"),
		browser: text("browser"),
		os: text("os"),
		country: text("country"),
		referrer: text("referrer"),
	},
	(table) => [
		index("link_clicks_profile_user_id_idx").on(table.profileUserId),
		index("link_clicks_profile_clicked_at_idx").on(
			table.profileUserId,
			table.clickedAt,
		),
	],
);
