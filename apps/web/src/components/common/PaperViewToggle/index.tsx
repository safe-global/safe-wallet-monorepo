import type { ReactNode } from 'react'
import React, { useCallback, useRef, useState } from 'react'
import { ToggleButtonGroup } from '@/components/common/ToggleButtonGroup'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type PaperViewToggleProps = {
  children: {
    title: ReactNode
    content: ReactNode
  }[]
  activeView?: number
  leftAlign?: boolean
  outlined?: boolean
}

export const PaperViewToggle = ({ children, leftAlign, outlined, activeView = 0 }: PaperViewToggleProps) => {
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

  if (outlined) {
    return (
      <Tabs
        value={String(active)}
        onValueChange={(value: string) => onChangeView(Number(value))}
        className="gap-4 rounded-md border border-[var(--color-border-light)] bg-[var(--color-background-paper)] p-4"
        data-testid="paper-view-toggle-outlined"
      >
        <TabsList>
          {children.map(({ title }, index) => (
            <TabsTrigger key={index} value={String(index)}>
              {title}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex flex-col" style={{ height: minHeight ? `${minHeight}px` : undefined }} ref={stackRef}>
          {children.map(({ content }, index) => (
            <TabsContent key={index} value={String(index)}>
              {content}
            </TabsContent>
          ))}
        </div>
      </Tabs>
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
