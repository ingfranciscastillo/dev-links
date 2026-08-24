import { defineRelations } from "drizzle-orm";

import { account, rateLimit, session, user, verification } from "./auth-schema";

import {
	articles,
	integrationAccounts,
	integrationCache,
	linkClicks,
	links,
	pageViews,
	profiles,
	projects,
	snippets,
	themes,
} from "./schema";

export const relations = defineRelations(
	{
		user,
		session,
		account,
		verification,
		rateLimit,

		profiles,
		links,
		projects,
		snippets,
		articles,
		themes,
		integrationAccounts,
		integrationCache,
		pageViews,
		linkClicks,
	},
	(r) => ({
		user: {
			profile: r.one.profiles({
				from: r.user.id,
				to: r.profiles.id,
			}),

			links: r.many.links(),
			projects: r.many.projects(),
			snippets: r.many.snippets(),
			articles: r.many.articles(),
			themes: r.many.themes(),
			integrationAccounts: r.many.integrationAccounts(),
			integrationCache: r.many.integrationCache(),

			pageViews: r.many.pageViews({
				from: r.user.id,
				to: r.pageViews.profileUserId,
			}),

			linkClicks: r.many.linkClicks({
				from: r.user.id,
				to: r.linkClicks.profileUserId,
			}),
		},

		profiles: {
			user: r.one.user({
				from: r.profiles.id,
				to: r.user.id,
			}),
		},

		links: {
			user: r.one.user({
				from: r.links.userId,
				to: r.user.id,
			}),

			clicks: r.many.linkClicks({
				from: r.links.id,
				to: r.linkClicks.linkId,
			}),
		},

		projects: {
			user: r.one.user({
				from: r.projects.userId,
				to: r.user.id,
			}),
		},

		snippets: {
			user: r.one.user({
				from: r.snippets.userId,
				to: r.user.id,
			}),
		},

		articles: {
			user: r.one.user({
				from: r.articles.userId,
				to: r.user.id,
			}),
		},

		themes: {
			user: r.one.user({
				from: r.themes.userId,
				to: r.user.id,
			}),
		},

		integrationAccounts: {
			user: r.one.user({
				from: r.integrationAccounts.userId,
				to: r.user.id,
			}),
		},

		integrationCache: {
			user: r.one.user({
				from: r.integrationCache.userId,
				to: r.user.id,
			}),
		},

		pageViews: {
			user: r.one.user({
				from: r.pageViews.profileUserId,
				to: r.user.id,
			}),
		},

		linkClicks: {
			user: r.one.user({
				from: r.linkClicks.profileUserId,
				to: r.user.id,
			}),

			link: r.one.links({
				from: r.linkClicks.linkId,
				to: r.links.id,
			}),
		},
	}),
);
