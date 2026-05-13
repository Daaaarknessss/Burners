// Returns all partnerships for the current user with profile data via SECURITY DEFINER RPC
// (avoids RLS join issues on the profiles table)
export async function getPartnerships(supabase) {
  const { data, error } = await supabase.rpc('get_my_partnerships')
  if (error) throw error
  return (data ?? []).map(row => ({
    id:           row.id,
    requester_id: row.requester_id,
    partner_id:   row.partner_id,
    status:       row.status,
    created_at:   row.created_at,
    requester: { id: row.requester_id, username: row.requester_username, shikai_name: row.requester_shikai_name },
    partner:   { id: row.partner_id,   username: row.partner_username,   shikai_name: row.partner_shikai_name   },
  }))
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
