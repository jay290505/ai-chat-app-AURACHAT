import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceKey!);

async function testFullGroupFlow() {
  console.log('🧪 Testing Full Group Creation Workflow...');

  // 1. Get real user IDs
  const { data: profiles } = await supabaseAdmin.from('profiles').select('id').limit(2);
  if (!profiles || profiles.length < 1) {
    console.error('❌ Error: Not enough profiles to test.');
    return;
  }

  const ownerId = profiles[0].id;
  const friendId = profiles[1] ? profiles[1].id : ownerId;

  console.log(`Using Owner: ${ownerId}, Friend: ${friendId}`);

  // 2. Create Chat
  const { data: chat, error: chatErr } = await supabaseAdmin
    .from('chats')
    .insert({ type: 'group', name: 'Workflow Test' })
    .select()
    .single();

  if (chatErr) {
    console.error('❌ Chat Creation Failed:', chatErr.message);
    return;
  }
  console.log('✅ Chat Created:', chat.id);

  // 3. Add Members
  const members = [
    { chat_id: chat.id, user_id: ownerId, role: 'owner' },
    { chat_id: chat.id, user_id: friendId, role: 'member' }
  ];

  const { error: memErr } = await supabaseAdmin
    .from('chat_members')
    .insert(members);

  if (memErr) {
    console.error('❌ Member Addition Failed:', memErr.message);
    if (memErr.message.includes('violates row-level security policy')) {
        console.log('📝 RESOLUTION: RLS Policy for "chat_members" is still too strict.');
    }
  } else {
    console.log('✅ Members Added Successfully!');
  }

  // Cleanup
  await supabaseAdmin.from('chats').delete().eq('id', chat.id);
}

testFullGroupFlow();
