import { useEffect } from 'react'

const TEXT_ENTRY_TAGS = ['INPUT', 'TEXTAREA', 'SELECT']

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || TEXT_ENTRY_TAGS.includes(target.tagName))

export const useArrowKeyNavigation = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return
      if (event.key === 'ArrowRight') onNext()
      if (event.key === 'ArrowLeft') onBack()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNext, onBack])
}
