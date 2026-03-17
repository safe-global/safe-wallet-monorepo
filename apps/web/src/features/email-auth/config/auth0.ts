export const AUTH0_DOMAIN = process.env.NEXT_PUBLIC_AUTH0_DOMAIN ?? ''
export const AUTH0_CLIENT_ID = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID ?? ''
export const AUTH0_AUDIENCE = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE ?? ''

export const isAuth0Configured = Boolean(AUTH0_DOMAIN && AUTH0_CLIENT_ID)
