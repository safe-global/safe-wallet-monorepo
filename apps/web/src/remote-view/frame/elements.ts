import { createRemoteElement } from '@remote-dom/core/elements'

export const UiButtonElement = createRemoteElement<object, object, object, { click(event: CustomEvent): void }>({
  attributes: ['variant', 'size', 'class', 'disabled'],
  events: ['click'],
})

declare global {
  interface HTMLElementTagNameMap {
    'ui-button': InstanceType<typeof UiButtonElement>
  }
}

export const defineRemoteElements = () => {
  customElements.define('ui-button', UiButtonElement)
}
