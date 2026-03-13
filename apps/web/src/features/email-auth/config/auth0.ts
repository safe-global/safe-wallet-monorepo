export const AUTH0_DOMAIN = process.env.NEXT_PUBLIC_AUTH0_DOMAIN ?? ''
export const AUTH0_CLIENT_ID = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID ?? ''

export const isAuth0Configured = Boolean(AUTH0_DOMAIN && AUTH0_CLIENT_ID)
