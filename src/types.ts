/**
 * High-latitude fallback strategies when true Fajr or Maghrib
 * cannot be computed because the sun never reaches the required angle.
 *
 * - `'none'`             — return `null` (default)
 * - `'middle-of-night'`  — Fajr = midpoint between sunset and sunrise of the closest
 *                          "normal" day; Maghrib = mirror. (A common scholarly opinion.)
 * - `'one-seventh'`      — divide the night into seven parts; Fajr begins at the last seventh.
 *                          (Based on a hadith-derived estimation method.)
 * - `'angle-based'`      — if the twilight angle fails, fall back to a shallower angle
 *                          (e.g. 15°) and then apply a proportional adjustment.
 */
export type HighLatitudeMode = 'none' | 'middle-of-night' | 'one-seventh' | 'angle-based';

// ─── Configuration ────────────────────────────────────────────────────────────

export interface RamadanCoreConfig {
    /** Latitude in decimal degrees (-90 to 90). */
    latitude: number;
    /** Longitude in decimal degrees (-180 to 180). */
    longitude: number;
    /** UTC offset in minutes for the location (e.g. +240 for UTC+4, -300 for UTC-5). */
    timezoneOffsetMinutes: number;

    // ── Safety margins (minutes, default 0) ──────────────────────────────────

    /** Stop eating this many minutes BEFORE true Fajr. Default: 0. */
    imsakMarginMinutes?: number;
    /** Break fast this many minutes AFTER sunset. Default: 0. */
    maghribDelayMinutes?: number;

    // ── Calculation sensitivity ──────────────────────────────────────────────

    /** Degrees below the horizon that defines true Fajr. Default: 18. */
    fajrTwilightAngle?: number;

    // ── High-latitude handling ───────────────────────────────────────────────

    /** Strategy when the sun never dips to the required angle. Default: 'none'. */
    highLatitudeMode?: HighLatitudeMode;
}

// ─── Output ───────────────────────────────────────────────────────────────────

export interface FastingTimes {
    /** The calendar date these times belong to. */
    date: Date;
    /** True Fajr (dawn) — fasting begins. */
    fajr: Date;
    /** Imsak — precautionary time to stop eating (Fajr minus `imsakMarginMinutes`). */
    imsak: Date;
    /** Sunrise — sun's upper limb appears above the horizon. */
    sunrise: Date;
    /** Solar noon / Dhuhr — sun transits the local meridian. */
    solarNoon: Date;
    /** Maghrib / Sunset — fasting ends. */
    maghrib: Date;
    /** Total fasting duration in minutes (maghrib – fajr). */
    fastingDurationMinutes: number;
    /** Whether a high-latitude fallback was applied for this day. */
    highLatitudeFallbackApplied: boolean;
}

export interface PrayerTimes {
    /** The calendar date these times belong to. */
    date: Date;
    /** True Fajr (dawn). */
    fajr: Date;
    /** Sunrise. */
    sunrise: Date;
    /** Solar noon / Dhuhr. */
    dhuhr: Date;
    /** Maghrib / Sunset. */
    maghrib: Date;
    /** Whether a high-latitude fallback was applied for this day. */
    highLatitudeFallbackApplied: boolean;
}
