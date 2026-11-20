import { faker } from '@faker-js/faker'
import type { DeclaredAttribution } from '@safe-global/utils/utils/declaredAttribution'

export function generateDeclaredAttribution(overrides: Partial<DeclaredAttribution> = {}): DeclaredAttribution {
  return {
    channel: 'WALLET_CONNECT',
    appName: faker.company.name(),
    appUrl: faker.internet.url({ appendSlash: false }),
    ...overrides,
  }
}
