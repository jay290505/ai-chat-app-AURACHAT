import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceKey!);

async function updateJay() {
  console.log('📝 Updating User Profile to "Jay Jobanputra"...');
  
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      full_name: 'Jay Jobanputra',
      username: 'jay'
    })
    .eq('id', 'b4ccd3a9-0eea-46d5-b945-df2ac817c9d9');

  if (error) {
    console.error('❌ Update Failed:', error.message);
  } else {
    console.log('✅ Update Successful!');
  }
}

updateJay();
