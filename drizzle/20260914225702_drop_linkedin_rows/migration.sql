-- LinkedIn integration removed from the app (no real public API — see
-- integrations/types.ts). Postgres can't drop 'linkedin' from the
-- integration_provider enum without recreating the type, so the label stays
-- defined but unused; this only cleans up any existing connections so they
-- don't linger as orphaned rows nothing in the UI can manage anymore.
DELETE FROM "integration_cache" WHERE "provider" = 'linkedin';--> statement-breakpoint
DELETE FROM "integration_accounts" WHERE "provider" = 'linkedin';
