import { Auth } from '@/components/Auth'
import { authMe } from '@/modules/apis/qugate-v2-auth/authMe'
import { httpClient } from '@/modules/http-client'

httpClient.defaults.baseURL = process.env.NEXT_API_GATEWAY

export const dynamic = process.env.NEXT_PUBLIC_EXPORT ? 'force-static' : 'auto'

export default async function LoginPage({ searchParams }: any) {
  return (
    <main>
      <form>
        <Auth actionType="Login" />
      </form>
    </main>
  )
}
