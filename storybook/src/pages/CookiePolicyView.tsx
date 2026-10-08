import type { ComponentProps, ReactNode } from 'react'
import type { MDXComponents } from 'mdx/types'
import CustomLink from '@/components/common/CustomLink'
import MarkdownContent from '@/components/common/MarkdownContent'
import { Table as ShadcnTable, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table'

const Table = (props: ComponentProps<typeof ShadcnTable>) => (
  <ShadcnTable {...props} className="border border-[black]" />
)
const Th = (props: ComponentProps<typeof TableHead>) => (
  <TableHead {...props} className="font-bold bg-[#fff] text-[black]" />
)
const Td = (props: ComponentProps<typeof TableCell>) => <TableCell {...props} />
const Tr = (props: ComponentProps<typeof TableRow>) => <TableRow {...props} />

export const cookiePolicyComponents: MDXComponents = {
  a: CustomLink,
  table: Table,
  thead: TableHeader,
  tbody: TableBody,
  tr: Tr,
  th: Th,
  td: Td,
}

export type CookiePolicyViewProps = {
  isOfficialHost: boolean
  policy: ReactNode
}

export const CookiePolicyView = ({ isOfficialHost, policy }: CookiePolicyViewProps) => {
  return <main style={{ lineHeight: '1.5' }}>{isOfficialHost && <MarkdownContent>{policy}</MarkdownContent>}</main>
}
