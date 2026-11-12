'use client'

import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock'

export function Code({
  code,
  lang,
  title,
  className,
}: {
  code: string
  lang: string
  title?: string
  className?: string
}) {
  return <DynamicCodeBlock code={code} lang={lang} codeblock={{ title, className: className ?? 'my-0' }} />
}
