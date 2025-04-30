import CustomLink from '@/components/common/CustomLink'
import type { MDXComponents } from 'mdx/types'
import type { NextPage } from 'next'
import Head from 'next/head'
import SafePrivacyPolicy from '@/markdown/privacy/privacy.md'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'

const overrideComponents: MDXComponents = {
  a: CustomLink,
}

const PrivacyPolicy: NextPage = () => {
  const isOfficialHost = useIsOfficialHost()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Privacy policy`}</title>
      </Head>

      <main>{isOfficialHost && <SafePrivacyPolicy components={overrideComponents} />}</main>
    </>
  )
}

export default PrivacyPolicy
