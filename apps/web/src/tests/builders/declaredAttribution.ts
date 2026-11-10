import { faker } from '@faker-js/faker'
import type { DeclaredAttribution } from '@safe-global/utils/utils/declaredAttribution'
import { Builder, type IBuilder } from '@/tests/Builder'

export const declaredAttributionBuilder = (): IBuilder<DeclaredAttribution> =>
  Builder.new<DeclaredAttribution>().with({
    channel: 'safe-app',
    appName: faker.company.name(),
    appUrl: faker.internet.url({ appendSlash: false }),
    appId: faker.number.int({ min: 1, max: 10_000 }),
  })
