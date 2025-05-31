"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const ios_1 = __importDefault(require("./ios"));
/**
 * Configures Notifee settings for both Android and iOS platforms in an Expo project.
 *
 * @param {object} c - The Expo configuration object.
 * @param {NotifeeExpoPluginProps} props - The properties required for configuring Notifee-Expo-Plugin.
 *
 * @returns {object} - The updated Expo configuration object.
 */
const withNotifee = (c, props) => {
    (0, utils_1.validateProps)(props);
    /** iOS Configuration */
    c = ios_1.default.setAPSEnvironment(c, props);
    c = ios_1.default.addBackgroundModes(c, props);
    c = ios_1.default.addCommunicationNotificationsCapability(c, props);
    c = ios_1.default.addNotificationServiceGroup(c, props);
    c = ios_1.default.addNotifeeToPodfile(c, props);
    c = ios_1.default.addNotificationServiceFilesToProject(c, props);
    c = ios_1.default.addNotifeeTargetToExpoAppExtensions(c, props);
    c = ios_1.default.createAndAddNotificationServiceExtensionTarget(c, props);
    c = ios_1.default.signAppAndNotificationServiceExtension(c, props);
    return c;
};
exports.default = withNotifee;
