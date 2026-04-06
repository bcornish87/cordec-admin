import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xhqornncpcgewlbzutsd.supabase.co';
const supabaseAnonKey = 'sb_publishable_O7P7j5Y2nGRxmo9kH_VHxw_zLdzBNHX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
