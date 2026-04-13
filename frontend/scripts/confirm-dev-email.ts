import * as path from 'path';
import * as fs from 'fs';

// Parse .env.local manually to ensure keys are loaded correctly
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n').filter((line) => line.trim());

const envVars: Record<string, string> = {};
for (const line of envLines) {
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=').trim();
  if (key && value) {
    envVars[key.trim()] = value;
  }
}

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const serviceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey || !serviceKey) {
  console.error('❌ Missing SUPABASE configuration');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function confirmExistingEmail() {
  console.log('🔧 Attempting to confirm email for dev@aura.chat...\n');

  try {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `❌ Could not list users: ${response.status} ${response.statusText}`
      );
      const text = await response.text();
      console.error('Response:', text);
      process.exit(1);
    }

    const data = (await response.json()) as {
      users?: Array<{ id: string; email: string; email_confirmed: boolean }>;
    };
    const devUser = data.users?.find((u) => u.email === 'dev@aura.chat');

    if (!devUser) {
      console.log('❌ User dev@aura.chat not found');
      process.exit(1);
    }

    console.log(`Found user: ${devUser.id}`);
    console.log(`Email confirmed: ${devUser.email_confirmed}`);

    if (devUser.email_confirmed) {
      console.log('✅ Email is already confirmed!');
      process.exit(0);
    }

    const updateResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${devUser.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          email_confirm: true,
        }),
      }
    );

    if (!updateResponse.ok) {
      console.error(
        `❌ Could not confirm email: ${updateResponse.status} ${updateResponse.statusText}`
      );
      const text = await updateResponse.text();
      console.error('Response:', text);
      process.exit(1);
    }

    console.log('✅ Email confirmed successfully!');
    console.log('\n📋 Dev Login Credentials:');
    console.log('   Email: dev@aura.chat');
    console.log(`   Password: DevPassword123!`);
    console.log(`   User ID: ${devUser.id}`);
  } catch (error) {
    const err = error as Error;
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

confirmExistingEmail();
