import { z } from 'zod'

export const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name must be at least 1 characters long' })
    .max(20, { message: 'Name must be at most 20 characters long' }),
})
