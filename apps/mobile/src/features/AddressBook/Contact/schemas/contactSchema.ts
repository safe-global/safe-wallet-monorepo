import { z } from 'zod'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'

export const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name is too long')
    .refine((value) => value.trim().length > 0, {
      message: 'Name cannot be empty or only whitespace',
    }),
  address: z
    .string()
    .min(1, 'Address is required')
    .refine(
      (value) => {
        try {
          const { address } = parsePrefixedAddress(value)
          return isValidAddress(address)
        } catch {
          return false
        }
      },
      {
        message: 'Invalid Ethereum address format',
      },
    ),
})

export type ContactFormData = z.infer<typeof contactSchema>
