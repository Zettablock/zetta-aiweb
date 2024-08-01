'use server'

import { getOauthUrl } from '@/auth'
import { resolvePublicPath } from '@/lib/resolvePublicPath'
import Image from 'next/image'
import Link from 'next/link'

interface AuthProps {
  action: any
  actionType: 'Login' | 'Register'
}

export default async function Auth({ action, actionType }: AuthProps) {
  return (
    <div className="min-h-[calc(100vh-380px)] pt-16">
      <div className="max-w-[460px] mx-auto">
        <div className="flex justify-center">
          <Image
            width={200}
            height={50}
            alt="Zettablock Logo"
            src={resolvePublicPath('/zettablock-logo.svg')}
          />
        </div>
        <div className="bg-white mt-8 pb-10">
          <div className="bg-[#FBFCFD] px-8 py-6 flex justify-between items-center">
            <span className=" font-bold">
              {actionType === 'Login' ? 'Login' : 'Sign Up'}
            </span>

            {actionType === 'Login' && (
              <span className="text-sm">
                Don&rsquo;t have an account?{' '}
                <Link
                  href={resolvePublicPath('/signup')}
                  className="text-[#263DFF] hover:cursor-pointer font-bold"
                >
                  Sign up
                </Link>
              </span>
            )}
          </div>
          <form className="w-full px-8">
            <div className="form-control w-full mt-6">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                placeholder="email@example.com"
                type="text"
                className="input input-bordered w-full border-transparent bg-[#F8F9FA]"
                name="username"
              />
            </div>
            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                placeholder="**********"
                type="password"
                className="input input-bordered w-full border-transparent bg-[#F8F9FA]"
                name="password"
              />
            </div>

            <button className="btn btn-primary bg-[#263DFF] mt-10 w-full">
              {actionType}
            </button>
          </form>
          {actionType === 'Login' ? (
            <div className="text-center mt-5 text-sm px-8 font-semibold">
              By logging in, you are agreeing to the{' '}
              <a
                className="text-[#263DFF]"
                href="https://www.zettablock.com/terms"
                target="_blank"
                rel="noreferrer"
              >
                Terms of Service
              </a>{' '}
              and confirm that you have read the{' '}
              <a
                className="text-[#263DFF]"
                href="https://www.zettablock.com/privacy"
                target="_blank"
                rel="noreferrer"
              >
                Privacy Policy
              </a>
              .
            </div>
          ) : (
            <div className="text-center mt-5 text-sm px-8 font-semibold">
              <span className="text-sm">
                <Link
                  href={resolvePublicPath('/login')}
                  className="text-[#263DFF] hover:cursor-pointer font-bold"
                >
                  Return to Login
                </Link>
              </span>
            </div>
          )}

          <div className="px-8 mt-5">
            <div className={'border border-base-300 h-0 mb-5 border-b-0'} />
            <Link
              href={getOauthUrl()}
              className="btn btn-outline gap-5 w-full normal-case text-xl"
            >
              Continue with Github
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
