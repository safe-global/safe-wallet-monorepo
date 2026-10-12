import { createRemoteElement, RemoteFragmentElement } from '@remote-dom/core/elements'
import { createRemoteComponent } from '@remote-dom/react'
import { defineHtmlElements } from './html'
import { UiComponentElement, UiPrimitiveElement } from './primitive'

export const UiSlotElement = createRemoteElement({ attributes: ['name'] })

declare global {
  interface HTMLElementTagNameMap {
    'ui-slot': InstanceType<typeof UiSlotElement>
    'ui-primitive': InstanceType<typeof UiPrimitiveElement>
    'ui-component': InstanceType<typeof UiComponentElement>
  }
}

// Marks where the page renders React content the app passed to a view.
export const Slot = createRemoteComponent('ui-slot', UiSlotElement)

export const defineRemoteElements = () => {
  customElements.define('ui-slot', UiSlotElement)
  customElements.define('ui-primitive', UiPrimitiveElement)
  customElements.define('ui-component', UiComponentElement)
  if (!customElements.get('remote-fragment')) customElements.define('remote-fragment', RemoteFragmentElement)
  defineHtmlElements()
}
