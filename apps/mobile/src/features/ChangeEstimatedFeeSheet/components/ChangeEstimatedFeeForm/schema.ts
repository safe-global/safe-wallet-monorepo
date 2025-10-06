import { z } from 'zod'

const decimalNumberSchema = z
  .string()
  .min(1, 'This field is required')
  .refine(
    (value) => {
      // Allow numbers with optional decimal point
      const regex = /^\d+\.?\d*$/
      return regex.test(value)
    },
    {
      message: 'Must be a valid number',
    },
  )
  .refine(
    (value) => {
      const num = parseFloat(value)
      return !isNaN(num) && num > 0
    },
    {
      message: 'Must be greater than 0',
    },
  )

const integerSchema = z
  .string()
  .min(1, 'This field is required')
  .refine(
    (value) => {
      // Allow only integers (no decimal point)
      const regex = /^\d+$/
      return regex.test(value)
    },
    {
      message: 'Must be a valid integer',
    },
  )
  .refine(
    (value) => {
      const num = parseInt(value, 10)
      return !isNaN(num) && num >= 0
    },
    {
      message: 'Must be greater than or equal to 0',
    },
  )

const gasLimitSchema = integerSchema.refine(
  (value) => {
    const num = parseInt(value, 10)

    return !isNaN(num) && num >= 21000
  },
  {
    message: 'Must be at least 21000',
  },
)

export const estimatedFeeFormSchema = z.object({
  maxFeePerGas: decimalNumberSchema,
  maxPriorityFeePerGas: decimalNumberSchema,
  gasLimit: gasLimitSchema,
  nonce: integerSchema,
})

export type EstimatedFeeFormData = z.infer<typeof estimatedFeeFormSchema>
