import { createRemoteElement } from '@remote-dom/core/elements'
import { createRemoteComponent } from '@remote-dom/react'
import { defineHtmlElements } from './html'

export const UiSlotElement = createRemoteElement({ attributes: ['name'] })

declare global {
  interface HTMLElementTagNameMap {
    'ui-slot': InstanceType<typeof UiSlotElement>
  }
}

// Marks where the page renders React content the app passed to a view.
export const Slot = createRemoteComponent('ui-slot', UiSlotElement)

export const defineRemoteElements = () => {
  customElements.define('ui-slot', UiSlotElement)
  defineHtmlElements()
}
