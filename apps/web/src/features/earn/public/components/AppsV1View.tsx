import type { ComponentProps, ReactElement } from 'react'
import { AppsV1View as PrototypeAppsView } from '../../defiV1/apps/components/AppsV1View'

const AppsV1View = (props: ComponentProps<typeof PrototypeAppsView>): ReactElement => <PrototypeAppsView {...props} />

export default AppsV1View
