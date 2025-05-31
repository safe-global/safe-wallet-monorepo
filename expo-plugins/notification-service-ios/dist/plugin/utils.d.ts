import { NotifeeExpoPluginProps } from './types';
/**
 * Throws an error prefixed with the package name.
 *
 * @param {string} message - The error message.
 * @throws {Error} Always throws an error.
 */
export declare const throwError: (message: string) => never;
/**
 * Validates the properties passed to the Notifee Expo plugin.
 *
 * @param {NotifeeExpoPluginProps} props - The properties to validate.
 * @throws {Error} If any validation check fails.
 */
export declare const validateProps: (props: NotifeeExpoPluginProps) => void;
/**
 * Logs a message to the console with the package name prefixed.
 *
 * @param {string} message - The message to log.
 */
export declare const log: (message: string) => void;
/**
 * Logs an error message to the console with the package name prefixed.
 *
 * @param {string} message - The error message to log.
 */
export declare const logError: (message: string) => void;
