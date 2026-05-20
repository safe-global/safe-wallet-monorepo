# Mobile Permissions

Use these examples when changing camera, notifications, or any flow that can
request OS permissions or open system Settings.

## explicit-settings-navigation

Use this when denied or restricted permission state offers a Settings escape
hatch.

Prefer:

```tsx
const wrapperPress =
  permission === 'granted' && !isCameraActive ? activateCamera : undefined

<Pressable onPress={wrapperPress} disabled={!wrapperPress}>
  {permission === 'denied' ? (
    <SafeButton onPress={openSettings}>Open Settings</SafeButton>
  ) : null}
</Pressable>
```

Avoid:

```tsx
const button = getButtonConfig(permission)

<Pressable onPress={button ? button.onPress : undefined}>
  <SafeButton onPress={button?.onPress}>{button?.label}</SafeButton>
</Pressable>
```

Why:

In denied/restricted states, the wrapper is an invisible tap target. Opening
Settings must come from the labeled button, not a tap anywhere in the frame.

## permission-denial-branches

Use this when a permission request is followed by registration work.

Prefer:

```ts
const permission = await requestPermission()

if (permission.status === 'denied') {
  showSettingsExplainer()
  return
}

const registered = await registerForNotifications()
if (!registered.ok) {
  showRegistrationError()
}
```

Avoid:

```ts
try {
  await requestAndRegister()
} catch {
  showSettingsExplainer()
}
```

Why:

Registration/network failures are not permission denials. Showing a Settings
explainer for every failure sends users to the wrong recovery path.

## Name the warning condition; do not chain `!==`

Source: PR #7402, #7391 (RL-20260312-008)

### Avoid

```ts
{!isSelected &&
  hasAddress &&
  validationState !== 'unknown' &&
  validationState !== 'invalid' &&
  validationState !== 'known-other-chain' &&
  validationState !== 'self-send' && (
  <RecipientWarning state={validationState} />
)}
```

### Prefer

```ts
const NON_WARNABLE_STATES = ['unknown', 'invalid', 'known-other-chain', 'self-send'] as const
const showWarning =
  !isSelected && hasAddress && !NON_WARNABLE_STATES.includes(validationState)

{showWarning && <RecipientWarning state={validationState} />}
```

### Why

Reviewers asked to extract this for readability and to centralize the disallowed list — every new validation state was forcing edits at every call site.

## Don't fake configurability you can't ship without a release

Source: PR #7385 (RL-20260311-012)

### Avoid

```ts
const config = new DatadogProviderConfiguration(
  clientToken,
  process.env.EXPO_PUBLIC_DD_ENV ?? 'production',
  TrackingConsent.NOT_GRANTED,
)
config.verbosity = process.env.EXPO_PUBLIC_DD_VERBOSITY === 'DEBUG' ? SdkVerbosity.DEBUG : SdkVerbosity.WARN
config.uploadFrequency =
  process.env.EXPO_PUBLIC_DD_UPLOAD_FREQ === 'FREQUENT' ? UploadFrequency.FREQUENT : UploadFrequency.AVERAGE
```

### Prefer

```ts
const ddDebug = __DEV__
const config = new DatadogProviderConfiguration(
  clientToken,
  process.env.EXPO_PUBLIC_DD_ENV ?? 'production',
  TrackingConsent.NOT_GRANTED,
)
config.verbosity = ddDebug ? SdkVerbosity.DEBUG : SdkVerbosity.WARN
config.uploadFrequency = ddDebug ? UploadFrequency.FREQUENT : UploadFrequency.AVERAGE
config.batchSize = ddDebug ? BatchSize.SMALL : BatchSize.MEDIUM
```

### Why

Author's response: 'Doesn't matter as I can't manipulate them in production. We always have to create a new release.' Hardcoded branches are honest about the rotation model.

## Clear telemetry context when the entity becomes null

Source: PR #7385 (RL-20260311-013)

### Avoid

```ts
useEffect(() => {
  if (consented && activeSafe?.address && activeSafe?.chainId) {
    DdSdkReactNative.addUserExtraInfo({
      safeAddress: activeSafe.address,
      chainId: activeSafe.chainId,
    })
  }
}, [consented, activeSafe?.address, activeSafe?.chainId])
```

### Prefer

```ts
useEffect(() => {
  if (!consented) return
  if (activeSafe?.address && activeSafe?.chainId) {
    DdSdkReactNative.addUserExtraInfo({
      safeAddress: activeSafe.address,
      chainId: activeSafe.chainId,
    })
  } else {
    DdSdkReactNative.addUserExtraInfo({ safeAddress: null, chainId: null })
  }
}, [consented, activeSafe?.address, activeSafe?.chainId])
```

### Why

Without the reset, RUM events after the user wipes their last Safe still carry the previous safeAddress/chainId, which silently corrupts attribution dashboards.
