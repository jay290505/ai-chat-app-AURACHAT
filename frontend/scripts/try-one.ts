import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function tryOneUser() {
  const email = `discover_${Math.floor(Math.random()*100000)}@gmail.com`;
  console.log(`Trying to create user: ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'Password123!',
    options: {
      data: {
        username: 'aura_user_' + Math.floor(Math.random()*1000),
        full_name: 'Aura Discovery User'
      }
    }
  });

  if (error) {
    console.error('Failed:', error.message);
  } else {
    console.log('Success! User ID:', data.user?.id);
  }
}

tryOneUser();
