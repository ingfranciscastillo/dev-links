CREATE TYPE "button_style" AS ENUM('solid', 'outline', 'ghost');--> statement-breakpoint
CREATE TYPE "integration_provider" AS ENUM('github', 'devto', 'hashnode', 'medium', 'stackoverflow');--> statement-breakpoint
CREATE TYPE "project_status" AS ENUM('shipped', 'wip', 'archived');--> statement-breakpoint
CREATE TYPE "theme_background" AS ENUM('dark', 'light', 'midnight', 'paper');--> statement-breakpoint
CREATE TYPE "theme_radius" AS ENUM('sharp', 'soft', 'round');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"url" text NOT NULL,
	"source" text,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"handle" text NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"etag" text
);
--> statement-breakpoint
CREATE TABLE "link_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"profile_user_id" text NOT NULL,
	"link_id" uuid,
	"link_url" text NOT NULL,
	"link_title" text,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" text,
	"ua" text,
	"device" text,
	"browser" text,
	"os" text,
	"country" text,
	"referrer" text
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"profile_user_id" text NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" text,
	"ua" text,
	"device" text,
	"browser" text,
	"os" text,
	"country" text,
	"referrer" text,
	"path" text
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY,
	"bio" text,
	"location" text,
	"website" text,
	"avatar_url" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"country" text,
	"available" boolean DEFAULT false NOT NULL,
	"seniority" text,
	"technologies" text[] DEFAULT '{}'::text[] NOT NULL,
	"primary_language" text,
	"search_tsv" tsvector,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"tech" text[] DEFAULT '{}'::text[] NOT NULL,
	"github" text,
	"demo" text,
	"status" "project_status" DEFAULT 'shipped'::"project_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snippets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"language" text DEFAULT 'ts' NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"user_id" text PRIMARY KEY,
	"accent" text NOT NULL,
	"background" "theme_background" NOT NULL,
	"radius" "theme_radius" NOT NULL,
	"button_style" "button_style" NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"template" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "articles_user_id_idx" ON "articles" ("user_id");--> statement-breakpoint
CREATE INDEX "integration_accounts_user_id_idx" ON "integration_accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "integration_cache_user_id_idx" ON "integration_cache" ("user_id");--> statement-breakpoint
CREATE INDEX "link_clicks_profile_user_id_idx" ON "link_clicks" ("profile_user_id");--> statement-breakpoint
CREATE INDEX "link_clicks_profile_clicked_at_idx" ON "link_clicks" ("profile_user_id","clicked_at");--> statement-breakpoint
CREATE INDEX "links_user_id_idx" ON "links" ("user_id");--> statement-breakpoint
CREATE INDEX "page_views_profile_user_id_idx" ON "page_views" ("profile_user_id");--> statement-breakpoint
CREATE INDEX "page_views_profile_viewed_at_idx" ON "page_views" ("profile_user_id","viewed_at");--> statement-breakpoint
CREATE INDEX "profiles_search_tsv_idx" ON "profiles" USING gin ("search_tsv");--> statement-breakpoint
CREATE INDEX "projects_user_id_idx" ON "projects" ("user_id");--> statement-breakpoint
CREATE INDEX "snippets_user_id_idx" ON "snippets" ("user_id");--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "integration_accounts" ADD CONSTRAINT "integration_accounts_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "integration_cache" ADD CONSTRAINT "integration_cache_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "link_clicks" ADD CONSTRAINT "link_clicks_profile_user_id_user_id_fkey" FOREIGN KEY ("profile_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "link_clicks" ADD CONSTRAINT "link_clicks_link_id_links_id_fkey" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_profile_user_id_user_id_fkey" FOREIGN KEY ("profile_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_user_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "snippets" ADD CONSTRAINT "snippets_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;