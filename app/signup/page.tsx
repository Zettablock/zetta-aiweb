import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function SignupPage() {
  const user = await auth()

  if (user) {
    redirect('/')
  }

  return <main className="flex flex-col p-4">signup</main>
}
