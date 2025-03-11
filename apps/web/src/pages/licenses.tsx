import type { NextPage } from 'next'
import Head from 'next/head'
import { Typography, Table, TableBody, TableRow, TableCell, TableHead, TableContainer, Box } from '@mui/material'
import ExternalLink from '@/components/common/ExternalLink'
import Paper from '@mui/material/Paper'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'

const SafeLicenses = () => (
  <>
    <Typography variant="h1" mb={2}>
      Licenses
    </Typography>
    <Typography variant="h3" mb={2}>
      Libraries we use
    </Typography>
    <Box mb={4}>
      <Typography mb={3}>
        This page contains a list of attribution notices for third party software that may be contained in portions of
        the {BRAND_NAME}. We thank the open source community for all of their contributions.
      </Typography>
      <Typography variant="h2" mb={2}>
        Android
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="30%">
                <strong>Library</strong>
              </TableCell>
              <TableCell>
                <strong>License</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>AndroidX</TableCell>
              <TableCell>
                <ExternalLink href="https://android.googlesource.com/platform/frameworks/support/%2B/androidx-master-dev/LICENSE.txt" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Bivrost for Kotlin</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/gnosis/bivrost-kotlin/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Dagger</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/google/dagger#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>FloatingActionButton</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/Clans/FloatingActionButton/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Material Progress Bar</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/DreaminginCodeZH/MaterialProgressBar/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Kethereum</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/walleth/kethereum/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Koptional</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/gojuno/koptional#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Moshi</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/square/moshi#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>OkHttp</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/square/okhttp#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Okio</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/square/okio#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Phrase</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/square/phrase/#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Picasso</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/square/picasso#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>ReTrofit</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/square/reTrofit#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>RxAndroid</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/ReactiveX/RxAndroid#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>RxBinding</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/JakeWharton/RxBinding#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>RxJava</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/ReactiveX/RxJava#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>RxKotlin</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/ReactiveX/RxKotlin/blob/2.x/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>SpongyCastle</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/rtyley/spongycastle/blob/spongy-master/LICENSE.html" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Svalinn Android</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/gnosis/svalinn-kotlin/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Timber</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/JakeWharton/timber#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Zxing</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/zxing/zxing/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    <Box mb={4}>
      <Typography variant="h2" mb={2}>
        iOS
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="30%">
                <strong>Library</strong>
              </TableCell>
              <TableCell>
                <strong>License</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>BigInt</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/attaswift/BigInt/blob/master/LICENSE.md" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>BlockiesSwift</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/gnosis/BlockiesSwift/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>CryptoEthereumSwift</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/yuzushioh/CryptoEthereumSwift/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>CryptoSwift</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/krzyzanowskim/CryptoSwift#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>DateTools</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/gnosis/DateTools#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>EthereumKit</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/D-Technologies/EthereumKit#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Keycard.swift</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/gnosis/Keycard.swift/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Kingfisher</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/onevcat/Kingfisher#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>SipHash</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/attaswift/SipHash/blob/master/LICENSE.md" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Starscream</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/daltoniam/Starscream/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>RsBarcodesSwift</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/yeahdongcn/RSBarcodes_Swift#license" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>libidn2</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/gnosis/libidn2/blob/master/COPYING.LESSERv3" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>libunisTring</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/gnosis/libunisTring/blob/master/COPYING.LIB" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    <Box>
      <Typography variant="h2" mb={2}>
        Web
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="30%">Library</TableCell>
              <TableCell>License</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>@emotion/cache</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/emotion-js/emotion/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@emotion/react</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/emotion-js/emotion/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@emotion/server</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/emotion-js/emotion/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@emotion/styled</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/emotion-js/emotion/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@safe-global/safe-modules-deployments</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/safe-global/safe-modules-deployments/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@mui/icons-material</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/mui/material-ui/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@mui/material</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/mui/material-ui/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@mui/x-date-pickers</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/mui/mui-x#mit-vs-commercial-licenses" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@reduxjs/toolkit</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/reduxjs/redux-toolkit/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@safe-global/safe-apps-sdk</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/safe-global/safe-apps-sdk/blob/main/LICENSE.md" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@safe-global/safe-core-sdk</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@safe-global/safe-deployments</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/safe-global/safe-deployments/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@safe-global/safe-gateway-typescript-sdk</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/safe-global/safe-gateway-typescript-sdk/blob/main/LICENSE.md" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@safe-global/safe-react-components</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/safe-global/safe-react-components/blob/main/LICENSE.md" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@sentry/react</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/getsentry/sentry-javascript/blob/develop/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@sentry/tracing</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/getsentry/sentry-javascript/blob/develop/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@web3-onboard/coinbase</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@web3-onboard/core</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@web3-onboard/injected-wallets</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@web3-onboard/keystone</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@web3-onboard/ledger</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@web3-onboard/trezor</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>@web3-onboard/walletconnect</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>classnames</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/JedWatson/classnames/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>date-fns</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/date-fns/date-fns/blob/main/LICENSE.md" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>blo</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/bpierre/blo" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>ethers</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/ethers-io/ethers.js/blob/main/LICENSE.md" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>exponential-backoff</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/coveo/exponential-backoff/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>fuse.js</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/krisk/Fuse/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>js-cookie</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/js-cookie/js-cookie/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>lodash</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/lodash/lodash/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>next</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/vercel/next.js/blob/canary/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>next-pwa</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/shadowwalker/next-pwa/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>papaparse</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/mholt/PapaParse/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>qrcode.react</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/zpao/qrcode.react/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>react</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/facebook/react/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>react-dom</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/facebook/react/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>react-dropzone</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/react-dropzone/react-dropzone/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>react-hook-form</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/react-hook-form/react-hook-form/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>react-papaparse</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/Bunlong/react-papaparse/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>react-redux</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/reduxjs/react-redux/blob/master/LICENSE" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>semver</TableCell>
              <TableCell>
                <ExternalLink href="https://github.com/npm/node-semver/blob/main/LICENSE" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  </>
)

const Licenses: NextPage = () => {
  const isOfficialHost = useIsOfficialHost()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Licenses`}</title>
      </Head>

      <main>{isOfficialHost && <SafeLicenses />}</main>
    </>
  )
}

export default Licenses
