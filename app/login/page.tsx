import { auth, signIn } from '@/auth'
import { redirect } from 'next/navigation'
import Auth from '@/views/Auth'

export const dynamic = process.env.EXPORT ? 'force-static' : 'auto'

export default async function LoginPage({ searchParams }: any) {
  const user = await auth(searchParams.code)

  if (user) {
    redirect(process.env.NEXT_PUBLIC_BASEPATH || '/')
  }

  return (
    <main>
      <Auth action={signIn} actionType="Login" />
    </main>
  )
}
