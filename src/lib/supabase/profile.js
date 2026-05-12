export async function getProfile(supabase) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single()
  if (error) throw error
  return data
}

// Merges `updates` into the current user's profile row.
// Safe to call on first save — the trigger already created the row on signup.
export async function updateProfile(supabase, updates) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single()
  if (error) throw error
  return data
}
