// Mock for environment utilities in tests
export const isProdEnv = (): boolean => false
export const getGatewayUrl = (): string | undefined => undefined
export const getTenderlyConfig = () => ({
  simulateEndpointUrl: 'https://simulation.test/simulate',
  projectName: 'project',
  orgName: 'org',
})
