import { useState, type ReactElement, type ReactNode } from 'react'
import classnames from 'classnames'
import { Code } from 'lucide-react'
import { OperationType, type MetaTransactionData } from '@safe-global/types-kit'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@safe-global/views/components/ui/accordion'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import {
  FALLBACK_TARGET_NAME,
  getRuleTitle,
  POLICY_GUARD_NAME,
  POLICY_LABELS,
  RULE_DELEGATE_CALL_LABEL,
  RULE_POLICY_LABEL,
  RULE_RECIPIENTS_LABEL,
  RULE_TARGET_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import MethodCall from '@/components/transactions/TxDetails/TxData/DecodedData/MethodCall'
import { MultisendActionsHeader } from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'
import singleTxCss from '@/components/transactions/TxDetails/TxData/DecodedData/SingleTxDecoded/styles.module.css'
import type { PolicyConfiguration, SetupCallDescription } from '@/features/policy-guard'
import { isFallbackAccess } from '@/features/policy-guard/services'
import type { AllowlistAddressInfo } from '../hooks/useAllowlistAddressInfo'
import { getRuleKind, type RuleKind } from './ruleKind'

type AllowlistSetupActionsProps = {
  chainId: string
  calls: MetaTransactionData[]
  configurations: PolicyConfiguration[]
  describeCall: (call: MetaTransactionData) => SetupCallDescription | undefined
  decodeRecipients: (data: string) => string[]
  getAddressInfo: (address: string) => AllowlistAddressInfo
}

const CONFIGURING_METHODS = ['configureImmediately', 'requestConfiguration', 'applyConfiguration']

const RuleAddress = ({ address, info }: { address: string; info: AllowlistAddressInfo }): ReactElement | null =>
  generateDataRowValue(address, 'address', true, { value: address, name: info.name, logoUri: info.logoUri })

const ActionRow = ({
  index,
  label,
  method,
  expanded,
  onExpandedChange,
  children,
}: {
  index: number
  label?: string
  method: string
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  children: ReactNode
}): ReactElement => (
  <Accordion
    data-testid="action-accordion"
    value={expanded ? ['action'] : []}
    onValueChange={(value: string[]) => onExpandedChange(value.includes('action'))}
  >
    <AccordionItem value="action" className="border-0">
      <AccordionTrigger
        data-testid="action-item"
        nativeButton={false}
        render={<div />}
        className={classnames(
          'flex min-h-12 items-center px-4 py-3',
          singleTxCss.groupedTrigger,
          expanded && singleTxCss.groupedTriggerOpen,
        )}
      >
        <div className={singleTxCss.summary}>
          <Code className="size-4 shrink-0 text-muted-foreground" />
          <span className={singleTxCss.summaryIndex}>{index + 1}</span>
          <Typography className={singleTxCss.summaryLabel}>
            {label ? `${label}: ` : ''}
            <b>{method}</b>
          </Typography>
        </div>
      </AccordionTrigger>

      <AccordionContent className="border-t border-border bg-card p-4">
        <div className="flex flex-col gap-2">{children}</div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)

const PolicyRuleRows = ({
  configuration,
  index,
  count,
  kind,
  decodeRecipients,
  getAddressInfo,
}: {
  configuration: PolicyConfiguration
  index: number
  count: number
  kind: RuleKind
  decodeRecipients: (data: string) => string[]
  getAddressInfo: (address: string) => AllowlistAddressInfo
}): ReactElement => (
  <div className="flex flex-col gap-1.5" data-testid="allowlist-rule">
    <Typography variant="paragraph-small-bold" as="div">
      {getRuleTitle(index, count)}
    </Typography>

    <TxDataRow title={RULE_POLICY_LABEL}>
      <Typography variant="paragraph-small" as="div" className="flex flex-wrap items-center gap-2">
        {POLICY_LABELS[kind]}
        <span className="text-muted-foreground">{shortenAddress(configuration.policy)}</span>
      </Typography>
    </TxDataRow>

    <TxDataRow title={RULE_TARGET_LABEL}>
      <div className="flex flex-col gap-0.5">
        <RuleAddress
          address={configuration.target}
          info={isFallbackAccess(configuration) ? { name: FALLBACK_TARGET_NAME } : getAddressInfo(configuration.target)}
        />
        {/* Indented past the 20px identicon and its gap, to the address text. */}
        <Typography variant="paragraph-small" color="muted" as="div" className="pl-7">
          <HexEncodedData hexData={configuration.selector} highlightFirstBytes={false} />
          {configuration.operation === OperationType.DelegateCall && ` · ${RULE_DELEGATE_CALL_LABEL}`}
        </Typography>
      </div>
    </TxDataRow>

    {kind === 'erc20' && (
      <TxDataRow title={RULE_RECIPIENTS_LABEL}>
        <div className="flex flex-col gap-1">
          {decodeRecipients(configuration.data).map((address) => (
            <RuleAddress key={address} address={address} info={getAddressInfo(address)} />
          ))}
        </div>
      </TxDataRow>
    )}
  </div>
)

/** The app's Multisend rebuilt so the configuring call lists "Rule N of M", which the generic decoder can't. */
const AllowlistSetupActions = ({
  chainId,
  calls,
  configurations,
  describeCall,
  decodeRecipients,
  getAddressInfo,
}: AllowlistSetupActionsProps): ReactElement => {
  const [openMap, setOpenMap] = useState<Record<number, boolean>>()

  return (
    <div data-testid="allowlist-setup-actions">
      <MultisendActionsHeader setOpen={setOpenMap} amount={calls.length} compact />

      <Card variant="muted" size="none">
        <CardContent>
          <div className="p-2">
            <div className="flex flex-col divide-y divide-border overflow-hidden rounded-sm">
              {calls.map((call, index) => {
                const description = describeCall(call)
                const method = description?.method ?? call.data.slice(0, 10)
                const isGuardCall = description?.target === 'guard'
                const contractName = isGuardCall ? POLICY_GUARD_NAME : getAddressInfo(call.to).name

                return (
                  <ActionRow
                    key={`${index}-${method}`}
                    index={index}
                    label={isGuardCall ? POLICY_GUARD_NAME : undefined}
                    method={method}
                    expanded={openMap?.[index] ?? false}
                    onExpandedChange={(expanded) => setOpenMap((prev) => ({ ...prev, [index]: expanded }))}
                  >
                    <div className="flex flex-col gap-4">
                      <MethodCall contractAddress={call.to} contractName={contractName} method={method} />

                      {CONFIGURING_METHODS.includes(method) &&
                        configurations.map((configuration, ruleIndex) => (
                          <PolicyRuleRows
                            key={`${configuration.target}-${configuration.selector}-${configuration.operation}`}
                            configuration={configuration}
                            index={ruleIndex}
                            count={configurations.length}
                            kind={getRuleKind(chainId, configuration)}
                            decodeRecipients={decodeRecipients}
                            getAddressInfo={getAddressInfo}
                          />
                        ))}

                      {description?.param && (
                        <TxDataRow title={description.param.name}>
                          <RuleAddress address={description.param.value} info={{ name: POLICY_GUARD_NAME }} />
                        </TxDataRow>
                      )}
                    </div>
                  </ActionRow>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AllowlistSetupActions
