// Returns entries newest-first. Pass `from`/`to` as 'YYYY-MM-DD' strings to filter by day range.
export async function getEntries(supabase, { from, to } = {}) {
  let query = supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false })

  if (from) query = query.gte('day', from)
  if (to)   query = query.lte('day', to)

  const { data, error } = await query
  if (error) throw error
  return data
}

// Returns entries for the last N days (default 7) — used by the heat strip.
export async function getRecentEntries(supabase, days = 7) {
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  return getEntries(supabase, { from: from.toISOString().slice(0, 10) })
}

// `entry` shape: { burnerId, action, note?, intensity?, tags?, day }
export async function addEntry(supabase, entry) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id:    user.id,
      burner_id:  entry.burnerId,
      action:     entry.action,
      note:       entry.note ?? null,
      intensity:  entry.intensity ?? null,
      tags:       entry.tags ?? [],
      day:        entry.day,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEntry(supabase, id) {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)
  if (error) throw error
}
