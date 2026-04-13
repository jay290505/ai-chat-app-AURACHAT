import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceKey!);

async function testGroupInsertion() {
  console.log('🧪 Testing Group Chat Insertion...');
  
  const { data, error } = await (supabaseAdmin as any)
    .from('chats')
    .insert({ 
      type: 'group', 
      name: 'Audit Test Group' 
    })
    .select();

  if (error) {
    console.error('❌ INSERTION FAILED:', error.message);
    if (error.message.includes('column "name" of relation "chats" does not exist')) {
        console.log('📝 RESOLUTION: You MUST run the "ALTER TABLE public.chats ADD COLUMN name text" SQL in your dashboard.');
    }
  } else {
    console.log('✅ INSERTION SUCCESSFUL! "name" column exists.');
    // Cleanup
    await supabaseAdmin.from('chats').delete().eq('id', data[0].id);
  }
}

testGroupInsertion();
