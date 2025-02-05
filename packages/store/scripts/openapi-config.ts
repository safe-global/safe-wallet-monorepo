import type { ConfigFile } from '@rtk-query/codegen-openapi'

const config: ConfigFile = {
  schemaFile: './api-schema/schema.json',
  prettierConfigFile: '../../../.prettierrc',
  apiFile: '../src/gateway/cgwClient.ts',
  apiImport: 'cgwClient',
  exportName: 'cgwApi',
  hooks: { queries: true, lazyQueries: true, mutations: true },
  filterEndpoints: [/^(?!.*delegates).*/],
  tag: true,
  outputFiles: {
    '../src/gateway/AUTO_GENERATED/about.ts': {
      filterEndpoints: [/^about/],
    },
    '../src/gateway/AUTO_GENERATED/accounts.ts': {
      filterEndpoints: [/^accounts/],
    },
    '../src/gateway/AUTO_GENERATED/auth.ts': {
      filterEndpoints: [/^auth/],
    },
    '../src/gateway/AUTO_GENERATED/balances.ts': {
      filterEndpoints: [/^balances/],
    },
    '../src/gateway/AUTO_GENERATED/chains.ts': {
      filterEndpoints: [/^chains/],
    },
    '../src/gateway/AUTO_GENERATED/collectibles.ts': {
      filterEndpoints: [/^collectibles/],
    },
    '../src/gateway/AUTO_GENERATED/community.ts': {
      filterEndpoints: [/^community/],
    },
    '../src/gateway/AUTO_GENERATED/contracts.ts': {
      filterEndpoints: [/^contracts/],
    },
    '../src/gateway/AUTO_GENERATED/data-decoded.ts': {
      filterEndpoints: [/^dataDecoded/],
    },
    '../src/gateway/AUTO_GENERATED/delegates.ts': {
      filterEndpoints: [/^delegates(?!DeleteSafeDelegateV1)/],
    },
    '../src/gateway/AUTO_GENERATED/estimations.ts': {
      filterEndpoints: [/^estimations/],
    },
    '../src/gateway/AUTO_GENERATED/messages.ts': {
      filterEndpoints: [/^messages/],
    },
    '../src/gateway/AUTO_GENERATED/notifications.ts': {
      filterEndpoints: [/^notifications/],
    },
    '../src/gateway/AUTO_GENERATED/owners.ts': {
      filterEndpoints: [/^owners/],
    },
    '../src/gateway/AUTO_GENERATED/relay.ts': {
      filterEndpoints: [/^relay/],
    },
    '../src/gateway/AUTO_GENERATED/safe-apps.ts': {
      filterEndpoints: [/^safeApps/],
    },
    '../src/gateway/AUTO_GENERATED/safes.ts': {
      filterEndpoints: [/^safes/],
    },
    '../src/gateway/AUTO_GENERATED/targeted-messages.ts': {
      filterEndpoints: [/^targetedMessaging/],
    },
    '../src/gateway/AUTO_GENERATED/transactions.ts': {
      filterEndpoints: [/^transactions/],
    },
  },
}

export default config
