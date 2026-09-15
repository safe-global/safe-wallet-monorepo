import CustomLink from '@/components/common/CustomLink'
import MarkdownContent from '@/components/common/MarkdownContent'
import type { NextPage } from 'next'
import Head from 'next/head'
import SafeEula from '@/markdown/eula/eula.md'
import type { MDXComponents } from 'mdx/types'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'

const overrideComponents: MDXComponents = {
  a: CustomLink,
}

const Eula: NextPage = () => {
  const isOfficialHost = useIsOfficialHost()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – EULA`}</title>
      </Head>

      <main style={{ lineHeight: '1.5' }}>
        {isOfficialHost && (
          <MarkdownContent>
            <SafeEula components={overrideComponents} />
          </MarkdownContent>
        )}
      </main>
    </>
  )
}

export default Eula
