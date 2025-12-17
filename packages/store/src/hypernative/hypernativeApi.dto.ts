/**
 * DTOs for Hypernative OAuth token exchange
 */

export type HypernativeTokenExchangeRequestDto = {
  grant_type: 'authorization_code'
  code: string
  redirect_uri: string
  client_id: string
  code_verifier: string
}

/**
 * Hypernative API token response format
 * The API wraps the OAuth token response in a `data` object
 */
export type HypernativeTokenExchangeResponseDto = {
  data: {
    access_token: string
    expires_in: number
    scope: string
    token_type: string
  }
}
