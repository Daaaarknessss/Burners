// Returns all partnerships for the current user (both directions), with partner profile joined
export async function getPartnerships(supabase) {
  const { data, error } = await supabase
    .from('partnerships')
    .select(`
      *,
      requester:profiles!partnerships_requester_id_fkey(id, display_name, shikai_name),
      partner:profiles!partnerships_partner_id_fkey(id, display_name, shikai_name)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Send a partnership request by email
export async function requestPartnership(supabase, email) {
  const rows = await supabase.rpc('find_profile_by_email', { search_email: email })
  if (rows.error) throw rows.error
  const target = rows.data?.[0]
  if (!target) throw new Error('No account found with that email.')

  const { data: { user } } = await supabase.auth.getUser()
  if (target.id === user.id) throw new Error("You can't add yourself.")

  const { data, error } = await supabase
    .from('partnerships')
    .insert({ requester_id: user.id, partner_id: target.id })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') throw new Error('Request already sent.')
    throw error
  }
  return data
}

// Accept or decline an incoming request (partner_id must be current user)
export async function respondToPartnership(supabase, partnershipId, status) {
  const { data, error } = await supabase
    .from('partnerships')
    .update({ status })
    .eq('id', partnershipId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Remove/cancel a partnership
export async function removePartnership(supabase, partnershipId) {
  const { error } = await supabase
    .from('partnerships')
    .delete()
    .eq('id', partnershipId)
  if (error) throw error
}

// Get rolling 7-day health score for a partner (0–100)
export async function getPartnerHealth(supabase, partnerUserId) {
  const { data, error } = await supabase.rpc('get_partner_health', { target_user_id: partnerUserId })
  if (error) throw error
  return data ?? 0
}
