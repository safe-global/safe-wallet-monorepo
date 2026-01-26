import { useState, useRef, DragEventHandler, useMemo } from 'react'

export interface DropHandlers {
  onDragOver: DragEventHandler
  onDragEnter: DragEventHandler
  onDragLeave: DragEventHandler
  onDrop: DragEventHandler
}

const useDropZone = (
  onDrop: (file: File | null) => void,
  accept: string,
): {
  isOverDropZone: boolean
  isAcceptError: boolean
  dropHandlers: DropHandlers
} => {
  const [isOverDropZone, setIsOverDropZone] = useState<boolean>(false)
  const [isAcceptError, setIsAcceptError] = useState<boolean>(false)
  const counter = useRef(0)

  const handlers: DropHandlers = useMemo(
    () => ({
      onDragOver(event) {
        event.preventDefault()
      },
      onDragEnter(event) {
        event.preventDefault()
        counter.current++
        setIsOverDropZone(true)
      },
      onDragLeave(event) {
        event.preventDefault()
        counter.current--
        if (counter.current === 0) {
          setIsOverDropZone(false)
        }
      },
      onDrop(event) {
        event.preventDefault()
        counter.current = 0
        setIsOverDropZone(false)
        event.persist()

        const files = Array.from(event?.dataTransfer?.files ?? [])

        if (files.length !== 1) {
          onDrop(null)
          return
        }

        const fileName = files[0].name
        const fileExtension = fileName.split('.').pop()

        if (!accept.split(',').includes(`.${fileExtension}`)) {
          onDrop(null)
          setIsAcceptError(true)
          setTimeout(() => {
            setIsAcceptError(false)
          }, 2000)
          return
        }

        onDrop(files[0])
      },
    }),
    [accept, onDrop],
  )

  return { isOverDropZone, isAcceptError, dropHandlers: handlers }
}

export default useDropZone
