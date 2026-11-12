import { getProps } from '@/lib/generated'

const UTILITIES = new Set(['merge-props', 'use-render'])

export function BaseUiReference({ component }: { component: string }) {
  const parts = getProps(component).baseUi.filter((part) => !UTILITIES.has(part))
  if (parts.length === 0) return null
  return (
    <p>
      Built on Base UI{' '}
      {parts.map((part, index) => (
        <span key={part}>
          {index > 0 ? ', ' : ''}
          <a href={`https://base-ui.com/react/components/${part}`} target="_blank" rel="noreferrer">
            {part}
          </a>
        </span>
      ))}
      , which handles focus, keyboard interaction and ARIA attributes. See its documentation for the full reference.
    </p>
  )
}
