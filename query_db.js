import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const client = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await client.from('parcoursup_2').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Columns:");
    Object.keys(data[0]).forEach(k => console.log(k));
  } else {
    console.log("No data or error:", error);
  }
}
run();
