import { isValidAddress } from '@safe-global/utils/utils/validation'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { z } from 'zod'

export const formSchema = z.object({
  name: z.string().nonempty('Name is required').max(30, 'Name is too long'),
  safeAddress: z
    .string()
    .nonempty('Safe address is required')
    .refine(
      (value) => {
        return isValidAddress(parsePrefixedAddress(value).address)
      },
      {
        message: 'Invalid address format',
      },
    ),
})
