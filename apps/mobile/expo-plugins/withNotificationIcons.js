const { withAndroidManifest } = require('@expo/config-plugins')

function addNotificationIconMetadata(androidManifest) {
  const application = androidManifest.manifest.application[0]

  // Check if metadata already exists
  if (!application['meta-data']) {
    application['meta-data'] = []
  }

  // Add small icon metadata
  const smallIconMetadata = application['meta-data'].find(
    (metadata) => metadata.$['android:name'] === 'com.google.firebase.messaging.default_ic_notification',
  )

  if (!smallIconMetadata) {
    application['meta-data'].push({
      $: {
        'android:name': 'com.google.firebase.messaging.default_ic_notification',
        'android:resource': '@drawable/ic_notification',
      },
    })
  }

  return androidManifest
}

module.exports = function withNotificationIcons(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addNotificationIconMetadata(config.modResults)
    return config
  })
}
