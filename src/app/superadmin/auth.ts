import { createServerSupabaseClient } from '@/supabase/server'

export function parseSuperAdminEmails(raw: string | undefined): Set<string> {
  if (!raw) return new Set()
  return new Set(
    raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allowlist = parseSuperAdminEmails(process.env.SUPERADMIN_EMAILS)
  if (allowlist.size === 0) return false
  return allowlist.has(email.trim().toLowerCase())
}

export async function getAuthenticatedSuperAdmin() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: 'unauthenticated' as const, user: null }
  }

  if (!isSuperAdminEmail(user.email)) {
    return { status: 'forbidden' as const, user }
  }

  return { status: 'authorized' as const, user }
}
