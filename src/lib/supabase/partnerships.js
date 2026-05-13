// Returns all partnerships for the current user (both directions), with partner profile joined
export async function getPartnerships(supabase) {
  const { data, error } = await supabase
    .from('partnerships')
    .select(`
      *,
      requester:profiles!partnerships_requester_profile_fkey(id, display_name, shikai_name),
      partner:profiles!partnerships_partner_profile_fkey(id, display_name, shikai_name)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Search users by display_name or email prefix (min 2 chars)
export async function searchProfiles(supabase, query) {
  const { data, error } = await supabase.rpc('search_profiles', { query: query.trim() })
  if (error) throw error
  return data ?? []
}

// Send a partnership request by user ID
export async function requestPartnership(supabase, targetUserId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (targetUserId === user.id) throw new Error("You can't add yourself.")

  const { data, error } = await supabase
    .from('partnerships')
    .insert({ requester_id: user.id, partner_id: targetUserId })
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
