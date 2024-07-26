import SuperChainSetupABI from './abi/SuperChainSetup.json'
import SuperChainModuleABI from './abi/SuperChainModule.json'
import type { Address } from 'viem'

enum ENVIRONMENTS {
  development = 'development',
  production = 'production',
}

const ENV = (process.env.NEXT_PUBLIC_APP_ENV as ENVIRONMENTS) || ENVIRONMENTS.development

const requiredEnvVars = ['NEXT_PUBLIC_JSON_RPC_PROVIDER']
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }
})

const environmentConfig = {
  development: {
    SUPER_CHAIN_SETUP_ADDRESS: '0x3b134026f14A697eEEE4623397E9c9DdC1223577',
    SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS: '0xe847Aa5c25eC18571511C7ADE94a3Aee85668268',
    SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS: '0x0d2c27E87b4BaC88ef023EC543d0512202E89cb2',
    ERC4337_MODULE_ADDRESS: '0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226',
    JSON_RPC_PROVIDER: process.env.NEXT_PUBLIC_JSON_RPC_PROVIDER_TESTNET,
    CHAIN_ID: '11155111',
  },
  production: {
    SUPER_CHAIN_SETUP_ADDRESS: '0xd2B51c08de198651653523ED14A137Df3aE86Ee0',
    SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS: '0xC1c604C563C496973499EE356Bc36f5Bcd9124d0',
    SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS: '0x12F9664553660870d5E359097F2661A35d527afd',
    ERC4337_MODULE_ADDRESS: '0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226',
    JSON_RPC_PROVIDER: process.env.NEXT_PUBLIC_JSON_RPC_PROVIDER,
    CHAIN_ID: '10',
  },
}[ENV]

export const SUPER_CHAIN_SETUP_ABI = SuperChainSetupABI
export const SUPER_CHAIN_MODULE_ABI = SuperChainModuleABI
export const SUPER_CHAIN_SETUP_ADDRESS = environmentConfig.SUPER_CHAIN_SETUP_ADDRESS as Address
export const SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS = environmentConfig.SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS as Address
export const SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS = environmentConfig.SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS as Address
export const ERC4337_MODULE_ADDRESS = environmentConfig.ERC4337_MODULE_ADDRESS as Address
export const JSON_RPC_PROVIDER = environmentConfig.JSON_RPC_PROVIDER
export const CHAIN_ID = environmentConfig.CHAIN_ID
