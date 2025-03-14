export type Info = {
  device: {
    brand: string
    deviceName: string
    manufacturer: string
    modelId: string
    modelName: string
    osBuildId: string
    osInternalBuildId: string
    osName: string
    osVersion: string
  }
  application: {
    applicationName: string
    applicationId: string
    applicationVersion: string
    applicationBuildNumber: string
    gatewayUrl: string
    fcmToken: string
  }
}
