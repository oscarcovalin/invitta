import { createClient } from 'npm:@supabase/supabase-js@2.112.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'no-store',
}

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  const secret = secretKeys
    ? JSON.parse(secretKeys).default
    : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !secret) throw new Error('Supabase server credentials are unavailable')
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
}

function publicGuest(guest: Record<string, unknown>, project: Record<string, unknown>) {
  return {
    project: {
      name: project.name,
      eventType: project.event_type,
    },
    guest: {
      id: guest.id,
      name: guest.name,
      passes: Number(guest.passes ?? guest.pases ?? 1),
      confirmedPasses: Number(guest.confirmedPasses ?? 0),
      status: guest.status ?? 'DRAFT',
      respondedAt: guest.respondedAt ?? null,
    },
  }
}

async function resolveLink(client: ReturnType<typeof createClient>, token: string) {
  const { data: link, error: linkError } = await client
    .from('invitation_guest_links')
    .select('project_id,guest_id,expires_at,revoked_at')
    .eq('token', token)
    .maybeSingle()

  if (linkError) throw linkError
  if (!link || link.revoked_at || (link.expires_at && new Date(link.expires_at) <= new Date())) return null

  const [{ data: project, error: projectError }, { data: operations, error: operationsError }] = await Promise.all([
    client.from('invitation_projects').select('id,name,event_type,status').eq('id', link.project_id).maybeSingle(),
    client.from('invitation_operations').select('project_id,seating_state,guest_state,version').eq('project_id', link.project_id).maybeSingle(),
  ])

  if (projectError) throw projectError
  if (operationsError) throw operationsError
  if (!project || !operations) return null

  const guests = Array.isArray(operations.seating_state?.guests) ? operations.seating_state.guests : []
  const guest = guests.find((item: Record<string, unknown>) => item.id === link.guest_id)
  if (!guest) return null

  return { link, project, operations, guest }
}

async function submitRsvp(client: ReturnType<typeof createClient>, token: string, body: Record<string, unknown>) {
  const attending = body.attending
  if (typeof attending !== 'boolean') return respond({ error: 'attending must be boolean' }, 400)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const resolved = await resolveLink(client, token)
    if (!resolved) return respond({ error: 'Invitation not found' }, 404)
    if (resolved.project.status === 'archived') return respond({ error: 'Invitation is read-only' }, 409)

    const allowedPasses = Number(resolved.guest.passes ?? resolved.guest.pases ?? 1)
    const requestedPasses = attending ? Number(body.confirmedPasses ?? allowedPasses) : 0
    if (!Number.isInteger(requestedPasses) || requestedPasses < 0 || requestedPasses > allowedPasses) {
      return respond({ error: 'confirmedPasses is outside the invitation allowance' }, 400)
    }

    const now = new Date().toISOString()
    const updateGuest = (guest: Record<string, unknown>) => guest.id === resolved.link.guest_id
      ? {
          ...guest,
          status: attending ? 'CONFIRMED' : 'DECLINED',
          confirmedPasses: requestedPasses,
          respondedAt: now,
        }
      : guest

    const seatingState = {
      ...resolved.operations.seating_state,
      guests: (resolved.operations.seating_state?.guests ?? []).map(updateGuest),
    }
    const guestState = {
      ...resolved.operations.guest_state,
      guests: (resolved.operations.guest_state?.guests ?? []).map(updateGuest),
    }

    const { data: saved, error: saveError } = await client
      .from('invitation_operations')
      .update({
        seating_state: seatingState,
        guest_state: guestState,
        version: resolved.operations.version + 1,
        updated_at: now,
      })
      .eq('project_id', resolved.link.project_id)
      .eq('version', resolved.operations.version)
      .select('version')
      .maybeSingle()

    if (saveError) throw saveError
    if (!saved) continue

    await client
      .from('invitation_guest_links')
      .update({ last_responded_at: now, updated_at: now })
      .eq('project_id', resolved.link.project_id)
      .eq('guest_id', resolved.link.guest_id)

    const updatedGuest = updateGuest(resolved.guest)
    return respond({ ...publicGuest(updatedGuest, resolved.project), version: saved.version })
  }

  return respond({ error: 'The invitation changed; please try again' }, 409)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET' && req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405)

  try {
    const url = new URL(req.url)
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const token = String(url.searchParams.get('token') ?? body.token ?? '')
    if (!uuidPattern.test(token)) return respond({ error: 'Invitation not found' }, 404)

    const client = adminClient()
    if (req.method === 'POST') return await submitRsvp(client, token, body)

    const resolved = await resolveLink(client, token)
    if (!resolved) return respond({ error: 'Invitation not found' }, 404)
    return respond(publicGuest(resolved.guest, resolved.project))
  } catch (error) {
    console.error('guest-rsvp error', error)
    return respond({ error: 'Unable to process RSVP' }, 500)
  }
})
