CREATE TABLE "support_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"category" text DEFAULT 'support' NOT NULL,
	"platform" text NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"server_id" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"event" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"date" date,
	"slides_url" text,
	"video_url" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "support_links_user_id_idx" ON "support_links" ("user_id");--> statement-breakpoint
CREATE INDEX "talks_user_id_idx" ON "talks" ("user_id");--> statement-breakpoint
ALTER TABLE "support_links" ADD CONSTRAINT "support_links_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "talks" ADD CONSTRAINT "talks_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;