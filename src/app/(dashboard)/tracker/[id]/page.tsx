import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ApplicationDetailClient } from './application-detail-client'
import type { Application } from '@/types/database'

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: application, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !application) {
    redirect('/tracker')
  }

  // Cast to Application with required id (validated above)
  return <ApplicationDetailClient initialApplication={application as Application & { id: string }} />
}
