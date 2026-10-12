import { REMOTE_COMPONENTS } from './components'

describe('REMOTE_COMPONENTS', () => {
  it('maps allowed elements to their host renderers', () => {
    expect(REMOTE_COMPONENTS.get('ui-button')).not.toBe(REMOTE_COMPONENTS.get('img'))
    expect(REMOTE_COMPONENTS.get('div')).not.toBe(REMOTE_COMPONENTS.get('img'))
  })

  it('renders nothing for elements outside the allowlist', () => {
    for (const element of ['img', 'a', 'script', 'iframe', 'style', 'form']) {
      const Renderer = REMOTE_COMPONENTS.get(element) as () => null
      expect(Renderer()).toBeNull()
    }
  })
})
