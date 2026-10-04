import path from 'node:path'
import { fileURLToPath } from 'node:url'

const AUTH_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.auth')

export const OIDC_STORAGE_STATE = path.join(AUTH_DIR, 'step-up-oidc.json')
/** The Workspace the onboarding spec creates, handed to the specs that run after it. */
export const RUN_STATE = path.join(AUTH_DIR, 'step-up-run.json')
