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
