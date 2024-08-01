import { auth } from '@/auth'
import Auth from '@/views/Auth'
import { redirect } from 'next/navigation'
import { signup } from './actions'

export const dynamic = process.env.EXPORT ? 'force-static' : 'auto'

export default async function SignupPage({ searchParams }: any) {
  const user = await auth(searchParams.code)

  if (user) {
    redirect('/')
  }

  return (
    <main>
      <Auth action={signup} actionType="Register" />
    </main>
  )
}
