import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceKey!);

async function deepAudit() {
  console.log('🔍 Starting Deep System Audit...');
  const auditResults: Record<string, any> = {};

  // 1. Check Tables and Columns
  try {
    const { data: cols, error: colErr } = await (supabaseAdmin as any).rpc('get_table_columns', { table_name: 'chats' });
    // If RPC doesn't exist, we try a direct select to see what fields we get
    const { data: sampleChat, error: chatErr } = await supabaseAdmin.from('chats').select('*').limit(1);
    
    if (chatErr) {
      auditResults.chats_table = '❌ Error: ' + chatErr.message;
    } else {
      const keys = sampleChat[0] ? Object.keys(sampleChat[0]) : [];
      auditResults.chats_columns = keys;
      auditResults.has_name_col = keys.includes('name') ? '✅' : '❌ MISSING';
    }
  } catch (e) {
    auditResults.db_audit = '❌ RPC or Table Access Failed';
  }

  // 2. Check Storage
  const { data: buckets, error: bErr } = await supabaseAdmin.storage.listBuckets();
  if (bErr) {
    auditResults.storage = '❌ ' + bErr.message;
  } else {
    auditResults.buckets = buckets.map(b => b.name);
    auditResults.has_chat_media = auditResults.buckets.includes('chat-media') ? '✅' : '❌ MISSING';
  }

  // 3. Check for AI Remnants in Frontend
  // (This is manual, but I'll check a few key files)
  
  console.log('\n--- AUDIT REPORT ---');
  console.log(JSON.stringify(auditResults, null, 2));

  if (auditResults.has_name_col === '❌ MISSING') {
    console.log('\n🚨 CRITICAL FAULT: "chats" table is missing the "name" column. Group chats will fail.');
  }

  if (auditResults.has_chat_media === '❌ MISSING') {
    console.log('\n🚨 CRITICAL FAULT: "chat-media" bucket does not exist. Media uploads will fail.');
  }
}

deepAudit();
