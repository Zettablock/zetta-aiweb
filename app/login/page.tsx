import { auth, signIn } from '@/auth'
import { redirect } from 'next/navigation'
import { Login } from './Login'

export default async function LoginPage() {
  const user = await auth()

  console.error(user)
  if (user) {
    redirect('/')
  }

  return (
    <main>
      <Login />
    </main>
  )
}
