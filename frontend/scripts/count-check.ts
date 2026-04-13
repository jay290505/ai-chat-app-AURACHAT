import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function countAuthUsers() {
  // Using a query that usually needs service role, but we'll try to see if we can get a hint
  const { data, error } = await supabase.from('profiles').select('id');
  console.log('Profiles currently in public.profiles:', data?.length ?? 0);
}

countAuthUsers();
