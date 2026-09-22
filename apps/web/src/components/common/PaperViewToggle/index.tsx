import type { ReactNode } from 'react'
import React, { useCallback, useRef, useState } from 'react'
import { ToggleButtonGroup } from '@/components/common/ToggleButtonGroup'

type PaperViewToggleProps = {
  children: {
    title: ReactNode
    content: ReactNode
  }[]
  activeView?: number
  leftAlign?: boolean
  tabsOutside?: boolean
}

export const PaperViewToggle = ({ children, leftAlign, tabsOutside, activeView = 0 }: PaperViewToggleProps) => {
  const [active, setActive] = useState(activeView)
  // Intentionally using undefined to prevent rendering a 0px height on initial render
  const [minHeight, setMinHeight] = useState<number>()
  const stackRef = useRef<HTMLDivElement>(null)

  const onChangeView = useCallback(
    (index: number) => {
      // Avoid height change when switching between views
      setMinHeight((prev) => {
        if (!prev && stackRef.current) {
          return stackRef.current.offsetHeight
        }
        return prev
      })

      setActive(index)
    },
    [stackRef],
  )

  const Content = ({ index }: { index: number }) => children?.[index]?.content || null

  if (tabsOutside) {
    return (
      <div className="flex flex-col gap-4" data-testid="paper-view-toggle-outside">
        <div>
          <ToggleButtonGroup onChange={onChangeView}>{children}</ToggleButtonGroup>
        </div>

        <div className="rounded-md bg-[var(--color-background-main)] pt-2 pb-3">
          <div className="flex flex-col" style={{ height: minHeight ? `${minHeight}px` : undefined }} ref={stackRef}>
            <Content index={active} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md bg-[var(--color-background-main)] pb-3 pt-2">
      <div className="flex flex-col gap-4" style={{ height: minHeight ? `${minHeight}px` : undefined }} ref={stackRef}>
        <div className={`flex justify-between px-4 py-2 ${leftAlign ? 'flex-row' : 'flex-row-reverse'}`}>
          <ToggleButtonGroup onChange={onChangeView}>{children}</ToggleButtonGroup>
        </div>

        <Content index={active} />
      </div>
    </div>
  )
}
