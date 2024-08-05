export const getOauthUrl = () => {
  const origin =
    typeof window === 'undefined'
      ? process.env.NEXT_PUBLIC_ORIGIN
      : window.location.origin
  return `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${origin}${process.env.NEXT_PUBLIC_BASEPATH}/login`
}
