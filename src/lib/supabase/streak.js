// Calls the get_streak() SQL function — walks back from today counting consecutive logged days.
export async function getStreak(supabase) {
  const { data, error } = await supabase.rpc('get_streak')
  if (error) throw error
  return data ?? 0
}

// Returns { health: 0-100, season_dead: bool }
export async function getMyHealth(supabase) {
  const { data, error } = await supabase.rpc('get_my_health')
  if (error) throw error
  return data?.[0] ?? { health: 0, season_dead: false }
}
