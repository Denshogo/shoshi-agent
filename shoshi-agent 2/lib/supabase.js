import { createClient } from '@supabase/supabase-js'

let supabaseClient = null

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient
  if (!hasSupabaseConfig()) return null

  supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return supabaseClient
}

function createMissingConfigProxy(path = 'supabase') {
  return new Proxy(function missingSupabaseConfig() {}, {
    get(_target, prop) {
      if (prop === 'then') return undefined
      return createMissingConfigProxy(`${path}.${String(prop)}`)
    },
    apply() {
      throw new Error(
        'Supabase env vars are required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      )
    },
  })
}

export const supabase = new Proxy({}, {
  get(_target, prop) {
    const client = getSupabaseClient()

    if (!client) {
      return createMissingConfigProxy(`supabase.${String(prop)}`)
    }

    const value = client[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
