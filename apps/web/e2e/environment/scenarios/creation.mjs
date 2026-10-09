import { prepareBasicScenario } from './basic.mjs'
import { setEnsName } from './ens.mjs'

export async function prepareCreateSafeOwnersScenario(env, owners) {
  await setEnsName(env, 'testenssepolia.eth', owners.owner4.address)
  return prepareBasicScenario(env, owners)
}
