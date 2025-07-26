import { createClient } from "@supabase/supabase-js";
import {env} from "@/src/utils/env.parser"

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE, SUPABASE_ANON_KEY } = env;

export const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY,{
    auth:{
        flowType:"pkce"
    }
});
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
