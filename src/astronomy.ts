// ─────────────────────────────────────────────────────────────────────────────
// Core astronomical calculations for Fajr (dawn), Sunrise, Solar Noon,
// and Maghrib (sunset).
//
// Minimal, zero-dependency implementation based on NOAA / Meeus algorithms.
// Accuracy: ±1-2 minutes — sufficient for prayer/fasting time purposes.
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Converts a JS Date to Julian Date. */
export function dateToJulianDate(date: Date): number {
    return date.getTime() / 86400000 + 2440587.5;
}

/** Julian Centuries from the J2000.0 epoch. */
function calcTimeJulianCent(jd: number): number {
    return (jd - 2451545.0) / 36525.0;
}

function degToRad(d: number): number { return d * (Math.PI / 180.0); }
function radToDeg(r: number): number { return r * (180.0 / Math.PI); }

// ── Solar Coordinates ────────────────────────────────────────────────────────

interface SolarCoordinates {
    /** Sun declination in degrees. */
    declination: number;
    /** Equation of Time in minutes. */
    equationOfTime: number;
}

/**
 * Calculates the sun's declination and Equation of Time for a given Julian Date.
 */
function getSolarCoordinates(jd: number): SolarCoordinates {
    const t = calcTimeJulianCent(jd);

    // Geometric Mean Longitude of the Sun (degrees)
    let l0 = 280.46646 + t * (36000.76983 + t * 0.0003032);
    while (l0 > 360.0) l0 -= 360.0;
    while (l0 < 0.0) l0 += 360.0;

    // Geometric Mean Anomaly of the Sun (degrees)
    const m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    const mRad = degToRad(m);

    // Eccentricity of Earth Orbit
    const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

    // Sun Equation of Center
    const seqCent =
        Math.sin(mRad) * (1.914602 - t * (0.004817 + 0.000014 * t))
        + Math.sin(2 * mRad) * (0.019993 - 0.000101 * t)
        + Math.sin(3 * mRad) * 0.000289;

    // Sun True Longitude
    const sunTrueLong = l0 + seqCent;

    // Sun Apparent Longitude
    const omega = 125.04 - 1934.136 * t;
    const omegaRad = degToRad(omega);
    const lambda = sunTrueLong - 0.00569 - 0.00478 * Math.sin(omegaRad);
    const lambdaRad = degToRad(lambda);

    // Mean Obliquity of the Ecliptic
    const seconds = 21.448 - t * (46.8150 + t * (0.00059 - t * 0.001813));
    const e0 = 23.0 + (26.0 + seconds / 60.0) / 60.0;

    // Obliquity Correction
    const oblCorr = e0 + 0.00256 * Math.cos(omegaRad);
    const oblCorrRad = degToRad(oblCorr);

    // Declination
    const declination = radToDeg(Math.asin(Math.sin(oblCorrRad) * Math.sin(lambdaRad)));

    // Equation of Time
    const y = Math.tan(oblCorrRad / 2.0) ** 2;
    const eqTimeRad =
        y * Math.sin(2 * degToRad(l0))
        - 2.0 * e * Math.sin(degToRad(m))
        + 4.0 * e * y * Math.sin(degToRad(m)) * Math.cos(2 * degToRad(l0))
        - 0.5 * y * y * Math.sin(4 * degToRad(l0))
        - 1.25 * e * e * Math.sin(2 * degToRad(m));
    const equationOfTime = radToDeg(eqTimeRad) * 4.0; // minutes

    return { declination, equationOfTime };
}

// ── Hour Angle ───────────────────────────────────────────────────────────────

/**
 * Returns the hour angle (degrees) for a given solar altitude.
 * Returns NaN if the sun never reaches this altitude on that day.
 */
function getHourAngle(altitudeDeg: number, declinationDeg: number, latitudeDeg: number): number {
    const cosHA =
        (Math.sin(degToRad(altitudeDeg)) - Math.sin(degToRad(latitudeDeg)) * Math.sin(degToRad(declinationDeg)))
        / (Math.cos(degToRad(latitudeDeg)) * Math.cos(degToRad(declinationDeg)));

    if (cosHA > 1.0 || cosHA < -1.0) return NaN;
    return radToDeg(Math.acos(cosHA));
}

// ── Core time-for-angle resolver ─────────────────────────────────────────────

/**
 * Computes the UTC time for a solar event on the local day whose noon (12:00 local)
 * corresponds to `localNoonUTC`.
 */
function calculateTimeForAngle(
    localNoonUTC: Date,
    latitude: number,
    longitude: number,
    timezoneOffsetMinutes: number,
    angleDeg: number,
    isSunset: boolean,
): Date | null {
    const jd = dateToJulianDate(localNoonUTC);
    const { declination, equationOfTime } = getSolarCoordinates(jd);
    const hourAngle = getHourAngle(angleDeg, declination, latitude);

    if (isNaN(hourAngle)) return null;

    const hDeg = isSunset ? hourAngle : -hourAngle;
    const longitudeCorrection = longitude * 4.0 - timezoneOffsetMinutes;
    const offsetMinutes = hDeg * 4.0 - longitudeCorrection - equationOfTime;

    return new Date(localNoonUTC.getTime() + offsetMinutes * 60000);
}

// ── Public event calculators ─────────────────────────────────────────────────

/**
 * True Fajr (dawn) — sun at `twilightAngle` degrees below the horizon.
 * Default angle: 18°.
 */
export function getFajr(
    localNoonUTC: Date, lat: number, lon: number, tzOffset: number, twilightAngle = 18,
): Date | null {
    return calculateTimeForAngle(localNoonUTC, lat, lon, tzOffset, -twilightAngle, false);
}

/**
 * Sunrise — upper limb of the sun appears above the horizon.
 * Standard correction: -0.833° (refraction + solar semidiameter).
 */
export function getSunrise(
    localNoonUTC: Date, lat: number, lon: number, tzOffset: number,
): Date | null {
    return calculateTimeForAngle(localNoonUTC, lat, lon, tzOffset, -0.833, false);
}

/**
 * Solar Noon (Dhuhr) — sun transits the local meridian.
 */
export function getSolarNoon(
    localNoonUTC: Date, lat: number, lon: number, tzOffset: number,
): Date {
    const jd = dateToJulianDate(localNoonUTC);
    const { equationOfTime } = getSolarCoordinates(jd);
    const longitudeCorrection = lon * 4.0 - tzOffset;
    const offsetMinutes = -longitudeCorrection - equationOfTime;
    return new Date(localNoonUTC.getTime() + offsetMinutes * 60000);
}

/**
 * Maghrib (sunset) — upper limb of the sun disappears below the horizon.
 * Standard correction: -0.833° (refraction + solar semidiameter).
 */
export function getMaghrib(
    localNoonUTC: Date, lat: number, lon: number, tzOffset: number,
): Date | null {
    return calculateTimeForAngle(localNoonUTC, lat, lon, tzOffset, -0.833, true);
}
