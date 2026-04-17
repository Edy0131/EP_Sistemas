import { createClient } from '@supabase/supabase-js';

let _client = null;
let _url = null;
let _key = null;

// Return a singleton Supabase client for the given url/key. If url/key changes,
// a new client is created and reused afterwards. This avoids multiple GoTrue
// instances warning when creating clients repeatedly.
export function getSupabaseClient(url, key) {
  if (!url || !key) return null;
  if (_client && _url === url && _key === key) return _client;
  try {
    _client = createClient(url, key);
    _url = url;
    _key = key;
    return _client;
  } catch (e) {
    console.error('Failed to create Supabase client', e);
    _client = null;
    _url = null;
    _key = null;
    return null;
  }
}

export function resetSupabaseClient() {
  _client = null;
  _url = null;
  _key = null;
}
