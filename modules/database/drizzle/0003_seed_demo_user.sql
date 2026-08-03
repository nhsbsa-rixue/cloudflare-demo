-- Seed a single demo user that all uploads (MOCK_USER_ID '1111') are attributed to.
-- Must run BEFORE the cases foreign-key rebuild (0004) so the FK check passes and
-- existing cases pointing at '1111' resolve to a real user (dashboard shows email).
WITH demo_users(id, name, email, role) AS (
	VALUES
		('1111', 'Demo User', 'demo@dongyu.com', 'user'),
		('1112', 'Demo Operator', 'operator@dongyu.com', 'operator'),
		('1113', 'Guest User', 'guest@dongyu.com', 'guest')
)
INSERT OR IGNORE INTO `users` (`id`, `name`, `email`, `role`, `created_at`, `updated_at`)
SELECT
	id,
	name,
	email,
	role,
	(cast((julianday('now') - 2440587.5)*86400000 as integer)),
	(cast((julianday('now') - 2440587.5)*86400000 as integer))
FROM demo_users;