import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('--- Supabase Connection Test ---');
  console.log(`URL: ${supabaseUrl}`);

  const { error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(0);
  
  if (profileError) {
    console.error('❌ Profiles Table Error:', JSON.stringify(profileError, null, 2));
  } else {
    console.log('✅ Profiles Table: Accessible');
  }

  const { error: chatError } = await supabase
    .from('chats')
    .select('*')
    .limit(0);

  if (chatError) {
    console.error('❌ Chats Table Error:', JSON.stringify(chatError, null, 2));
  } else {
    console.log('✅ Chats Table: Accessible');
  }

  const { error: msgError } = await supabase
    .from('messages')
    .select('*')
    .limit(0);

  if (msgError) {
    console.error('❌ Messages Table Error:', JSON.stringify(msgError, null, 2));
  } else {
    console.log('✅ Messages Table: Accessible');
  }

  // 2. Test Storage
  console.log('\n2. Checking Storage...');
  
  // Try to list buckets (might fail on anon key, but we check anyway)
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.log('ℹ️ List Buckets restricted (Normal for anon keys)');
  } else {
    console.log('Existing Buckets:', buckets.map(b => b.name).join(', ') || 'None');
  }

  // Live Upload Test (Using PNG to bypass MIME restriction)
  console.log('Testing Live Upload to "chat-media"...');
  const testFileBody = Buffer.from('fake-image-data');
  const testPath = `test-connection-${Date.now()}.png`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('chat-media')
    .upload(testPath, testFileBody, {
      contentType: 'image/png'
    });

  if (uploadError) {
    console.error('❌ Upload Test FAILED:', JSON.stringify(uploadError, null, 2));
  } else {
    console.log('✅ Upload Test: SUCCESSFUL (Images are working!)');
    // Cleanup
    await supabase.storage.from('chat-media').remove([testPath]);
  }

  // 3. Test Auth
  console.log('\n3. Checking Auth Service...');
  const { data: authData, error: authError } = await supabase.auth.getSession();
  if (authError) {
    console.error('❌ Auth Service Error:', authError.message);
  } else {
    console.log('✅ Auth Service: Responding');
  }

  console.log('\n--- Test Complete ---');
}

runTest();
