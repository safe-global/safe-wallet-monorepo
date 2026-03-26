import React, { type ReactNode } from 'react'
import {
  DatadogProvider,
  DatadogProviderConfiguration,
  PropagatorType,
  SdkVerbosity,
  TrackingConsent,
  UploadFrequency,
  BatchSize,
} from 'expo-datadog'

const clientToken = process.env.EXPO_PUBLIC_DD_CLIENT_TOKEN ?? ''
const applicationId = process.env.EXPO_PUBLIC_DD_APPLICATION_ID ?? ''
const ddDebug = process.env.EXPO_PUBLIC_DD_DEBUG === 'true'

const config = new DatadogProviderConfiguration(
  clientToken,
  process.env.EXPO_PUBLIC_DD_ENV ?? 'production',
  TrackingConsent.NOT_GRANTED,
  {
    site: process.env.EXPO_PUBLIC_DD_SITE ?? 'EU1',
    service: 'safe-mobile',
    verbosity: ddDebug ? SdkVerbosity.DEBUG : SdkVerbosity.WARN,
    uploadFrequency: ddDebug ? UploadFrequency.FREQUENT : UploadFrequency.AVERAGE,
    batchSize: ddDebug ? BatchSize.SMALL : BatchSize.MEDIUM,
    rumConfiguration: {
      applicationId,
      trackInteractions: true,
      trackResources: true,
      trackErrors: true,
      sessionSampleRate: ddDebug ? 100 : 80,
      nativeCrashReportEnabled: false,
      resourceTraceSampleRate: 20,
      firstPartyHosts: [
        { match: 'safe-client.safe.global', propagatorTypes: [PropagatorType.DATADOG, PropagatorType.TRACECONTEXT] },
        {
          match: 'safe-client.staging.5afe.dev',
          propagatorTypes: [PropagatorType.DATADOG, PropagatorType.TRACECONTEXT],
        },
      ],
    },
  },
)

interface DatadogWrapperProps {
  children: ReactNode
}

export function DatadogWrapper({ children }: DatadogWrapperProps) {
  if (!clientToken) {
    return <>{children}</>
  }

  return <DatadogProvider configuration={config}>{children}</DatadogProvider>
}
