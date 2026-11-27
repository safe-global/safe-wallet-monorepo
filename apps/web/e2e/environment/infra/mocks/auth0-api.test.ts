import assert from 'node:assert/strict'
import { generateKeyPairSync, verify } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, it } from 'node:test'
import { Auth0, CANCELLED, CODE, MFA_ACR, SESSION_COOKIE, dispatch, rs256, userId } from './auth0-api.ts'
import type { HeaderMap, Reply } from './http.ts'

const ISSUER = 'https://auth.safe-e2e.test/'
const CLIENT = { client_id: 'client', client_secret: 'secret' }
const CALLBACK = 'http://localhost:8000/cgw/v1/auth/oidc/callback'
const EMAIL = 'admin@safe-e2e.test'
const COMPOSE = readFileSync(new URL('../docker-compose.test.yml', import.meta.url), 'utf8')

type Claims = Record<string, unknown>

function claims(token: string): Claims {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as Claims
}

function locationQuery(reply: Reply): Record<string, string> {
  return Object.fromEntries(new URL(reply.headers.Location).searchParams)
}

describe('Auth0 mock', () => {
  let auth0: Auth0

  beforeEach(() => {
    auth0 = new Auth0(ISSUER, CLIENT.client_id, CLIENT.client_secret, () => Buffer.from('signature'))
  })

  function request(
    method: string,
    path: string,
    options: { query?: Record<string, string>; form?: Record<string, string>; headers?: HeaderMap } = {},
  ): Reply {
    const body = new URLSearchParams(options.form ?? {}).toString()
    const query = new URLSearchParams(options.query ?? {})
    return dispatch({ method, path, query, headers: options.headers ?? {}, body }, auth0, { keys: [] })
  }

  function submit(fields: Record<string, string>, headers: HeaderMap = {}): Reply {
    const form = { redirect_uri: CALLBACK, state: 'state-1', action: 'verify', ...fields }
    return request('POST', '/authorize', { form, headers })
  }

  function signIn(fields: Record<string, string> = {}): { code: string; session: HeaderMap } {
    const reply = submit({ email: EMAIL, code: CODE, ...fields })
    assert.equal(reply.status, 302)
    return { code: locationQuery(reply).code, session: { cookie: reply.headers['Set-Cookie'].split(';')[0] } }
  }

  function exchange(code: string): [number, Record<string, string>] {
    const reply = request('POST', '/oauth/token', { form: { grant_type: 'authorization_code', code, ...CLIENT } })
    return [reply.status, JSON.parse(reply.body)]
  }

  function idTokenOf(reply: Reply): Claims {
    return claims(exchange(locationQuery(reply).code)[1].id_token)
  }

  function managementToken(): HeaderMap {
    const reply = request('POST', '/oauth/token', { form: { grant_type: 'client_credentials', ...CLIENT } })
    return { authorization: `Bearer ${JSON.parse(reply.body).access_token}` }
  }

  it('asks for the email only at sign-in', () => {
    const signInPage = request('GET', '/authorize', { query: { redirect_uri: CALLBACK, state: 's' } }).body
    const stepUpPage = request('GET', '/authorize', { query: { redirect_uri: CALLBACK, acr_values: MFA_ACR } }).body
    assert.match(signInPage, /name="email"/)
    assert.match(signInPage, /Sign in without a second factor/)
    assert.doesNotMatch(stepUpPage, /name="email"/)
    assert.match(stepUpPage, /Do not report the second factor/)
  })

  it('escapes the authorize parameters it carries through the form', () => {
    const page = request('GET', '/authorize', { query: { redirect_uri: CALLBACK, state: '"><script>' } }).body
    assert.match(page, /value="&quot;&gt;&lt;script&gt;"/)
    assert.doesNotMatch(page, /<script/i)
  })

  it('shows an error for a wrong code and issues nothing', () => {
    const reply = submit({ email: EMAIL, code: '000000' })
    assert.equal(reply.status, 200)
    assert.match(reply.body, /role="alert">Wrong code. Try again./)
    assert.equal(reply.headers.Location, undefined)
  })

  it('returns the documented cancellation with the state', () => {
    const reply = submit({ action: 'cancel' })
    assert.equal(reply.status, 302)
    assert.deepEqual(locationQuery(reply), { ...CANCELLED, state: 'state-1' })
  })

  it('refuses a form without a redirect URI', () => {
    assert.equal(request('POST', '/authorize', { form: { code: CODE, email: EMAIL } }).status, 400)
  })

  it('signs in with a verified email and a second factor', () => {
    const [status, body] = exchange(signIn().code)
    assert.equal(status, 200)
    assert.equal(body.token_type, 'Bearer')
    const token = claims(body.id_token)
    assert.equal(token.iss, ISSUER)
    assert.equal(token.aud, 'client')
    assert.equal(token.sub, userId(EMAIL))
    assert.deepEqual([token.email, token.email_verified, token.amr], [EMAIL, true, ['mfa']])
  })

  it('redeems each code once', () => {
    const { code } = signIn()
    assert.equal(exchange(code)[0], 200)
    assert.equal(exchange(code)[0], 403)
  })

  it('signs in without amr when the second factor is skipped', () => {
    assert.equal('amr' in claims(exchange(signIn({ skip_mfa: 'on' }).code)[1].id_token), false)
  })

  it('steps up the user of the Auth0 session', () => {
    const { session } = signIn({ skip_mfa: 'on' })
    const reply = submit({ acr_values: MFA_ACR, code: CODE }, session)
    assert.equal(reply.status, 302)
    const token = idTokenOf(reply)
    assert.deepEqual([token.email, token.amr], [EMAIL, ['mfa']])
  })

  it('leaves amr out of a step-up on request', () => {
    const { session } = signIn()
    const reply = submit({ acr_values: MFA_ACR, code: CODE, omit_amr: 'on' }, session)
    assert.equal('amr' in idTokenOf(reply), false)
  })

  it('refuses a step-up without an Auth0 session', () => {
    const reply = submit({ acr_values: MFA_ACR, code: CODE }, { cookie: `${SESSION_COOKIE}=unknown` })
    assert.equal(reply.status, 200)
    assert.equal(reply.headers.Location, undefined)
    assert.match(reply.body, /Your session has expired/)
  })

  it('rejects unknown client credentials and grant types', () => {
    const unknownClient = { grant_type: 'client_credentials', client_id: 'x' }
    assert.equal(request('POST', '/oauth/token', { form: unknownClient }).status, 401)
    assert.equal(request('POST', '/oauth/token', { form: { grant_type: 'password', ...CLIENT } }).status, 400)
  })

  it('lists, enrolls and deletes authenticators', () => {
    const path = `/api/v2/users/${encodeURIComponent(userId(EMAIL))}/authentication-methods`
    assert.equal(request('GET', path).status, 401)
    const { session } = signIn()
    const token = managementToken()
    const list = (): { id: string; type: string }[] => JSON.parse(request('GET', path, { headers: token }).body)
    assert.deepEqual(
      list().map((method) => method.type),
      ['totp'],
    )
    submit({ acr_values: MFA_ACR, code: CODE, 'ext-enroll-otp': 'true' }, session)
    const methods = list()
    assert.equal(methods.length, 2)
    const methodPath = `${path}/${encodeURIComponent(methods[0].id)}`
    assert.equal(request('DELETE', methodPath, { headers: token }).status, 204)
    assert.equal(request('DELETE', methodPath, { headers: token }).status, 404)
    assert.equal(list().length, 1)
  })

  it('returns from logout', () => {
    const reply = request('GET', '/v2/logout', { query: { returnTo: 'http://localhost:3080/welcome' } })
    assert.deepEqual([reply.status, reply.headers.Location], [302, 'http://localhost:3080/welcome'])
  })

  it('lets the gateway trust the shared certificate and reach the mock by its domain', () => {
    for (const expected of [
      'AUTH0_DOMAIN: auth.safe-e2e.test',
      'NODE_EXTRA_CA_CERTS: /mock-keys/tls-cert.pem',
      '- auth.safe-e2e.test',
      'DNS:api.cow.fi,DNS:auth.safe-e2e.test',
    ]) {
      assert.ok(COMPOSE.includes(expected), `docker-compose.test.yml lacks ${expected}`)
    }
  })

  it('signs RS256 with the published key', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const { signer, jwks } = rs256(privateKey.export({ type: 'pkcs1', format: 'pem' }))
    const [published] = jwks.keys
    assert.equal(published.n, publicKey.export({ format: 'jwk' }).n)
    assert.deepEqual([published.kid, published.alg, published.use], ['safe-e2e-local', 'RS256', 'sig'])
    const message = Buffer.from('header.payload')
    assert.ok(verify('sha256', message, publicKey, signer(message)))
  })
})
