-- Create admin_codes table for educator verification
CREATE TABLE IF NOT EXISTS public.admin_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    used_by TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Insert default admin code
INSERT INTO public.admin_codes (code, is_active, expires_at)
VALUES ('ADMIN2024', true, NULL)
ON CONFLICT (code) DO NOTHING;

-- Verify the table and data
SELECT * FROM public.admin_codes;
