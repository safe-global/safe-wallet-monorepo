import { useEffect, useState } from 'react'
import type { FeedbackTarget } from '../services/linearIssue'
import { CommentFab } from './CommentFab'
import { PinCommentLayer } from './PinCommentLayer'

export type DesignFeedbackProps = {
  // The Linear ticket, team and project that new comments go to.
  target: FeedbackTarget
  // What is open on the page, for example a transaction in a drawer. Pins are kept per context.
  context?: { id: string; label: string }
  // Lets the page pause its own keyboard shortcuts while comment mode is on.
  onActiveChange?: (active: boolean) => void
}

// Pin comments on any element of a design prototype. C or Cmd/Ctrl+C starts comment mode.
export default function DesignFeedback({ target, context, onActiveChange }: DesignFeedbackProps) {
  const [active, setActive] = useState(false)

  useEffect(() => onActiveChange?.(active), [active, onActiveChange])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]'))
        return
      const command = event.metaKey || event.ctrlKey
      // Cmd/Ctrl+C only means "comment" when nothing is selected, so copying text still works.
      if (event.key !== 'c' || event.altKey || (command && window.getSelection()?.isCollapsed === false)) return
      if (command) event.preventDefault()
      setActive(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <CommentFab active={active} onToggle={() => setActive(!active)} />
      <PinCommentLayer
        active={active}
        onEnter={() => setActive(true)}
        onExit={() => setActive(false)}
        target={target}
        transaction={context}
      />
    </>
  )
}
