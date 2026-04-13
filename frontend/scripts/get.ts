import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceKey!);

async function main() {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error(error);
  } else {
    for (const u of users.users) {
      console.log(`Email: ${u.email}, ID: ${u.id}, Created At: ${u.created_at}`);
    }
  }
}

main();
