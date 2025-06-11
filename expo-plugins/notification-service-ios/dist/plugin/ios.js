'use strict'
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        var desc = Object.getOwnPropertyDescriptor(m, k)
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k]
            },
          }
        }
        Object.defineProperty(o, k2, desc)
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        o[k2] = m[k]
      })
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v })
      }
    : function (o, v) {
        o['default'] = v
      })
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod
    var result = {}
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k)
    __setModuleDefault(result, mod)
    return result
  }
Object.defineProperty(exports, '__esModule', { value: true })
const config_plugins_1 = require('@expo/config-plugins')
const fs = __importStar(require('fs'))
const path = __importStar(require('path'))
const config_1 = require('./config')
const utils_1 = require('./utils')
/**
 * Adds Notifee to the iOS Podfile within an Expo project configuration.
 *
 * @param {object} c - The Expo configuration object.
 * @returns {object} - The updated Expo configuration object after modifying the Podfile.
 */
const addNotifeeToPodfile = (c) => {
  return (0, config_plugins_1.withDangerousMod)(c, [
    'ios',
    async (c) => {
      const pathToPodfile = path.join(c.modRequest.projectRoot, 'ios', 'Podfile')
      try {
        const podfile = fs.readFileSync(pathToPodfile, 'utf8')
        const hasAlreadyNeededChanges = podfile.includes(config_1.PODFILE_TARGET_STRING)
        //Add at end of podfile
        if (!hasAlreadyNeededChanges) {
          fs.appendFileSync(pathToPodfile, config_1.PODFILE_MODIF_NEEDED)
        }
        ;(0, utils_1.log)('Added Notifee to Podfile')
      } catch {
        ;(0, utils_1.throwError)('Error when trying to add Notifee to Podfile')
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
const addNotificationServiceFilesToProject = (c, props) => {
  const serviceExtensionFilesFolderPath = path.join(
    require.resolve('@safe-global/notification-service-ios/package.json'),
    '../ios-notification-service-files/',
  )
  const updatedConfig = (0, config_plugins_1.withDangerousMod)(c, [
    'ios',
    async (config) => {
      const p = path.join(config.modRequest.projectRoot, 'ios')
      try {
        //Create folders
        fs.mkdirSync(path.join(p, config_1.EXTENSION_SERVICE_NAME), { recursive: true })
        if (!config.version) {
          ;(0, utils_1.logError)("You need to define 'version' in the expo config!")
        }
        const appVersion = !!config.version ? config.version : config_1.DEFAULT_APP_VERSION
        if (!c.ios || !c.ios.bundleIdentifier) {
          ;(0, utils_1.logError)("You need to define 'bundleIdentifier' in the ios object of the expo config!")
        }
        const bundleIdentifier = 'group.' + config.ios?.bundleIdentifier + '.notifee'
        if (!c.ios || !c.ios.bundleIdentifier) {
          ;(0, utils_1.logError)("You need to define 'buildNumber' in the ios object of the expo config!")
        }
        const buildNumber = !!config.ios?.buildNumber ? config.ios.buildNumber : config_1.DEFAULT_IOS_BUILD_NUMBER
        //Transfer files & Edit necessary values
        for (const fileName of config_1.FILES_TO_ADD) {
          const pathToFileToRead = path.join(serviceExtensionFilesFolderPath, fileName)
          const pathWhereToWrite = path.join(p, config_1.EXTENSION_SERVICE_NAME, fileName)
          let file = fs.readFileSync(pathToFileToRead, 'utf8')
          if (fileName === config_1.EXTENSION_SERVICE_NAME + '-Info.plist') {
            file = file.replace(config_1.APP_VERSION_STRING, appVersion)
            file = file.replace(config_1.IOS_BUILD_NUMBER_STRING, buildNumber)
          } else if (fileName === config_1.EXTENSION_SERVICE_NAME + '.entitlements') {
            file = file.replace(config_1.BUNDLE_IDENTIFIER_STRING, bundleIdentifier)
          }
          fs.writeFileSync(pathWhereToWrite, file)
        }
        // Copy Utils folder if it exists
        const sourceUtilsPath = path.join(serviceExtensionFilesFolderPath, 'Utils')
        const destUtilsPath = path.join(p, config_1.EXTENSION_SERVICE_NAME, 'Utils')
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
          ;(0, utils_1.log)('Copied Utils folder successfully!')
        }
        const notificationServicePath = !!props.customNotificationServiceFilePath
          ? props.customNotificationServiceFilePath
          : path.join(serviceExtensionFilesFolderPath, config_1.EXTENSION_SERVICE_FILE)
        const pathWhereToWriteNotificationService = path.join(
          p,
          config_1.EXTENSION_SERVICE_NAME,
          config_1.EXTENSION_SERVICE_FILE,
        )
        const notificationServiceFile = fs.readFileSync(notificationServicePath)
        fs.writeFileSync(pathWhereToWriteNotificationService, notificationServiceFile)
        ;(0, utils_1.log)('Added NotificationService files!')
      } catch {
        ;(0, utils_1.logError)('serviceExtensionFilesFolderPath: ' + serviceExtensionFilesFolderPath)
        ;(0, utils_1.logError)('Error while copying notification service files')
      }
      return config
    },
  ])
  //Make files added before available in xcode project
  return (0, config_plugins_1.withXcodeProject)(updatedConfig, (nc) => {
    const x = nc.modResults
    // Create the main service extension group
    const mainGroup = x.addPbxGroup(
      [...config_1.FILES_TO_ADD, config_1.EXTENSION_SERVICE_FILE],
      config_1.EXTENSION_SERVICE_NAME,
      config_1.EXTENSION_SERVICE_NAME,
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
        const target = x.pbxTargetByName(config_1.EXTENSION_SERVICE_NAME)
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
const signAppAndNotificationServiceExtension = (c, props) => {
  if (!props.appleDevTeamId) {
    return c
  }
  return (0, config_plugins_1.withXcodeProject)(c, (nc) => {
    const xcodeProject = nc.modResults
    //Sign main target
    const mainTarget = xcodeProject.pbxTargetByName(c.name)
    if (mainTarget) {
      xcodeProject.addTargetAttribute('DevelopmentTeam', props.appleDevTeamId, mainTarget)
    }
    //Sign notification service extension target
    const target = xcodeProject.pbxTargetByName(config_1.EXTENSION_SERVICE_NAME)
    if (target) {
      xcodeProject.addTargetAttribute('DevelopmentTeam', props.appleDevTeamId, target)
    }
    ;(0, utils_1.log)('Signed the main app and notification service extension targets with: ' + props.appleDevTeamId)
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
const setAPSEnvironment = (c, props) => {
  return (0, config_plugins_1.withEntitlementsPlist)(c, (nc) => {
    nc.modResults['aps-environment'] = props.apsEnvMode
    ;(0, utils_1.log)('Set aps-environment to: ' + props.apsEnvMode)
    return nc
  })
}
/**
 * Adds the application group entitlement necessary for Notifee to the iOS project's entitlements plist.
 *
 * @param {object} c - The Expo configuration object.
 * @returns {object} - The updated Expo configuration object with added application group entitlement.
 */
const addNotificationServiceGroup = (c) => {
  return (0, config_plugins_1.withEntitlementsPlist)(c, (nc) => {
    const g = 'com.apple.security.application-groups'
    if (!Array.isArray(nc.modResults[g])) {
      nc.modResults[g] = []
    }
    const gName = `group.${nc.ios?.bundleIdentifier}`
    const modResults = nc.modResults[g]
    if (!modResults.includes(gName)) {
      modResults.push(gName)
    }
    ;(0, utils_1.log)(`Added '${gName} to com.apple.security.application-groups`)
    return nc
  })
}
/**
 * Adds required background modes to the iOS project's Info.plist for Notifee functionality.
 *
 * @param {object} c - The Expo configuration object.
 * @returns {object} - The updated Expo configuration object with added background modes.
 */
const addBackgroundModes = (c, props) => {
  return (0, config_plugins_1.withInfoPlist)(c, (nc) => {
    //Added this condition so it doesn't add background modes capability without anything selected when the user wants no background modes.
    if (props.backgroundModes && props.backgroundModes.length === 0) {
      return nc
    }
    if (!Array.isArray(nc.modResults.UIBackgroundModes)) {
      nc.modResults.UIBackgroundModes = []
    }
    if (!props.backgroundModes) {
      props.backgroundModes = config_1.BACKGROUND_MODES_TO_ENABLE
    }
    for (const mode of props.backgroundModes) {
      if (!nc.modResults.UIBackgroundModes.includes(mode)) {
        nc.modResults.UIBackgroundModes.push(mode)
      }
    }
    ;(0, utils_1.log)('Added background modes (' + props.backgroundModes.join(', ') + ')')
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
const addCommunicationNotificationsCapability = (c, props) => {
  if (!props.enableCommunicationNotifications) {
    return c
  }
  const updatedConfig = (0, config_plugins_1.withEntitlementsPlist)(c, (nc) => {
    if (props.enableCommunicationNotifications) {
      nc.modResults['com.apple.developer.usernotifications.communication'] = true
    }
    ;(0, utils_1.log)('Added communication notifications capability')
    return nc
  })
  return (0, config_plugins_1.withInfoPlist)(updatedConfig, (nc) => {
    if (!Array.isArray(nc.modResults.NSUserActivityTypes)) {
      nc.modResults.NSUserActivityTypes = []
    }
    for (const v of config_1.USER_ACTIVITY_TYPES_KEYS) {
      if (!nc.modResults.NSUserActivityTypes.includes(v)) {
        nc.modResults.NSUserActivityTypes.push(v)
      }
    }
    ;(0, utils_1.log)('Added INSendMessageIntent to NSUserActivityTypes for communication notifications')
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
const createAndAddNotificationServiceExtensionTarget = (c, props) => {
  return (0, config_plugins_1.withXcodeProject)(c, (nc) => {
    const x = nc.modResults
    if (!!x.pbxTargetByName(config_1.EXTENSION_SERVICE_NAME)) {
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
    const newTargetBundleIdentifier = c.ios?.bundleIdentifier + '.' + config_1.EXTENSION_SERVICE_NAME
    const nt = x.addTarget(
      config_1.EXTENSION_SERVICE_NAME,
      'app_extension',
      config_1.EXTENSION_SERVICE_NAME,
      newTargetBundleIdentifier,
    )
    // Add necessary files to the new target
    x.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', nt.uuid)
    x.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', nt.uuid)
    x.addBuildPhase(['NotificationService.swift'], 'PBXSourcesBuildPhase', 'Sources', nt.uuid)
    // Set the info of notification service extension target
    const config = x.pbxXCBuildConfigurationSection()
    for (const v in config) {
      if (
        !!config[v].buildSettings &&
        config[v].buildSettings.PRODUCT_NAME === `"${config_1.EXTENSION_SERVICE_NAME}"`
      ) {
        config[v].buildSettings = {
          ...config[v].buildSettings,
          TARGETED_DEVICE_FAMILY: config_1.TARGET_DEVICES,
          IPHONEOS_DEPLOYMENT_TARGET: props.iosDeploymentTarget ?? config_1.DEFAULT_IOS_DEPLOYMENT_TARGET,
          DEVELOPMENT_TEAM: props.appleDevTeamId,
          CODE_SIGN_ENTITLEMENTS: `${config_1.EXTENSION_SERVICE_NAME}/${config_1.EXTENSION_SERVICE_NAME}.entitlements`,
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
    ;(0, utils_1.log)(`Created Notification Service Extension (${newTargetBundleIdentifier})`)
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
const addNotifeeTargetToExpoAppExtensions = (c) => {
  const bundleIdentifier = c.ios?.bundleIdentifier + '.' + config_1.EXTENSION_SERVICE_NAME
  const expoAppExtension = {
    targetName: config_1.EXTENSION_SERVICE_NAME,
    bundleIdentifier,
    entitlements: {
      'com.apple.security.application-groups': [`group.${c.ios?.bundleIdentifier}.notifee`],
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
exports.default = {
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
