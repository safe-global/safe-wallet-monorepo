import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normaliseBasePath, PLACEHOLDER_ORIGIN, resolveRegistryUrl, withBasePath } from './env.ts'

describe('env', () => {
  it('normalises the base path', () => {
    assert.equal(normaliseBasePath(undefined), '')
    assert.equal(normaliseBasePath(''), '')
    assert.equal(normaliseBasePath('/'), '')
    assert.equal(normaliseBasePath('safe-ui'), '/safe-ui')
    assert.equal(normaliseBasePath('/safe-ui/'), '/safe-ui')
    assert.equal(normaliseBasePath(' /a/b/ '), '/a/b')
  })

  it('prefixes paths', () => {
    assert.equal(withBasePath('/api/search', ''), '/api/search')
    assert.equal(withBasePath('r/x.json', '/safe-ui'), '/safe-ui/r/x.json')
  })

  it('prefers the build-time registry URL', () => {
    assert.equal(
      resolveRegistryUrl({ template: 'https://example.org/r/{name}.json', origin: 'http://localhost:3100' }),
      'https://example.org/r/{name}.json',
    )
  })

  it('falls back to the served origin and base path', () => {
    assert.equal(
      resolveRegistryUrl({ template: '', origin: 'http://localhost:3101/', base: '/safe-ui' }),
      'http://localhost:3101/safe-ui/r/{name}.json',
    )
  })

  it('uses a placeholder before hydration', () => {
    assert.equal(resolveRegistryUrl({ template: '', base: '' }), `${PLACEHOLDER_ORIGIN}/r/{name}.json`)
  })
})
