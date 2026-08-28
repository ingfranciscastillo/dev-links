ALTER TABLE "integration_accounts" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "integration_cache" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "integration_provider";--> statement-breakpoint
CREATE TYPE "integration_provider" AS ENUM('github', 'devto', 'medium', 'stackoverflow', 'wakatime', 'leetcode', 'npm', 'bluesky', 'mastodon', 'dockerhub', 'youtube');--> statement-breakpoint
ALTER TABLE "integration_accounts" ALTER COLUMN "provider" SET DATA TYPE "integration_provider" USING "provider"::"integration_provider";--> statement-breakpoint
ALTER TABLE "integration_cache" ALTER COLUMN "provider" SET DATA TYPE "integration_provider" USING "provider"::"integration_provider";