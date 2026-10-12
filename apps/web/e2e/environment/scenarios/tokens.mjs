import { getAddress, isAddress } from 'ethers'
import { runInLocalService } from './local-service.mjs'
import { waitUntil } from './indexing.mjs'

// Each `manage.py` call starts Django for about 2 s, so one call handles all tokens of a scenario.
const runDjango = (env, lines, input) =>
  runInLocalService(
    env,
    env.SAFE_TXS_SERVICE ?? 'txs-web',
    ['python', 'manage.py', 'shell', '-c', lines.join('\n')],
    input,
  )

/** Stores token metadata as the hosted service curates it, before the indexer reads it from the chain. */
export async function registerTokens(env, tokens) {
  if (!tokens.every(({ address }) => isAddress(address))) throw new Error('Token registration requires valid addresses')
  await runDjango(
    env,
    [
      'import json, sys',
      'from django.core.cache import cache',
      'from safe_transaction_service.tokens.models import Token',
      'for token in json.load(sys.stdin):',
      "    Token.objects.update_or_create(address=token.pop('address'), defaults=token)",
      "cache.delete_pattern('*views.decorators.cache.cache_*')",
      // Balances also keep token info in each web worker's memory for 30 minutes, which no command can clear.
      "cache.delete_pattern('*balances-get_token_info*')",
    ],
    JSON.stringify(tokens.map(({ address, name, symbol, decimals }) => ({ address, name, symbol, decimals }))),
  )
  await Promise.all(
    tokens.map(({ address, symbol }) =>
      waitUntil(env, `${env.SAFE_TXS_BASE_URL}/v1/tokens/${address}/`, (token) => token.symbol === symbol),
    ),
  )
}

export const registerToken = (env, token) => registerTokens(env, [token])

export async function trustTokens(env, addresses) {
  if (!addresses.every(isAddress)) throw new Error('Token registration requires valid addresses')
  await runDjango(
    env,
    [
      'import json, sys',
      'from django.core.cache import cache',
      'from django.core.management import call_command',
      'from safe_transaction_service.tokens.models import Token',
      'addresses = json.load(sys.stdin)',
      "call_command('add_token', *addresses, no_prompt=True)",
      // add_token leaves an existing token untrusted, and the token endpoint caches responses for an hour.
      'Token.objects.filter(address__in=addresses).update(trusted=True)',
      "cache.delete_pattern('*views.decorators.cache.cache_*')",
    ],
    JSON.stringify(addresses.map((address) => getAddress(address))),
  )
  await Promise.all(
    addresses.map((address) =>
      waitUntil(env, `${env.SAFE_TXS_BASE_URL}/v1/tokens/${address}/`, (token) => token.trusted === true),
    ),
  )
}

export const trustToken = (env, address) => trustTokens(env, [address])
