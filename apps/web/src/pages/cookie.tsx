import type { ComponentProps } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'
import SafeCookiePolicy from '@/markdown/cookie/cookie.md'
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

const overrideComponents: MDXComponents = {
  a: CustomLink,
  table: Table,
  thead: TableHeader,
  tbody: TableBody,
  tr: Tr,
  th: Th,
  td: Td,
}

const CookiePolicy: NextPage = () => {
  const isOfficialHost = useIsOfficialHost()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Cookie policy`}</title>
      </Head>

      <main style={{ lineHeight: '1.5' }}>
        {isOfficialHost && (
          <MarkdownContent>
            <SafeCookiePolicy components={overrideComponents} />
          </MarkdownContent>
        )}
      </main>
    </>
  )
}

export default CookiePolicy
