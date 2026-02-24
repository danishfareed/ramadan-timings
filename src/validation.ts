import type { RamadanCoreConfig } from './types';

/**
 * Validates a RamadanCoreConfig and throws descriptive errors for invalid values.
 */
export function validateConfig(config: RamadanCoreConfig): void {
    if (config.latitude == null || typeof config.latitude !== 'number' || Number.isNaN(config.latitude)) {
        throw new RangeError('latitude is required and must be a number.');
    }
    if (config.latitude < -90 || config.latitude > 90) {
        throw new RangeError(`latitude must be between -90 and 90. Received: ${config.latitude}`);
    }

    if (config.longitude == null || typeof config.longitude !== 'number' || Number.isNaN(config.longitude)) {
        throw new RangeError('longitude is required and must be a number.');
    }
    if (config.longitude < -180 || config.longitude > 180) {
        throw new RangeError(`longitude must be between -180 and 180. Received: ${config.longitude}`);
    }

    if (config.timezoneOffsetMinutes == null || typeof config.timezoneOffsetMinutes !== 'number' || Number.isNaN(config.timezoneOffsetMinutes)) {
        throw new RangeError('timezoneOffsetMinutes is required and must be a number.');
    }
    // Reasonable range: UTC-12 to UTC+14
    if (config.timezoneOffsetMinutes < -720 || config.timezoneOffsetMinutes > 840) {
        throw new RangeError(`timezoneOffsetMinutes must be between -720 and 840. Received: ${config.timezoneOffsetMinutes}`);
    }

    if (config.imsakMarginMinutes != null) {
        if (typeof config.imsakMarginMinutes !== 'number' || config.imsakMarginMinutes < 0 || config.imsakMarginMinutes > 60) {
            throw new RangeError(`imsakMarginMinutes must be a number between 0 and 60. Received: ${config.imsakMarginMinutes}`);
        }
    }

    if (config.maghribDelayMinutes != null) {
        if (typeof config.maghribDelayMinutes !== 'number' || config.maghribDelayMinutes < 0 || config.maghribDelayMinutes > 60) {
            throw new RangeError(`maghribDelayMinutes must be a number between 0 and 60. Received: ${config.maghribDelayMinutes}`);
        }
    }

    if (config.fajrTwilightAngle != null) {
        if (typeof config.fajrTwilightAngle !== 'number' || config.fajrTwilightAngle < 10 || config.fajrTwilightAngle > 24) {
            throw new RangeError(`fajrTwilightAngle must be a number between 10 and 24. Received: ${config.fajrTwilightAngle}`);
        }
    }

    const validModes = ['none', 'middle-of-night', 'one-seventh', 'angle-based'];
    if (config.highLatitudeMode != null && !validModes.includes(config.highLatitudeMode)) {
        throw new RangeError(`highLatitudeMode must be one of: ${validModes.join(', ')}. Received: ${config.highLatitudeMode}`);
    }
}
