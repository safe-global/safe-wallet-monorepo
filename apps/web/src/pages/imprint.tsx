import type { NextPage } from 'next'
import Head from 'next/head'
import { Typography } from '@mui/material'
import Link from 'next/link'
import MUILink from '@mui/material/Link'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'

const SafeImprint = () => (
  <div>
    <Typography variant="h1" mb={2}>
      Imprint & Disclaimer
    </Typography>
    <Typography variant="h3" mb={2}>
      Information in accordance with section 5 of the Telemedia Act (TMG, Germany):
    </Typography>
    <Typography mb={2}>
      Core Contributors GmbH
      <br />
      c/o WeWork
      <br />
      Dircksenstr. 3
      <br />
      10179 Berlin, Germany
    </Typography>
    <Typography mb={4}>
      Managing director: Richard Meißner
      <br />
      Contact:{' '}
      <Link href="mailto:info@cc0x.dev" passHref legacyBehavior>
        <MUILink>info@cc0x.dev</MUILink>
      </Link>
      <br />
      District Court: Berlin Charlottenburg
      <br />
      Register Number: HRB 240421 B
    </Typography>
    <Typography variant="h3" mb={2}>
      Disclaimer
    </Typography>
    <Typography mb={1}>
      <strong>Accountability for content</strong>
    </Typography>
    <Typography mb={2}>
      The contents of our pages have been created with the utmost care. However, we cannot guarantee the contents’
      accuracy, completeness or topicality. According to statutory provisions, we are furthermore responsible for our
      own content on these web pages. In this context, please note that we are accordingly not obliged to monitor merely
      the transmitted or saved information of third parties, or investigate circumstances pointing to illegal activity.
      Our obligations to remove or block the use of information under generally applicable laws remain unaffected by
      this as per §§ 8 to 10 of the Telemedia Act (TMG).
    </Typography>
    <Typography mb={1}>
      <strong>Accountability for links</strong>
    </Typography>
    <Typography mb={2}>
      Responsibility for the content of external links (to web pages of third parties) lies solely with the operators of
      the linked pages. No violations were evident to us at the time of linking. Should any legal infringement become
      known to us, we will remove the respective link immediately.
    </Typography>
    <Typography mb={1}>
      <strong>Copyright</strong>
    </Typography>
    <Typography>
      This website and their contents are subject to copyright laws.{' '}
      <Link href="https://github.com/safe-global/safe-wallet-web/blob/dev/LICENSE" passHref legacyBehavior>
        <MUILink target="_blank" rel="noreferrer">
          The code is open-source, released under GPL-3.0.
        </MUILink>
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
