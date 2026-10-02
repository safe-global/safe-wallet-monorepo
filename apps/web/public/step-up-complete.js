// The step-up popup ends here. It tells the Safe{Wallet} tab how the challenge ended, then closes.
// The channel name must match STEP_UP_CHANNEL in src/features/oidc-auth/utils/stepUp.ts.
;(function () {
  var params = new URLSearchParams(window.location.search)
  var channel = new BroadcastChannel('safe-step-up')

  channel.postMessage({ error: params.get('error'), errorDescription: params.get('error_description') })

  // A short delay, so the message leaves before the window and its channel close.
  setTimeout(function () {
    channel.close()
    window.close()
  }, 100)
})()
