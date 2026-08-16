import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (window.INVITTIA_ENV && window.INVITTIA_ENV.SUPABASE_URL) || "";
const SUPABASE_KEY = (window.INVITTIA_ENV && window.INVITTIA_ENV.SUPABASE_ANON_KEY) || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
