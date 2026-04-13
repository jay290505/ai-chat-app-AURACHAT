import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceKey!);

async function cleanupDuplicates() {
  const userId = 'b4ccd3a9-0eea-46d5-b945-df2ac817c9d9';
  console.log(`🧹 Cleaning up duplicate chats for user ${userId}...`);

  // 1. Get all private chats this user is in
  const { data: memberships } = await supabaseAdmin
    .from('chat_members')
    .select('chat_id, chats!inner(type)')
    .eq('user_id', userId)
    .eq('chats.type', 'private');

  if (!memberships || memberships.length === 0) {
    console.log('No private chats found.');
    return;
  }

  const chatIds = memberships.map(m => m.chat_id);
  
  // 2. For each chat, check if it's a self-chat (only 1 member or members are all user)
  for (const cid of chatIds) {
    const { data: allMembers } = await supabaseAdmin
        .from('chat_members')
        .select('user_id')
        .eq('chat_id', cid);
    
    // If all members are the same user or if it's just this user, delete it
    const otherMember = allMembers?.find(m => m.user_id !== userId);
    if (!otherMember) {
        console.log(`🗑️ Deleting self-chat: ${cid}`);
        await supabaseAdmin.from('chats').delete().eq('id', cid);
    }
  }

  console.log('✅ Cleanup finished.');
}

cleanupDuplicates();
