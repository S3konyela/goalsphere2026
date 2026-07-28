import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createDisabledQuery() {
  const result = { data: [], error: { message: 'Supabase is not configured.' } };
  const query = {
    order() {
      return this;
    },
    single() {
      return this;
    },
    select() {
      return this;
    },
    then(resolve) {
      resolve(result);
    },
    catch() {
      return this;
    },
  };
  return query;
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from() {
        return createDisabledQuery();
      },
    };
