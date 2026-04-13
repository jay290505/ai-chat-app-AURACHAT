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

async function runLifecycleTest() {
  console.log('🚀 Starting Full Lifecycle Test...');
  
  const testEmail = `testuser_${Math.floor(Math.random() * 10000)}@gmail.com`;
  const testPassword = 'Password123!';
  const testUsername = `user_${Date.now()}`;

  try {
    // 1. Sign Up
    console.log(`\nStep 1: Signing up ${testEmail}...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (authError) throw new Error(`Auth Error: ${authError.message}`);
    const userId = authData.user?.id;
    console.log(`✅ User created! ID: ${userId}`);

    // Note: Profiles are created via trigger in schema.sql
    // Let's wait a second for the trigger to fire
    await new Promise(r => setTimeout(r, 2000));

    // 2. Check Profile
    console.log('\nStep 2: Updating Profile...');
    const { error: profUpdateError } = await supabase
      .from('profiles')
      .update({ username: testUsername, full_name: 'Test Tester' })
      .eq('id', userId);

    if (profUpdateError) throw new Error(`Profile Update Error: ${profUpdateError.message}`);
    console.log('✅ Profile updated successfully.');

    // 3. Create a Chat
    console.log('\nStep 3: Creating a Chat...');
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .insert({ type: 'dm' })
      .select()
      .single();

    if (chatError) throw new Error(`Chat Creation Error: ${chatError.message}`);
    const chatId = chatData.id;
    console.log(`✅ Chat created! ID: ${chatId}`);

    // 4. Add Member
    console.log('\nStep 4: Adding user to chat...');
    const { error: memberError } = await supabase
      .from('chat_members')
      .insert({ chat_id: chatId, user_id: userId });

    if (memberError) throw new Error(`Member Error: ${memberError.message}`);
    console.log('✅ User added to chat.');

    // 5. Send Message
    console.log('\nStep 5: Sending a message...');
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: userId,
        content: 'System Health Check: Live Connection SUCCESSFUL 🚀'
      })
      .select()
      .single();

    if (msgError) throw new Error(`Message Error: ${msgError.message}`);
    console.log(`✅ Message sent! Content: "${msgData.content}"`);

    console.log('\n✨ ALL TESTS PASSED: THE ENGINE IS COMPLETELY LIVE! ✨');

  } catch (error: any) {
    console.error(`\n❌ TEST FAILED: ${error.message}`);
  }
}

runLifecycleTest();
