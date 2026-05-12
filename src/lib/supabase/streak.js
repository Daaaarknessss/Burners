// Calls the get_streak() SQL function — walks back from today counting consecutive logged days.
export async function getStreak(supabase) {
  const { data, error } = await supabase.rpc('get_streak')
  if (error) throw error
  return data ?? 0
}
