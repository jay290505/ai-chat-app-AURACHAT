
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
const env = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8')
  .split('\n')
  .filter(line => line.includes('='))
  .reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    acc[key.trim()] = val.join('=').trim();
    return acc;
  }, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const AURA_BOT_ID = "da0a0a0a-a0a0-4a0a-a0a0-a0a0a0a0a0a0";

async function setupAura() {
  console.log("Setting up Aura AI Bot in Database...");
  console.log("URL:", supabaseUrl);

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: AURA_BOT_ID,
      username: 'aura',
      full_name: 'Aura AI Assistant',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aura',
      bio: 'Your intelligent AI companion. Ask me anything!',
      is_online: true,
      last_seen: new Date().toISOString()
    });

  if (error) {
    console.error("Error setting up Aura Bot:", error);
  } else {
    console.log("Aura AI Bot is now live in the database!");
  }
}

setupAura();
