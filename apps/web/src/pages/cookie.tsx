import type { ComponentProps } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'
import SafeCookiePolicy from '@/markdown/cookie/cookie.md'
import type { MDXComponents } from 'mdx/types'
import CustomLink from '@/components/common/CustomLink'
import { Table as MuiTable, TableHead, TableBody, TableRow, TableCell } from '@mui/material'

const Table = (props: ComponentProps<typeof MuiTable>) => <MuiTable {...props} sx={{ border: '1px solid black' }} />
const Th = (props: ComponentProps<typeof TableCell>) => (
  <TableCell {...props} component="th" sx={{ fontWeight: 'bold', bgcolor: '#fff', color: 'black' }} />
)
const Td = (props: ComponentProps<typeof TableCell>) => <TableCell {...props} />
const Tr = (props: ComponentProps<typeof TableRow>) => <TableRow {...props} />

const overrideComponents: MDXComponents = {
  a: CustomLink,
  table: Table,
  thead: TableHead,
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

      <main>{isOfficialHost && <SafeCookiePolicy components={overrideComponents} />}</main>
    </>
  )
}

export default CookiePolicy
