import type { ReactElement } from 'react'

import useChains from '@/hooks/useChains'
import { ImportErrors } from '@/components/settings/DataManagement/useGlobalImportFileParser'
import {
  FileListCardView,
  type FileListCardHeaderProps,
  type FileListProps,
} from '@views/components/settings/DataManagement/FileListCardView'

type Props = FileListProps & FileListCardHeaderProps & { className?: string }

export const FileListCard = (props: Props): ReactElement => {
  const chains = useChains()

  return <FileListCardView {...props} chains={chains.configs} noDataMessage={ImportErrors.NO_IMPORT_DATA_FOUND} />
}
