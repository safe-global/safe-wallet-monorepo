import { z } from 'zod'
import { formSchema } from '@/src/features/ImportReadOnly/schema'
import { useLazySafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'

type LazyQueryResult = ReturnType<typeof useLazySafesGetOverviewForManyQuery>[1]

export type FormValues = z.infer<typeof formSchema> & {
  importedSafeResult?: {
    data: LazyQueryResult['data']
    isFetching: LazyQueryResult['isFetching']
    error: LazyQueryResult['error']
  }
}
