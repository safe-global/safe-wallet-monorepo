import { NotifeeExpoPluginProps } from './types'
import {
  ConfigPlugin,
  withDangerousMod,
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
} from '@expo/config-plugins'
import * as fs from 'fs'
import * as path from 'path'
import {
  APP_VERSION_STRING,
  APP_GROUPS_PLACEHOLDER,
  BACKGROUND_MODES_TO_ENABLE,
  BUNDLE_IDENTIFIER_STRING,
  DEFAULT_APP_VERSION,
  DEFAULT_IOS_BUILD_NUMBER,
  DEFAULT_IOS_DEPLOYMENT_TARGET,
  EXTENSION_SERVICE_FILE,
  EXTENSION_SERVICE_NAME,
  FILES_TO_ADD,
  IOS_BUILD_NUMBER_STRING,
  NOTIFICATION_APP_GROUP_IDENTIFIER_STRING,
  PODFILE_MODIF_NEEDED,
  PODFILE_TARGET_STRING,
  TARGET_DEVICES,
  USER_ACTIVITY_TYPES_KEYS,
} from './config'
import { log, logError, throwError } from './utils'

/**
 * Adds Notifee to the iOS Podfile within an Expo project configuration.
 *
 * @param {object} c - The Expo configuration object.
 * @returns {object} - The updated Expo configuration object after modifying the Podfile.
 */
const addNotifeeToPodfile: ConfigPlugin<NotifeeExpoPluginProps> = (c) => {
  return withDangerousMod(c, [
    'ios',
    async (c) => {
      const pathToPodfile = path.join(c.modRequest.projectRoot, 'ios', 'Podfile')

      try {
        const podfile = fs.readFileSync(pathToPodfile, 'utf8')
        const hasAlreadyNeededChanges = podfile.includes(PODFILE_TARGET_STRING)
        //Add at end of podfile
        if (!hasAlreadyNeededChanges) {
          fs.appendFileSync(pathToPodfile, PODFILE_MODIF_NEEDED)
        }

        log('Added Notifee to Podfile')
      } catch {
        throwError('Error when trying to add Notifee to Podfile')
      }

      return c
    },
  ])
}

/**
 * Adds necessary notification service files to the iOS project for Notifee configuration.
 *
 * @param {object} c - The Expo configuration object.
 * @param {NotifeeExpoPluginProps} props - The properties required for configuring Notifee-Expo-Plugin.
 * @returns {object} - The updated Expo configuration object after adding the notification service files.
 */
const addNotificationServiceFilesToProject: ConfigPlugin<NotifeeExpoPluginProps> = (c, props) => {
  const serviceExtensionFilesFolderPath = path.join(
    require.resolve('@safe-global/notification-service-ios/package.json'),
    '../ios-notification-service-files/',
  )

  const updatedConfig = withDangerousMod(c, [
    'ios',
    async (config) => {
      const p = path.join(config.modRequest.projectRoot, 'ios')

      try {
        //Create folders
        fs.mkdirSync(path.join(p, EXTENSION_SERVICE_NAME), { recursive: true })

        if (!config.version) {
          logError("You need to define 'version' in the expo config!")
        }
        const appVersion = !!config.version ? config.version : DEFAULT_APP_VERSION
        if (!c.ios || !c.ios.bundleIdentifier) {
          logError("You need to define 'bundleIdentifier' in the ios object of the expo config!")
        }
        const bundleIdentifier = 'group.' + config.ios?.bundleIdentifier + '.notifee'
        if (!c.ios || !c.ios.bundleIdentifier) {
          logError("You need to define 'buildNumber' in the ios object of the expo config!")
        }
        const buildNumber = !!config.ios?.buildNumber ? config.ios.buildNumber : DEFAULT_IOS_BUILD_NUMBER
        //Transfer files & Edit necessary values
        for (const fileName of FILES_TO_ADD) {
          const pathToFileToRead = path.join(serviceExtensionFilesFolderPath, fileName)
          const pathWhereToWrite = path.join(p, EXTENSION_SERVICE_NAME, fileName)
          let file = fs.readFileSync(pathToFileToRead, 'utf8')
          if (fileName === EXTENSION_SERVICE_NAME + '-Info.plist') {
            file = file.replace(APP_VERSION_STRING, appVersion)
            file = file.replace(IOS_BUILD_NUMBER_STRING, buildNumber)
          } else if (fileName === EXTENSION_SERVICE_NAME + '.entitlements') {
            // Build the app groups array for entitlements
            const defaultNotifeeGroup = bundleIdentifier
            const mainAppGroup = props.appGroupIdentifier || `group.${config.ios?.bundleIdentifier}`
            const additionalGroups = props.additionalAppGroups || []

            // Combine all app groups (notifee group + main app group + additional groups)
            const allAppGroups = [defaultNotifeeGroup, mainAppGroup, ...additionalGroups]

            // Remove duplicates
            const uniqueAppGroups = Array.from(new Set(allAppGroups))

            // Generate the XML string for app groups
            const appGroupsXml = uniqueAppGroups.map((group) => `\t\t<string>${group}</string>`).join('\n')

            file = file.replace(APP_GROUPS_PLACEHOLDER, appGroupsXml)
          }
          fs.writeFileSync(pathWhereToWrite, file)
        }

        // Copy Utils folder if it exists
        const sourceUtilsPath = path.join(serviceExtensionFilesFolderPath, 'Utils')
        const destUtilsPath = path.join(p, EXTENSION_SERVICE_NAME, 'Utils')

        if (fs.existsSync(sourceUtilsPath)) {
          // Create Utils directory if it doesn't exist
          fs.mkdirSync(destUtilsPath, { recursive: true })

          // Copy all files from Utils directory
          const utilsFiles = fs.readdirSync(sourceUtilsPath)
          for (const utilFile of utilsFiles) {
            const sourcePath = path.join(sourceUtilsPath, utilFile)
            const destPath = path.join(destUtilsPath, utilFile)
            fs.copyFileSync(sourcePath, destPath)
          }
          log('Copied Utils folder successfully!')
        }

        const notificationServicePath = !!props.customNotificationServiceFilePath
          ? props.customNotificationServiceFilePath
          : path.join(serviceExtensionFilesFolderPath, EXTENSION_SERVICE_FILE)
        const pathWhereToWriteNotificationService = path.join(p, EXTENSION_SERVICE_NAME, EXTENSION_SERVICE_FILE)

        // Determine the app group identifier to use
        const appGroupIdentifier = props.appGroupIdentifier || `group.${config.ios?.bundleIdentifier}`

        let notificationServiceFile = fs.readFileSync(notificationServicePath, 'utf8')
        // Replace the app group identifier placeholder
        notificationServiceFile = notificationServiceFile.replaceAll(
          NOTIFICATION_APP_GROUP_IDENTIFIER_STRING,
          appGroupIdentifier,
        )
        fs.writeFileSync(pathWhereToWriteNotificationService, notificationServiceFile)

        log('Added NotificationService files!')
      } catch {
        logError('serviceExtensionFilesFolderPath: ' + serviceExtensionFilesFolderPath)
        logError('Error while copying notification service files')
      }

      return config
    },
  ])
  //Make files added before available in xcode project
  return withXcodeProject(updatedConfig, (nc) => {
    const x = nc.modResults

    // Create the main service extension group
    const mainGroup = x.addPbxGroup(
      [...FILES_TO_ADD, EXTENSION_SERVICE_FILE],
      EXTENSION_SERVICE_NAME,
      EXTENSION_SERVICE_NAME,
    )

    // Create Utils subgroup if files exist
    const sourceUtilsPath = path.join(serviceExtensionFilesFolderPath, 'Utils')
    if (fs.existsSync(sourceUtilsPath)) {
      const utilsFiles = fs.readdirSync(sourceUtilsPath)
      if (utilsFiles.length > 0) {
        // Create a Utils subgroup within the main group
        const utilsGroup = x.addPbxGroup(utilsFiles, 'Utils', 'Utils')
        // Add the Utils group to the main group
        x.addToPbxGroup(utilsGroup.uuid, mainGroup.uuid)

        // Add Utils files to Sources build phase
        const target = x.pbxTargetByName(EXTENSION_SERVICE_NAME)
        if (target) {
          const sourcesBuildPhase = x.buildPhaseObject('PBXSourcesBuildPhase', 'Sources', target.uuid)
          if (sourcesBuildPhase) {
            for (const utilFile of utilsFiles) {
              if (utilFile.endsWith('.swift')) {
                x.addToPbxBuildFileSection(`Utils/${utilFile}`)
                x.addToPbxSourcesBuildPhase(`Utils/${utilFile}`, sourcesBuildPhase)
              }
            }
          }
        }
      }
    }

    // Add the main group to the root group
    const pbxs = x.hash.project.objects['PBXGroup']
    Object.keys(pbxs).forEach(function (v) {
      if (typeof pbxs[v] === 'object' && !pbxs[v].name && !pbxs[v].path) {
        x.addToPbxGroup(mainGroup.uuid, v)
      }
    })

    return nc
  })
}

/**
 * Signs the main iOS app target and the notification service extension target with the specified Apple development team ID.
 *
 * @param {object} c - The current Expo configuration object.
 * @param {NotifeeExpoPluginProps} props - The properties containing the Apple development team ID.
 * @returns {object} - The updated Expo configuration object after signing targets.
 */
const signAppAndNotificationServiceExtension: ConfigPlugin<NotifeeExpoPluginProps> = (c, props) => {
  if (!props.appleDevTeamId) {
    return c
  }

  return withXcodeProject(c, (nc) => {
    const xcodeProject = nc.modResults
    //Sign main target
    const mainTarget = xcodeProject.pbxTargetByName(c.name)
    if (mainTarget) {
      xcodeProject.addTargetAttribute('DevelopmentTeam', props.appleDevTeamId, mainTarget)
    }
    //Sign notification service extension target
    const target = xcodeProject.pbxTargetByName(EXTENSION_SERVICE_NAME)
    if (target) {
      xcodeProject.addTargetAttribute('DevelopmentTeam', props.appleDevTeamId, target)
    }
    log('Signed the main app and notification service extension targets with: ' + props.appleDevTeamId)

    return nc
  })
}

/**
 * Sets the APS Environment Entitlement in the app's entitlements plist file to specify whether to use the development or production Apple Push Notification service (APNs).
 *
 * @param {object} c - The current Expo configuration object.
 * @param {NotifeeExpoPluginProps} props - The properties containing the APS environment mode (production or development).
 * @returns {object} - The updated Expo configuration object after setting the APS environment.
 */
const setAPSEnvironment: ConfigPlugin<NotifeeExpoPluginProps> = (c, props) => {
  return withEntitlementsPlist(c, (nc) => {
    nc.modResults['aps-environment'] = props.apsEnvMode

    log('Set aps-environment to: ' + props.apsEnvMode)
    return nc
  })
}

/**
 * Adds the application group entitlement necessary for Notifee to the iOS project's entitlements plist.
 *
 * @param {object} c - The Expo configuration object.
 * @returns {object} - The updated Expo configuration object with added application group entitlement.
 */
const addNotificationServiceGroup: ConfigPlugin<NotifeeExpoPluginProps> = (c) => {
  return withEntitlementsPlist(c, (nc) => {
    const g = 'com.apple.security.application-groups'
    if (!Array.isArray(nc.modResults[g])) {
      nc.modResults[g] = []
    }
    const gName = `group.${nc.ios?.bundleIdentifier}`
    const modResults = nc.modResults[g]
    if (!modResults.includes(gName)) {
      modResults.push(gName)
    }

    log(`Added '${gName} to com.apple.security.application-groups`)
    return nc
  })
}

/**
 * Adds required background modes to the iOS project's Info.plist for Notifee functionality.
 *
 * @param {object} c - The Expo configuration object.
 * @returns {object} - The updated Expo configuration object with added background modes.
 */
const addBackgroundModes: ConfigPlugin<NotifeeExpoPluginProps> = (c, props) => {
  return withInfoPlist(c, (nc) => {
    //Added this condition so it doesn't add background modes capability without anything selected when the user wants no background modes.
    if (props.backgroundModes && props.backgroundModes.length === 0) {
      return nc
    }
    if (!Array.isArray(nc.modResults.UIBackgroundModes)) {
      nc.modResults.UIBackgroundModes = []
    }
    if (!props.backgroundModes) {
      props.backgroundModes = BACKGROUND_MODES_TO_ENABLE
    }
    for (const mode of props.backgroundModes) {
      if (!nc.modResults.UIBackgroundModes.includes(mode)) {
        nc.modResults.UIBackgroundModes.push(mode)
      }
    }
    log('Added background modes (' + props.backgroundModes.join(', ') + ')')
    return nc
  })
}

/**
 * Enables communication notifications capability for the iOS project if specified in props.
 * This includes setting entitlements and adding necessary keys to Info.plist.
 *
 * @param {object} c - The Expo configuration object.
 * @param {NotifeeExpoPluginProps} props - The properties object containing configuration options.
 * @returns {object} - The updated Expo configuration object with added communication notifications capability.
 */
const addCommunicationNotificationsCapability: ConfigPlugin<NotifeeExpoPluginProps> = (c, props) => {
  if (!props.enableCommunicationNotifications) {
    return c
  }

  const updatedConfig = withEntitlementsPlist(c, (nc) => {
    if (props.enableCommunicationNotifications) {
      nc.modResults['com.apple.developer.usernotifications.communication'] = true
    }
    log('Added communication notifications capability')
    return nc
  })

  return withInfoPlist(updatedConfig, (nc) => {
    if (!Array.isArray(nc.modResults.NSUserActivityTypes)) {
      nc.modResults.NSUserActivityTypes = []
    }
    for (const v of USER_ACTIVITY_TYPES_KEYS) {
      if (!nc.modResults.NSUserActivityTypes.includes(v)) {
        nc.modResults.NSUserActivityTypes.push(v)
      }
    }
    log('Added INSendMessageIntent to NSUserActivityTypes for communication notifications')
    return nc
  })
}

/**
 * Creates and adds a notification service extension target to the Xcode project if it doesn't already exist.
 * Configures necessary settings and build phases for the extension target.
 *
 * @param {object} c - The Expo configuration object.
 * @param {NotifeeExpoPluginProps} props - The properties object containing configuration options.
 * @returns {object} - The updated Expo configuration object with the added notification service extension target.
 */
const createAndAddNotificationServiceExtensionTarget: ConfigPlugin<NotifeeExpoPluginProps> = (c, props) => {
  return withXcodeProject(c, (nc) => {
    const x = nc.modResults
    if (!!x.pbxTargetByName(EXTENSION_SERVICE_NAME)) {
      return nc
    }

    /**
     * Needed or project with one target won't add notification extension service target
     * correctly and it will throw cannot install podfiles
     */
    const po = x.hash.project.objects
    po['PBXContainerItemProxy'] = po['PBXTargetDependency'] ?? {}
    po['PBXTargetDependency'] = po['PBXTargetDependency'] ?? {}

    // Create a new target for the notification service extension
    const newTargetBundleIdentifier = c.ios?.bundleIdentifier + '.' + EXTENSION_SERVICE_NAME
    const nt = x.addTarget(EXTENSION_SERVICE_NAME, 'app_extension', EXTENSION_SERVICE_NAME, newTargetBundleIdentifier)
    // Add necessary files to the new target
    x.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', nt.uuid)
    x.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', nt.uuid)
    x.addBuildPhase(['NotificationService.swift'], 'PBXSourcesBuildPhase', 'Sources', nt.uuid)

    // Set the info of notification service extension target
    const config = x.pbxXCBuildConfigurationSection()
    for (const v in config) {
      if (!!config[v].buildSettings && config[v].buildSettings.PRODUCT_NAME === `"${EXTENSION_SERVICE_NAME}"`) {
        config[v].buildSettings = {
          ...config[v].buildSettings,
          TARGETED_DEVICE_FAMILY: TARGET_DEVICES,
          IPHONEOS_DEPLOYMENT_TARGET: props.iosDeploymentTarget ?? DEFAULT_IOS_DEPLOYMENT_TARGET,
          DEVELOPMENT_TEAM: props.appleDevTeamId,
          CODE_SIGN_ENTITLEMENTS: `${EXTENSION_SERVICE_NAME}/${EXTENSION_SERVICE_NAME}.entitlements`,
          CODE_SIGN_STYLE: 'Automatic',
          SWIFT_VERSION: '5.0',
        }
      } else if (!!config[v].buildSettings && config[v].buildSettings.PRODUCT_NAME === `"${c.name}"`) {
        config[v].buildSettings = {
          ...config[v].buildSettings,
          DEVELOPMENT_TEAM: props.appleDevTeamId,
        }
      }
    }

    log(`Created Notification Service Extension (${newTargetBundleIdentifier})`)
    return nc
  })
}

/**
 * Adds the Notifee target to the Expo app extensions configuration for EAS builds.
 * Configures the target name, bundle identifier, and entitlements for the Notifee extension.
 *
 * @param {object} c - The Expo configuration object.
 * @returns {object} - The updated Expo configuration object with Notifee target added to app extensions.
 */
const addNotifeeTargetToExpoAppExtensions: ConfigPlugin<NotifeeExpoPluginProps> = (c) => {
  const bundleIdentifier = c.ios?.bundleIdentifier + '.' + EXTENSION_SERVICE_NAME

  const expoAppExtension = {
    targetName: EXTENSION_SERVICE_NAME,
    bundleIdentifier,
    entitlements: {
      'com.apple.security.application-groups': [
        `group.${c.ios?.bundleIdentifier}.notifee`,
        `group.${c.ios?.bundleIdentifier}`,
      ],
    },
  }

  return {
    ...c,
    extra: {
      ...c.extra,
      eas: {
        ...c.extra?.eas,
        build: {
          ...c.extra?.eas?.build,
          experimental: {
            ...c.extra?.eas?.build?.experimental,
            ios: {
              ...c.extra?.eas?.build?.experimental?.ios,
              appExtensions: [...(c.extra?.eas?.build?.experimental?.ios?.appExtensions ?? []), expoAppExtension],
            },
          },
        },
      },
    },
  }
}

export default {
  setAPSEnvironment,
  addCommunicationNotificationsCapability,
  addBackgroundModes,
  addNotificationServiceFilesToProject,
  addNotifeeToPodfile,
  signAppAndNotificationServiceExtension,
  createAndAddNotificationServiceExtensionTarget,
  addNotifeeTargetToExpoAppExtensions,
  addNotificationServiceGroup,
}
