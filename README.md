<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/symbol-color-on-paper.svg">
    <source media="(prefers-color-scheme: light)" srcset="public/favicon-mark-dark-theme.svg">
    <img src="public/symbol-color-on-paper.svg" alt="DevLinks logo" width="112" />
  </picture>

  # DevLinks

  *Developer identity, in one address.*
</div>

A developer profile for your work, writing, projects, and everything you want people to find — one link, always up to date.

## Features

- **GitHub-native** — repositories, activity, and contributions kept in sync automatically.
- **Auto-imports** — writing and activity pulled in from Dev.to, Medium, Hashnode, Stack Overflow, and more.
- **Theme builder** — full control over colors, typography, layout, and effects, down to custom CSS.
- **Snippets, projects & articles** — publish syntax-highlighted code and showcase your work directly on your page.
- **Discover** — a searchable directory of developer profiles, filterable by stack, seniority, and availability.
- **Analytics** — first-party, cookieless page view and click tracking.
- **Built for speed** — server-rendered, accessible, and SEO-first from the start.

## Tech Stack

- **Framework** — [TanStack Start](https://tanstack.com/start) (React, SSR) on [Vite](https://vitejs.dev) + [Nitro](https://nitro.build)
- **Routing & data** — [TanStack Router](https://tanstack.com/router), [TanStack Query](https://tanstack.com/query), [TanStack Form](https://tanstack.com/form)
- **Auth & billing** — [better-auth](https://www.better-auth.com), [Dodo Payments](https://dodopayments.com)
- **Database** — [Drizzle ORM](https://orm.drizzle.team) on [Neon](https://neon.tech) Postgres
- **Styling & motion** — [Tailwind CSS](https://tailwindcss.com), [Motion](https://motion.dev), [Radix UI](https://radix-ui.com)
- **Storage & email** — Cloudflare R2 via the [AWS S3 SDK](https://github.com/aws/aws-sdk-js-v3), [Resend](https://resend.com)
- **Product analytics** — [PostHog](https://posthog.com)
- **Tooling** — [Biome](https://biomejs.dev) (lint/format), TypeScript
