import { z } from 'zod'
import { formSchema } from '@/src/features/ImportReadOnly/schema'

export type FormValues = z.infer<typeof formSchema>
