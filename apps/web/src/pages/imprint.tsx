import type { NextPage } from 'next'
import Head from 'next/head'
import { Typography } from '@/components/ui/typography'
import NextLink from 'next/link'
import { Link } from '@/components/ui/link'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'

const SafeImprint = () => (
  <div>
    <Typography variant="h1" className="mb-4">
      Imprint & Disclaimer
    </Typography>
    <Typography variant="h3" className="mb-4">
      Information in accordance with section 5 of the Telemedia Act (TMG, Germany):
    </Typography>
    <Typography className="mb-4">
      Safe Labs GmbH
      <br />
      Unter den Linden 10
      <br />
      10117 Berlin, Germany
      <br />
    </Typography>
    <Typography className="mb-8">
      Managing director: Rahul Rumalla
      <br />
      Responsible for content: Rahul Rumalla
      <br />
      Contact: <Link render={<NextLink href="mailto:info@safe.global" />}>Email address: info@safe.global</Link>
      <br />
      Commercial register maintained by: Amtsgericht Charlottenburg (Berlin) - Local Court
      <br />
      Register Number: HRB 270980
    </Typography>
    <Typography variant="h3" className="mb-4">
      Disclaimer
    </Typography>
    <Typography className="mb-2">
      <strong>Accountability for content</strong>
    </Typography>
    <Typography className="mb-4">
      The contents of our pages have been created with the utmost care. However, we cannot guarantee the contents’
      accuracy, completeness or topicality. According to statutory provisions, we are furthermore responsible for our
      own content on these web pages. In this context, please note that we are accordingly not obliged to monitor merely
      the transmitted or saved information of third parties, or investigate circumstances pointing to illegal activity.
      Our obligations to remove or block the use of information under generally applicable laws remain unaffected by
      this as per §§ 8 to 10 of the Telemedia Act (TMG).
    </Typography>
    <Typography className="mb-2">
      <strong>Accountability for links</strong>
    </Typography>
    <Typography className="mb-4">
      Responsibility for the content of external links (to web pages of third parties) lies solely with the operators of
      the linked pages. No violations were evident to us at the time of linking. Should any legal infringement become
      known to us, we will remove the respective link immediately.
    </Typography>
    <Typography className="mb-2">
      <strong>Copyright</strong>
    </Typography>
    <Typography>
      This website and their contents are subject to copyright laws.{' '}
      <Link
        render={
          <NextLink
            href="https://github.com/safe-global/safe-wallet-web/blob/dev/LICENSE"
            target="_blank"
            rel="noreferrer"
          />
        }
      >
        The code is open-source, released under GPL-3.0.
      </Link>
    </Typography>
  </div>
)

const Imprint: NextPage = () => {
  const isOfficialHost = useIsOfficialHost()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Imprint`}</title>
      </Head>

      <main>{isOfficialHost && <SafeImprint />}</main>
    </>
  )
}

export default Imprint
