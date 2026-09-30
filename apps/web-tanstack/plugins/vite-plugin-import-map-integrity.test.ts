import { test } from 'node:test'
import assert from 'node:assert/strict'

import { __test__ } from './vite-plugin-import-map-integrity.ts'

const { sri, injectIntegrity } = __test__

test('sri produces a sha384 base64 hash with the expected prefix', () => {
  const hash = sri('hello')
  assert.match(hash, /^sha384-[A-Za-z0-9+/]+={0,2}$/)
  assert.equal(sri('hello'), sri('hello'))
  assert.notEqual(sri('hello'), sri('world'))
})

test('injectIntegrity adds integrity to matching tags and an import map', () => {
  const html = '<head></head><body><script type="module" src="/assets/a.js"></script></body>'
  const out = injectIntegrity(html, { '/assets/a.js': 'sha384-AAA' })

  assert.ok(out.includes('integrity="sha384-AAA"'), 'entry script gets integrity')
  assert.ok(out.includes('crossorigin="anonymous"'), 'entry script gets crossorigin')
  assert.ok(out.includes('<script type="importmap">'), 'import map injected')
})

test('import map contains only JS entries and precedes module loads', () => {
  const html = '<head></head><body><script type="module" src="/assets/a.js"></script></body>'
  const out = injectIntegrity(html, { '/assets/a.js': 'sha384-JS', '/assets/a.css': 'sha384-CSS' })

  const map = JSON.parse(out.match(/<script type="importmap">(.*?)<\/script>/s)![1])
  assert.deepEqual(map.integrity, { '/assets/a.js': 'sha384-JS' })
  assert.ok(map.integrity['/assets/a.css'] === undefined, 'css excluded from import map')

  assert.ok(out.indexOf('type="importmap"') < out.indexOf('type="module"'))
})

test('injectIntegrity does not duplicate an existing crossorigin attribute', () => {
  const html = '<head></head><script type="module" crossorigin src="/assets/a.js"></script>'
  const out = injectIntegrity(html, { '/assets/a.js': 'sha384-AAA' })

  assert.equal((out.match(/crossorigin/g) ?? []).length, 1)
  assert.ok(out.includes('integrity="sha384-AAA"'))
})

test('injectIntegrity matches upper-case tags and attributes', () => {
  const html = '<head></head><body><SCRIPT TYPE="module" SRC="/assets/a.js"></SCRIPT></body>'
  const out = injectIntegrity(html, { '/assets/a.js': 'sha384-AAA' })

  assert.ok(out.includes('integrity="sha384-AAA"'), 'upper-case script gets integrity')
  assert.ok(out.includes('crossorigin="anonymous"'), 'upper-case script gets crossorigin')
})

test('injectIntegrity leaves untracked references untouched', () => {
  const html = '<head></head><script src="https://cdn.example.com/x.js"></script>'
  const out = injectIntegrity(html, { '/assets/a.js': 'sha384-AAA' })

  assert.ok(!out.includes('integrity="sha384-AAA"'), 'external script not hashed')
})
