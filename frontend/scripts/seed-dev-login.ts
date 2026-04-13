import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE configuration in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const devLoginFile = path.join(process.cwd(), '.dev-login.json');

function loadDevLoginCreds() {
  if (fs.existsSync(devLoginFile)) {
    const content = fs.readFileSync(devLoginFile, 'utf-8');
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  return null;
}

function generateDevLoginCreds() {
  return {
    email: 'dev@aura.chat',
    password: 'DevPassword123!',
    username: 'devuser',
    fullName: 'Dev User',
    createdAt: new Date().toISOString(),
  };
}

function saveDevLoginCreds(creds: Record<string, unknown>) {
  fs.writeFileSync(devLoginFile, JSON.stringify(creds, null, 2), 'utf-8');
}

async function seedDevLoginUser() {
  console.log('🌱 Seeding Dev Login User...\n');

  let creds = loadDevLoginCreds();
  if (!creds) {
    creds = generateDevLoginCreds();
  }

  const { email, password, username, fullName } = creds as {
    email: string;
    password: string;
    username: string;
    fullName: string;
  };

  const supabase = createClient(supabaseUrl!, supabaseKey!);

  try {
    console.log(`📧 Checking for existing user: ${email}`);

    const { data: existingSignIn, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError && existingSignIn?.user) {
      console.log(`✅ User already exists with ID: ${existingSignIn.user.id}`);
      saveDevLoginCreds({
        ...creds,
        userId: existingSignIn.user.id,
      });
      console.log(`\n📋 Dev Login Credentials:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Username: ${username}`);
      console.log(`   User ID: ${existingSignIn.user.id}`);
      return;
    }

    console.log(`👤 Creating new user...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getBaseUrl()}/auth/callback`,
        data: {
          username,
          full_name: fullName,
        },
      },
    });

    if (authError) {
      console.error(`Auth Error Details: ${JSON.stringify(authError)}`);
      throw authError;
    }

    if (!authData.user?.id) {
      throw new Error('No user ID returned from signup');
    }

    const userId = authData.user.id;
    console.log(`✅ User created with ID: ${userId}`);

    // Confirm email by directly calling Supabase admin API
    await new Promise((r) => setTimeout(r, 1000));
    console.log(`📧 Confirming email...`);
    
    try {
      const adminHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        apikey: supabaseKey!,
        Authorization: `Bearer ${supabaseKey!}`,
      };

      const confirmResponse = await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${userId}`,
        {
          method: 'PUT',
          headers: adminHeaders,
          body: JSON.stringify({
            email_confirm: true,
          }),
        }
      );

      if (!confirmResponse.ok) {
        console.warn(`⚠️  Could not auto-confirm email via admin API: ${confirmResponse.status}`);
      } else {
        console.log(`✅ Email confirmed`);
      }
    } catch (confirmError: unknown) {
      const message = confirmError instanceof Error ? confirmError.message : String(confirmError);
      console.warn(`⚠️  Email confirmation attempt failed: ${message}`);
    }

    await new Promise((r) => setTimeout(r, 1000));

    console.log(`📝 Verifying profile was created...`);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn(`⚠️  Profile check error: ${profileError.message}`);
    } else if (profile) {
      console.log(`✅ Profile verified: ${profile.username}`);
    } else {
      console.log(`⚠️  Profile not found - attempting manual creation...`);
      const { error: manualProfileError } = await supabase.from('profiles').insert({
        id: userId,
        username,
        full_name: fullName,
      });
      if (manualProfileError) {
        console.warn(`⚠️  Manual profile creation also failed: ${manualProfileError.message}`);
      }
    }

    saveDevLoginCreds({
      ...creds,
      userId,
    });

    console.log(`\n✨ Account created successfully!\n`);
    console.log(`📋 Dev Login Credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Username: ${username}`);
    console.log(`   User ID: ${userId}`);
    console.log(`\n🔗 Ready to login in the app!`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Error: ${message}`);
    if (typeof error === 'object' && error !== null && 'status' in error) {
      console.error(`   Status: ${String((error as { status?: unknown }).status)}`);
    }
    process.exit(1);
  }
}

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

seedDevLoginUser();
