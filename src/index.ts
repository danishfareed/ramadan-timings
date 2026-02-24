import { getFajr, getSunrise, getSolarNoon, getMaghrib } from './astronomy';
import { validateConfig } from './validation';
import type { RamadanCoreConfig, FastingTimes, PrayerTimes } from './types';

// Re-export all public types
export type { RamadanCoreConfig, FastingTimes, PrayerTimes, HighLatitudeMode } from './types';
export { validateConfig } from './validation';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a `Date` representing 12:00 PM **local** time in UTC.
 * E.g. if the local timezone is UTC+3 (180 min), local noon = 09:00 UTC.
 */
function localNoonToUTC(year: number, month: number, day: number, tzOffset: number): Date {
    const noon = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
    noon.setUTCMinutes(noon.getUTCMinutes() - tzOffset);
    return noon;
}

/**
 * Format a UTC `Date` to a local `"HH:MM"` string given a timezone offset in minutes.
 *
 * ```ts
 * formatLocalTime(someUtcDate, 180); // → "05:24"
 * ```
 */
export function formatLocalTime(date: Date, timezoneOffsetMinutes: number): string {
    const local = new Date(date.getTime() + timezoneOffsetMinutes * 60000);
    const hh = local.getUTCHours().toString().padStart(2, '0');
    const mm = local.getUTCMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
}

// ── High-latitude fallbacks ──────────────────────────────────────────────────

/**
 * When true Fajr or Maghrib can't be computed (extreme latitudes), apply a
 * fallback. Returns adjusted { fajr, maghrib } or null if mode is 'none'.
 */
function applyHighLatitudeFallback(
    date: Date,
    config: RamadanCoreConfig,
    sunrise: Date | null,
    sunset: Date | null,
): { fajr: Date; maghrib: Date } | null {
    const mode = config.highLatitudeMode ?? 'none';
    if (mode === 'none') return null;

    const { latitude, longitude, timezoneOffsetMinutes: tz, fajrTwilightAngle = 18 } = config;
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const noonUTC = localNoonToUTC(year, month, day, tz);

    // We need sunrise and sunset for all fallback methods.
    // If even sunrise/sunset are null (e.g. midnight sun), we can't help.
    const sr = sunrise ?? getSunrise(noonUTC, latitude, longitude, tz);
    const ss = sunset ?? getMaghrib(noonUTC, latitude, longitude, tz);
    if (!sr || !ss) return null;

    const nightDurationMs = sr.getTime() + 86400000 - ss.getTime(); // from sunset to next sunrise

    if (mode === 'middle-of-night') {
        // Fajr = sunset + nightDuration / 2
        const fajr = new Date(ss.getTime() + nightDurationMs / 2);
        return { fajr, maghrib: ss };
    }

    if (mode === 'one-seventh') {
        // Fajr = sunrise - (1/7 of night)
        const fajr = new Date(sr.getTime() - nightDurationMs / 7);
        return { fajr, maghrib: ss };
    }

    if (mode === 'angle-based') {
        // Proportion: fajrAngle / 60 of the night
        const proportion = fajrTwilightAngle / 60;
        const fajr = new Date(sr.getTime() - proportion * nightDurationMs);
        return { fajr, maghrib: ss };
    }

    return null;
}

// ── Main API ─────────────────────────────────────────────────────────────────

/**
 * Calculates fasting times for a single day.
 *
 * This library uses one consistent method based on Qur'an 2:187 and authentic Sunnah:
 * - Fasting begins at **true Fajr (dawn)** — sun at `fajrTwilightAngle` below horizon.
 * - Fasting ends at **sunset (Maghrib)** — sun's disk fully below the horizon.
 *
 * @param date  The calendar day (year/month/day are read via `.getFullYear()` etc.).
 * @param config  Location, timezone, and optional parameters.
 * @returns  `FastingTimes` or `null` if times cannot be computed even with fallbacks.
 */
export function getDayFastingTimes(date: Date, config: RamadanCoreConfig): FastingTimes | null {
    validateConfig(config);

    const {
        latitude, longitude, timezoneOffsetMinutes: tz,
        imsakMarginMinutes = 0,
        maghribDelayMinutes = 0,
        fajrTwilightAngle = 18,
    } = config;

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const noonUTC = localNoonToUTC(year, month, day, tz);

    let fajrRaw = getFajr(noonUTC, latitude, longitude, tz, fajrTwilightAngle);
    let maghribRaw = getMaghrib(noonUTC, latitude, longitude, tz);
    const sunriseRaw = getSunrise(noonUTC, latitude, longitude, tz);
    const solarNoon = getSolarNoon(noonUTC, latitude, longitude, tz);

    let highLatFallback = false;

    if (!fajrRaw || !maghribRaw) {
        const fallback = applyHighLatitudeFallback(date, config, sunriseRaw, maghribRaw);
        if (!fallback) return null;
        fajrRaw = fajrRaw ?? fallback.fajr;
        maghribRaw = maghribRaw ?? fallback.maghrib;
        highLatFallback = true;
    }

    // If sunrise is null but we got fajr/maghrib (edge case), approximate sunrise
    const sunrise = sunriseRaw ?? new Date(fajrRaw.getTime() + 90 * 60000); // ~90 min after Fajr as rough estimate

    const fajr = new Date(fajrRaw.getTime());
    const imsak = new Date(fajrRaw.getTime() - imsakMarginMinutes * 60000);
    const maghrib = new Date(maghribRaw.getTime() + maghribDelayMinutes * 60000);

    return {
        date,
        fajr,
        imsak,
        sunrise,
        solarNoon,
        maghrib,
        fastingDurationMinutes: Math.round((maghrib.getTime() - fajr.getTime()) / 60000),
        highLatitudeFallbackApplied: highLatFallback,
    };
}

/**
 * Calculates core prayer times (Fajr, Sunrise, Dhuhr, Maghrib) for a single day.
 *
 * A broader-utility function beyond fasting. Does not include imsak or delay margins.
 */
export function getDayPrayerTimes(date: Date, config: RamadanCoreConfig): PrayerTimes | null {
    validateConfig(config);

    const { latitude, longitude, timezoneOffsetMinutes: tz, fajrTwilightAngle = 18 } = config;
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const noonUTC = localNoonToUTC(year, month, day, tz);

    let fajrRaw = getFajr(noonUTC, latitude, longitude, tz, fajrTwilightAngle);
    const sunriseRaw = getSunrise(noonUTC, latitude, longitude, tz);
    const dhuhr = getSolarNoon(noonUTC, latitude, longitude, tz);
    let maghribRaw = getMaghrib(noonUTC, latitude, longitude, tz);

    let highLatFallback = false;

    if (!fajrRaw || !maghribRaw) {
        const fallback = applyHighLatitudeFallback(date, config, sunriseRaw, maghribRaw);
        if (!fallback) return null;
        fajrRaw = fajrRaw ?? fallback.fajr;
        maghribRaw = maghribRaw ?? fallback.maghrib;
        highLatFallback = true;
    }

    const sunrise = sunriseRaw ?? new Date(fajrRaw.getTime() + 90 * 60000);

    return {
        date,
        fajr: new Date(fajrRaw.getTime()),
        sunrise,
        dhuhr,
        maghrib: new Date(maghribRaw.getTime()),
        highLatitudeFallbackApplied: highLatFallback,
    };
}

/**
 * Calculates fasting times for a date range (e.g. entire Ramadan).
 *
 * @param startDate  First day inclusive.
 * @param endDate    Last day inclusive.
 * @param config     Location & calculation options.
 */
export function getRamadanFastingTimes(
    startDate: Date, endDate: Date, config: RamadanCoreConfig,
): (FastingTimes | null)[] {
    validateConfig(config);

    const results: (FastingTimes | null)[] = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12);
    const endMs = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 12).getTime();

    while (current.getTime() <= endMs) {
        results.push(getDayFastingTimes(new Date(current.getTime()), config));
        current.setDate(current.getDate() + 1);
    }

    return results;
}
