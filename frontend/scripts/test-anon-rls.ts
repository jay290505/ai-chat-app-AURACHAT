import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function testAnonInsertion() {
  console.log('🧪 Testing Chat Insertion with ANON KEY...');
  
  const { data, error } = await supabase
    .from('chats')
    .insert({ 
      type: 'group', 
      name: 'Anon Test' 
    })
    .select();

  if (error) {
    console.log('❌ ANON INSERTION FAILED:', error.message);
  } else {
    console.log('✅ ANON INSERTION SUCCESS!');
    await supabase.from('chats').delete().eq('id', data[0].id);
  }
}

testAnonInsertion();
