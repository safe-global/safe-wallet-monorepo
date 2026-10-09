import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { assertProjectName } from '../local-stack.mjs'

const execute = promisify(execFile)

export async function runInLocalService(env, service, args, input = '') {
  const project = assertProjectName(env.SAFE_E2E_PROJECT)
  if (!['txs-web', 'txs-web-mainnet', 'txs-web-polygon', 'decoder-web', 'cow-api', 'redis'].includes(service)) {
    throw new Error(`Metadata setup does not support the ${service} service`)
  }
  const container = `${project}-${service}-1`
  const { stdout } = await execute(
    'docker',
    [
      'inspect',
      '--format',
      '{{ index .Config.Labels "com.docker.compose.project" }}:{{ index .Config.Labels "com.docker.compose.service" }}',
      container,
    ],
    { timeout: 10000 },
  )
  if (stdout.trim() !== `${project}:${service}`) throw new Error('Container does not match the isolated service')
  await new Promise((resolve, reject) => {
    const child = execFile('docker', ['exec', '-i', container, ...args], { timeout: 30000 }, (error) => {
      if (error) reject(error)
      else resolve()
    })
    child.stdin.on('error', reject)
    child.stdin.end(input)
  })
}
