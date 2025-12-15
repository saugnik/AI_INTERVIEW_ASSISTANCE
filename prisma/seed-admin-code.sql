-- Insert default admin code
INSERT INTO admin_codes (id, code, description, is_active, created_at, expires_at, used_by)
VALUES (
  gen_random_uuid(),
  'ADMIN2024',
  'Default administrator access code',
  true,
  NOW(),
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (code) DO NOTHING;
