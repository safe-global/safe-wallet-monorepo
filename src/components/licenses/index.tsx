import { Typography, Table, TableBody, TableRow, TableCell, TableHead, TableContainer, Box } from '@mui/material'
import ExternalLink from '@/components/common/ExternalLink'
import Paper from '@mui/material/Paper'

const SafeLicenses = () => {
  return (
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
          the {'BNB Safe'}. We thank the open source community for all of their contributions.
        </Typography>
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
                <TableCell>@date-io/date-fns</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/dmtrKovalenko/date-io/blob/master/LICENSE">
                    https://github.com/dmtrKovalenko/date-io/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@emotion/cache</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/emotion-js/emotion/blob/main/LICENSE">
                    https://github.com/emotion-js/emotion/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@emotion/react</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/emotion-js/emotion/blob/main/LICENSE">
                    https://github.com/emotion-js/emotion/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@emotion/server</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/emotion-js/emotion/blob/main/LICENSE">
                    https://github.com/emotion-js/emotion/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@emotion/styled</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/emotion-js/emotion/blob/main/LICENSE">
                    https://github.com/emotion-js/emotion/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@safe-global/safe-modules-deployments</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/safe-global/safe-modules-deployments/blob/main/LICENSE">
                    https://github.com/safe-global/safe-modules-deployments/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@mui/icons-material</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/mui/material-ui/blob/master/LICENSE">
                    https://github.com/mui/material-ui/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@mui/material</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/mui/material-ui/blob/master/LICENSE">
                    https://github.com/mui/material-ui/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@mui/x-date-pickers</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/mui/mui-x#mit-vs-commercial-licenses">
                    https://github.com/mui/mui-x#mit-vs-commercial-licenses
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@reduxjs/toolkit</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/reduxjs/redux-toolkit/blob/master/LICENSE">
                    https://github.com/reduxjs/redux-toolkit/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@safe-global/safe-apps-sdk</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/safe-global/safe-apps-sdk/blob/main/LICENSE.md">
                    https://github.com/safe-global/safe-apps-sdk/blob/main/LICENSE.md
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@safe-global/safe-core-sdk</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md">
                    https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@safe-global/safe-core-sdk-utils</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md">
                    https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@safe-global/safe-deployments</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/safe-global/safe-deployments/blob/main/LICENSE">
                    https://github.com/safe-global/safe-deployments/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@safe-global/safe-ethers-lib</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md">
                    https://github.com/safe-global/safe-core-sdk/blob/main/LICENSE.md
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@safe-global/safe-gateway-typescript-sdk</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/safe-global/safe-gateway-typescript-sdk/blob/main/LICENSE.md">
                    https://github.com/safe-global/safe-gateway-typescript-sdk/blob/main/LICENSE.md
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@safe-global/safe-react-components</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/safe-global/safe-react-components/blob/main/LICENSE.md">
                    https://github.com/safe-global/safe-react-components/blob/main/LICENSE.md
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@sentry/react</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/getsentry/sentry-javascript/blob/develop/LICENSE">
                    https://github.com/getsentry/sentry-javascript/blob/develop/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@sentry/tracing</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/getsentry/sentry-javascript/blob/develop/LICENSE">
                    https://github.com/getsentry/sentry-javascript/blob/develop/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@truffle/hdwallet-provider</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/trufflesuite/truffle/blob/develop/LICENSE">
                    https://github.com/trufflesuite/truffle/blob/develop/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@web3-onboard/coinbase</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE">
                    https://github.com/blocknative/web3-onboard/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@web3-onboard/core</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE">
                    https://github.com/blocknative/web3-onboard/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@web3-onboard/injected-wallets</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE">
                    https://github.com/blocknative/web3-onboard/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@web3-onboard/keystone</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE">
                    https://github.com/blocknative/web3-onboard/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@web3-onboard/ledger</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE">
                    https://github.com/blocknative/web3-onboard/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@web3-onboard/trezor</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE">
                    https://github.com/blocknative/web3-onboard/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>@web3-onboard/walletconnect</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/blocknative/web3-onboard/blob/main/LICENSE">
                    https://github.com/blocknative/web3-onboard/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>classnames</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/JedWatson/classnames/blob/main/LICENSE">
                    https://github.com/JedWatson/classnames/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>date-fns</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/date-fns/date-fns/blob/main/LICENSE.md">
                    https://github.com/date-fns/date-fns/blob/main/LICENSE.md
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>ethereum-blockies-base64</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/MyCryptoHQ/ethereum-blockies-base64">
                    https://github.com/MyCryptoHQ/ethereum-blockies-base64
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>ethers</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/ethers-io/ethers.js/blob/main/LICENSE.md">
                    https://github.com/ethers-io/ethers.js/blob/main/LICENSE.md
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>exponential-backoff</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/coveo/exponential-backoff/blob/master/LICENSE">
                    https://github.com/coveo/exponential-backoff/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>fuse.js</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/krisk/Fuse/blob/master/LICENSE">
                    https://github.com/krisk/Fuse/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>js-cookie</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/js-cookie/js-cookie/blob/main/LICENSE">
                    https://github.com/js-cookie/js-cookie/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>lodash</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/lodash/lodash/blob/master/LICENSE">
                    https://github.com/lodash/lodash/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>next</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/vercel/next.js/blob/canary/LICENSE">
                    https://github.com/vercel/next.js/blob/canary/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>next-pwa</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/shadowwalker/next-pwa/blob/master/LICENSE">
                    https://github.com/shadowwalker/next-pwa/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>papaparse</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/mholt/PapaParse/blob/master/LICENSE">
                    https://github.com/mholt/PapaParse/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>qrcode.react</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/zpao/qrcode.react/blob/main/LICENSE">
                    https://github.com/zpao/qrcode.react/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>react</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/facebook/react/blob/main/LICENSE">
                    https://github.com/facebook/react/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>react-dom</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/facebook/react/blob/main/LICENSE">
                    https://github.com/facebook/react/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>react-dropzone</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/react-dropzone/react-dropzone/blob/master/LICENSE">
                    https://github.com/react-dropzone/react-dropzone/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>react-gtm-module</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/alinemorelli/react-gtm/blob/master/LICENSE">
                    https://github.com/alinemorelli/react-gtm/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>react-hook-form</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/react-hook-form/react-hook-form/blob/master/LICENSE">
                    https://github.com/react-hook-form/react-hook-form/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>react-papaparse</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/Bunlong/react-papaparse/blob/master/LICENSE">
                    https://github.com/Bunlong/react-papaparse/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>react-qr-reader</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/JodusNodus/react-qr-reader/blob/master/LICENSE">
                    https://github.com/JodusNodus/react-qr-reader/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>react-redux</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/reduxjs/react-redux/blob/master/LICENSE">
                    https://github.com/reduxjs/react-redux/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>semver</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/npm/node-semver/blob/main/LICENSE">
                    https://github.com/npm/node-semver/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>tx-service</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/bnb-chain/safe-transaction-service/blob/master/LICENSE">
                    https://github.com/bnb-chain/safe-transaction-service/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>cfg-service</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/bnb-chain/safe-config-service/blob/main/LICENSE">
                    https://github.com/bnb-chain/safe-config-service/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>gateway</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/bnb-chain/safe-client-gateway/blob/main/LICENSE">
                    https://github.com/bnb-chain/safe-client-gateway/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>web</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/bnb-chain/safe-wallet-web/blob/main/LICENSE">
                    https://github.com/bnb-chain/safe-wallet-web/blob/main/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>eth-py</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/bnb-chain/safe-eth-py/blob/master/LICENSE">
                    https://github.com/bnb-chain/safe-eth-py/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>eth-py</TableCell>
                <TableCell>
                  <ExternalLink href="https://github.com/bnb-chain/safe-eth-py/blob/master/LICENSE">
                    https://github.com/bnb-chain/safe-eth-py/blob/master/LICENSE
                  </ExternalLink>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  )
}

export default SafeLicenses
