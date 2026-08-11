import type { Meta, StoryObj } from '@storybook/react'
import { Fragment } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Typography } from '@/components/ui/typography'
import { Chip } from '@/components/ui/chip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StoreDecorator } from '@/stories/storeDecorator'
import ErrorMessage from './index'
import CONTRACT_ERRORS, {
  GS026_MESSAGES,
  getContractErrorMessage,
  type GsCode,
} from '@safe-global/utils/services/exceptions/contractErrors'

/**
 * Living reference for the Safe contract (GS) error messages (WA-3005).
 *
 * - `MessageCatalog` lists every GS code with its user-facing copy and handling.
 * - `RenderedInErrorMessage` shows the copy in the real `ErrorMessage` component.
 *   Each error is fed a realistic raw payload (provider URLs, request bodies,
 *   library versions); a GS error shows an always-visible, code-only reference
 *   with a copy button — never the raw payload. (Non-GS errors keep their raw
 *   Details toggle, unchanged.)
 */

const PARAMS = { nativeAsset: 'ETH', token: 'USDC' }
const CODES = Object.keys(CONTRACT_ERRORS) as GsCode[]

const handlingVariant = (handling: string) =>
  handling === 'inline-validation' ? 'info' : handling === 'internal' ? 'default' : 'warning'

const Catalog = () => (
  <div className="flex flex-col gap-4">
    <Typography variant="h4">All 32 GS codes → user-facing message</Typography>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Handling</TableHead>
          <TableHead>Message</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {CODES.map((code) => (
          <TableRow key={code}>
            <TableCell>
              <strong>{code}</strong>
            </TableCell>
            <TableCell>
              <Chip variant={handlingVariant(CONTRACT_ERRORS[code].handling)}>{CONTRACT_ERRORS[code].handling}</Chip>
            </TableCell>
            <TableCell>{getContractErrorMessage(code, PARAMS)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    <Typography variant="h4">GS026 — three causes (chosen by pre-check in Topic 4)</Typography>
    <Table>
      <TableBody>
        {Object.entries(GS026_MESSAGES).map(([reason, message]) => (
          <TableRow key={reason}>
            <TableCell>
              <strong>{reason}</strong>
            </TableCell>
            <TableCell>{message}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)

/**
 * Representative raw payloads as they arrive from ethers/viem/RPC today. These
 * are the strings currently dumped into the "Details" panel — provider URLs,
 * request bodies, library versions, calldata. Topic 2 replaces them with a
 * support reference (code, tx hash, network, timestamp, copy button).
 */
const RAW_PAYLOADS: Partial<Record<GsCode, string>> = {
  GS201: `execution reverted: GS201 (action="estimateGas", data="0x08c379a0...4753323031", reason="GS201", code=CALL_EXCEPTION, version=6.13.2)`,
  GS010: `Error: cannot estimate gas; transaction may fail or may require manual gas limit (reason="GS010", method="estimateGas", code=UNPREDICTABLE_GAS_LIMIT, version=providers/5.7.2)`,
  GS011: `HTTP request failed.\n\nStatus: 200\nURL: https://rpc.stable.xyz/\nRequest body: {"method":"eth_call","params":[{"to":"0xA063...","data":"0x6a761202..."}]}\n\nreason: GS011\nVersion: viem@2.52.2`,
  GS026: `execution reverted: GS026 (action="estimateGas", data="0x08c379a0...4753303236", reason="GS026", code=CALL_EXCEPTION, version=6.13.2)`,
  GS100: `execution reverted: GS100 (action="estimateGas", data="0x08c379a0...4753313030", reason="GS100", code=CALL_EXCEPTION, version=6.13.2)`,
}

const InErrorMessage = () => {
  const samples: Array<{ code: GsCode; label: string }> = [
    { code: 'GS201', label: 'inline-validation' },
    { code: 'GS010', label: 'runtime' },
    { code: 'GS011', label: 'runtime + interpolation' },
    { code: 'GS026', label: 'reactive fallback' },
    { code: 'GS100', label: 'internal fallback' },
  ]
  return (
    <div className="flex flex-col gap-4">
      <Alert variant="info" outlined>
        <AlertDescription>
          The message you see is the new copy. Each error is fed a realistic raw payload (provider URLs, request bodies,
          library versions), but a GS error shows only an inline <strong>error code</strong> with a copy button — never
          the raw payload. The full support reference is meant to live in the support tool.
        </AlertDescription>
      </Alert>
      {samples.map(({ code, label }) => {
        const message = getContractErrorMessage(code, PARAMS)
        const raw = RAW_PAYLOADS[code]
        return (
          <Fragment key={code}>
            <Typography variant="paragraph-mini" color="muted">
              {code} — {label}
            </Typography>
            <ErrorMessage error={raw ? new Error(raw) : undefined}>{message}</ErrorMessage>
          </Fragment>
        )
      })}
    </div>
  )
}

const meta = {
  title: 'Errors/Contract error messages',
  parameters: { visualTest: { disable: true } },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <Card size="sm">
          <CardContent>
            <Story />
          </CardContent>
        </Card>
      </StoreDecorator>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const MessageCatalog: Story = { render: () => <Catalog /> }
export const RenderedInErrorMessage: Story = { render: () => <InErrorMessage /> }
