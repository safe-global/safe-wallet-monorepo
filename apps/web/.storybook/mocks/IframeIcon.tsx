import type { ComponentProps, ReactElement } from 'react'
// The `/index` path skips the alias in main.ts, so this renders the real component
import IframeIcon from '@/components/common/IframeIcon/index'
import { localMirrorUrl } from '../mockAssetUrls'

// The sandboxed iframe has an opaque origin, out of MSW's reach; a same-origin path to the mirror loads inside it
const MirroredIframeIcon = (props: ComponentProps<typeof IframeIcon>): ReactElement => (
  <IframeIcon {...props} src={localMirrorUrl(props.src)} />
)

export default MirroredIframeIcon
