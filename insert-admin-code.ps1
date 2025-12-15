Write-Host "🔐 Inserting admin code into database..." -ForegroundColor Cyan

# Read DATABASE_URL from .env
$envContent = Get-Content .env -Raw
if ($envContent -match 'DATABASE_URL="([^"]+)"') {
    $dbUrl = $matches[1]
    Write-Host "✅ Found DATABASE_URL" -ForegroundColor Green
    
    # Execute SQL using node
    $sql = @"
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
"@
    
    # Create temp JS file to execute SQL
    $jsCode = @"
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function insertAdminCode() {
    try {
        await client.connect();
        const result = await client.query(\`$sql\`);
        console.log('✅ Admin code inserted successfully!');
        console.log('📝 Admin Code: ADMIN2024');
    } catch (error) {
        if (error.code === '23505') {
            console.log('ℹ️  Admin code already exists');
        } else {
            console.error('❌ Error:', error.message);
        }
    } finally {
        await client.end();
    }
}

insertAdminCode();
"@
    
    $jsCode | Out-File -FilePath "temp-insert-admin.cjs" -Encoding utf8
    node temp-insert-admin.cjs
    Remove-Item "temp-insert-admin.cjs"
    
}
else {
    Write-Host "❌ DATABASE_URL not found in .env" -ForegroundColor Red
}
