import { Auth } from '@/components/Auth'
import { redirect } from 'next/navigation'

export const dynamic = process.env.NEXT_PUBLIC_EXPORT ? 'force-static' : 'auto'

export default async function SignupPage({ searchParams }: any) {
  return (
    <main>
      <form>
        <Auth actionType="Register" />
      </form>
    </main>
  )
}
