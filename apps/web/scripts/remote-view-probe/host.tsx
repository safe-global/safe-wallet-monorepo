import { createRoot } from 'react-dom/client'
import { RemoteView } from '../../src/remote-view/RemoteView'

const log: string[] = []
Object.assign(window, { __log: log })
const report = (name: string, result: string) => log.push(`${name}: ${result}`)

const root = document.getElementById('root')
if (root) createRoot(root).render(<RemoteView name="AttackView" props={{ report }} />)
