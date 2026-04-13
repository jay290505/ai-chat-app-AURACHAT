import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceKey!);

async function deepCleanup() {
    const myId = 'b4ccd3a9-0eea-46d5-b945-df2ac817c9d9';
    console.log('🔍 Auditing all chats for duplications...');

    const { data: chats, error } = await supabaseAdmin
        .from('chats')
        .select('*, members:chat_members(user_id)')
        .eq('type', 'private');

    if (error) {
        console.error(error);
        return;
    }

    const seenPairs = new Set();
    const toDelete = [];

    for (const chat of chats) {
        const memberIds = chat.members.map((m: any) => m.user_id).sort().join(',');
        
        // If it's a self-chat (only myId) or if we've seen this pair before
        if (memberIds === myId || seenPairs.has(memberIds)) {
            console.log(`🗑️ Marking chat ${chat.id} for deletion (Pair: ${memberIds})`);
            toDelete.push(chat.id);
        } else {
            seenPairs.add(memberIds);
        }
    }

    if (toDelete.length > 0) {
        await supabaseAdmin.from('chats').delete().in('id', toDelete);
        console.log(`✅ Deleted ${toDelete.length} duplicate/invalid chats.`);
    } else {
        console.log('✅ No duplicates found.');
    }
}

deepCleanup();
