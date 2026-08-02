-- Seed a single demo user that all uploads (MOCK_USER_ID '1111') are attributed to.
-- Must run BEFORE the cases foreign-key rebuild (0004) so the FK check passes and
-- existing cases pointing at '1111' resolve to a real user (dashboard shows email).
INSERT INTO `users` (`id`, `name`, `email`, `role`, `created_at`, `updated_at`)
VALUES (
	'1111',
	'Demo User',
	'demo@dongyu.com',
	'user',
	(cast((julianday('now') - 2440587.5)*86400000 as integer)),
	(cast((julianday('now') - 2440587.5)*86400000 as integer))
)
ON CONFLICT(`id`) DO NOTHING;

INSERT INTO `users` (`id`, `name`, `email`, `role`, `created_at`, `updated_at`)
VALUES (
	'1112',
	'Demo Operator',
	'operator@dongyu.com',
	'operator',
	(cast((julianday('now') - 2440587.5)*86400000 as integer)),
	(cast((julianday('now') - 2440587.5)*86400000 as integer))
)
ON CONFLICT(`id`) DO NOTHING;

INSERT INTO `users` (`id`, `name`, `email`, `role`, `created_at`, `updated_at`)
VALUES (
	'1113',
	'Guest User',
	'guest@dongyu.com',
	'guest',
	(cast((julianday('now') - 2440587.5)*86400000 as integer)),
	(cast((julianday('now') - 2440587.5)*86400000 as integer))
)
ON CONFLICT(`id`) DO NOTHING;