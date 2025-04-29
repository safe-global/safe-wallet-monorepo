import { faker } from '@faker-js/faker'
import type { NumberModule } from '@faker-js/faker'

export const generateRandomArray = <T>(generator: () => T, options?: Parameters<NumberModule['int']>[0]): Array<T> => {
  return Array.from({ length: faker.number.int(options) }, generator)
}
