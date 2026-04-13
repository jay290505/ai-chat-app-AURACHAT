import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function debugDiscovery() {
  console.log('--- Debugging Discovery ---');
  
  // 1. Check Profiles Count
  const { count, error: cErr } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  console.log('Total Profiles Count:', count);
  if (cErr) console.error('Count Error:', cErr);

  // 2. Try simple search
  const { data: searchData, error: sErr } = await supabase
    .from('profiles')
    .select('username, full_name')
    .limit(5);
  console.log('Sample Profiles:', searchData);
  if (sErr) console.error('Search Error:', sErr);
}

debugDiscovery();
