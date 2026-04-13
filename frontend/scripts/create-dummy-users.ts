import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDummyUsers() {
  console.log('🚀 Creating 2 Dummy Users for your Group Test...');
  
  const users = [
    { email: `friend_${Math.floor(Math.random() * 1000)}@aura.com`, username: 'aura_friend', fullName: 'Aura Friend' },
    { email: `partner_${Math.floor(Math.random() * 1000)}@aura.com`, username: 'aura_partner', fullName: 'Aura Partner' }
  ];

  for (const u of users) {
    try {
      console.log(`\nCreating: ${u.fullName} (${u.email})...`);
      const { data, error } = await supabase.auth.signUp({
        email: u.email,
        password: 'Password123!',
        options: {
          data: {
            username: u.username,
            full_name: u.fullName
          }
        }
      });

      if (error) throw error;
      
      // Force confirm email so they show up as active
      const { error: confirmError } = await supabase.rpc('confirm_user_email', { user_id: data.user?.id });
      // If RPC doesn't exist, we'll try updating the auth table if we had service role, 
      // but for now, the user can just use the SEARCH feature to find them.
      
      console.log(`✅ ${u.fullName} created!`);
    } catch (err: any) {
      console.error(`❌ Failed: ${err.message}`);
    }
  }

  console.log('\n✨ DONE! Now you can search for "Aura" in your Create Group window! ✨');
}

createDummyUsers();
