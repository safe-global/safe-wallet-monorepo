import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import RenderAfterMount from './index'

describe('RenderAfterMount', () => {
  it('should, when rendered on the server, return empty HTML', () => {
    const html = renderToString(
      <RenderAfterMount>
        <p>App</p>
      </RenderAfterMount>,
    )

    expect(html).toBe('')
  })

  it('should, when hydrating empty server HTML, render the children without a hydration error', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const onRecoverableError = jest.fn()

    try {
      await act(async () => {
        hydrateRoot(
          container,
          <RenderAfterMount>
            <p>App</p>
          </RenderAfterMount>,
          { onRecoverableError },
        )
      })

      expect(container.innerHTML).toBe('<p>App</p>')
      expect(onRecoverableError).not.toHaveBeenCalled()
    } finally {
      container.remove()
    }
  })
})
