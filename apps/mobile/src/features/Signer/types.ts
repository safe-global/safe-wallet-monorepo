import { z } from 'zod'
import { formSchema } from '@/src/features/Signer/schema'

export type FormValues = z.infer<typeof formSchema>
