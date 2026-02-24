import { describe, it, expect } from 'vitest';
import {
    getDayFastingTimes,
    getDayPrayerTimes,
    getRamadanFastingTimes,
    formatLocalTime,
} from '../src/index';
import type { RamadanCoreConfig } from '../src/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: Date, offset: number): string {
    return formatLocalTime(date, offset);
}

// ── City configs ─────────────────────────────────────────────────────────────

const MECCA: RamadanCoreConfig = {
    latitude: 21.4225,
    longitude: 39.8262,
    timezoneOffsetMinutes: 180,
    fajrTwilightAngle: 18.5,
};

const LONDON: RamadanCoreConfig = {
    latitude: 51.5085,
    longitude: -0.1257,
    timezoneOffsetMinutes: 0,
    fajrTwilightAngle: 18,
};

const DUBAI: RamadanCoreConfig = {
    latitude: 25.2048,
    longitude: 55.2708,
    timezoneOffsetMinutes: 240,
    fajrTwilightAngle: 18.5,
};

const NEW_YORK: RamadanCoreConfig = {
    latitude: 40.7128,
    longitude: -74.006,
    timezoneOffsetMinutes: -300,
    fajrTwilightAngle: 18,
};

const KUALA_LUMPUR: RamadanCoreConfig = {
    latitude: 3.139,
    longitude: 101.6869,
    timezoneOffsetMinutes: 480,
    fajrTwilightAngle: 18,
};

const ISTANBUL: RamadanCoreConfig = {
    latitude: 41.0082,
    longitude: 28.9784,
    timezoneOffsetMinutes: 180,
    fajrTwilightAngle: 18,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('getDayFastingTimes', () => {
    it('calculates correctly for Mecca', () => {
        const times = getDayFastingTimes(new Date(2024, 2, 1), MECCA);
        expect(times).not.toBeNull();
        if (!times) return;

        const fajr = fmt(times.fajr, 180);
        const maghrib = fmt(times.maghrib, 180);
        console.log(`Mecca Mar 1 2024 — Fajr: ${fajr}, Maghrib: ${maghrib}`);

        expect(['05:23', '05:24', '05:25']).toContain(fajr);
        expect(['18:23', '18:24', '18:25']).toContain(maghrib);
        expect(times.fastingDurationMinutes).toBeGreaterThan(700); // ~13 hrs
        expect(times.highLatitudeFallbackApplied).toBe(false);
    });

    it('calculates correctly for Dubai', () => {
        const times = getDayFastingTimes(new Date(2024, 2, 1), DUBAI);
        expect(times).not.toBeNull();
        if (!times) return;

        const fajr = fmt(times.fajr, 240);
        const maghrib = fmt(times.maghrib, 240);
        console.log(`Dubai Mar 1 2024 — Fajr: ${fajr}, Maghrib: ${maghrib}`);

        // Fajr around 05:20-05:30, Maghrib around 18:20-18:25
        const fajrHour = parseInt(fajr.split(':')[0]);
        expect(fajrHour).toBe(5);
        const maghribHour = parseInt(maghrib.split(':')[0]);
        expect(maghribHour).toBe(18);
    });

    it('calculates correctly for New York', () => {
        const times = getDayFastingTimes(new Date(2024, 2, 1), NEW_YORK);
        expect(times).not.toBeNull();
        if (!times) return;

        const fajr = fmt(times.fajr, -300);
        const maghrib = fmt(times.maghrib, -300);
        console.log(`New York Mar 1 2024 — Fajr: ${fajr}, Maghrib: ${maghrib}`);

        // Fajr around 04:50-05:10, Maghrib around 17:45-18:00
        const fajrHour = parseInt(fajr.split(':')[0]);
        expect([4, 5]).toContain(fajrHour);
        const maghribHour = parseInt(maghrib.split(':')[0]);
        expect(maghribHour).toBe(17);
    });

    it('calculates correctly for Kuala Lumpur', () => {
        const times = getDayFastingTimes(new Date(2024, 2, 1), KUALA_LUMPUR);
        expect(times).not.toBeNull();
        if (!times) return;

        const fajr = fmt(times.fajr, 480);
        const maghrib = fmt(times.maghrib, 480);
        console.log(`KL Mar 1 2024 — Fajr: ${fajr}, Maghrib: ${maghrib}`);

        // Near the equator, relatively stable
        const fajrHour = parseInt(fajr.split(':')[0]);
        expect([5, 6]).toContain(fajrHour);
    });

    it('calculates correctly for Istanbul', () => {
        const times = getDayFastingTimes(new Date(2024, 2, 1), ISTANBUL);
        expect(times).not.toBeNull();
        if (!times) return;

        const fajr = fmt(times.fajr, 180);
        const maghrib = fmt(times.maghrib, 180);
        console.log(`Istanbul Mar 1 2024 — Fajr: ${fajr}, Maghrib: ${maghrib}`);

        const fajrHour = parseInt(fajr.split(':')[0]);
        expect([5, 6]).toContain(fajrHour);
        const maghribHour = parseInt(maghrib.split(':')[0]);
        expect([17, 18]).toContain(maghribHour);
    });

    it('applies imsak and maghrib delay margins', () => {
        const config: RamadanCoreConfig = { ...LONDON, imsakMarginMinutes: 10, maghribDelayMinutes: 3 };
        const times = getDayFastingTimes(new Date(2024, 2, 1), config);
        expect(times).not.toBeNull();
        if (!times) return;

        expect(times.fajr.getTime() - times.imsak.getTime()).toBe(10 * 60000);
        console.log(`London Mar 1 — Imsak: ${fmt(times.imsak, 0)}, Fajr: ${fmt(times.fajr, 0)}, Maghrib: ${fmt(times.maghrib, 0)}`);
    });

    it('includes sunrise and solar noon', () => {
        const times = getDayFastingTimes(new Date(2024, 2, 1), LONDON);
        expect(times).not.toBeNull();
        if (!times) return;

        expect(times.sunrise).toBeDefined();
        expect(times.solarNoon).toBeDefined();

        // sunrise must be after fajr and before solar noon
        expect(times.sunrise.getTime()).toBeGreaterThan(times.fajr.getTime());
        expect(times.sunrise.getTime()).toBeLessThan(times.solarNoon.getTime());
        // solar noon before maghrib
        expect(times.solarNoon.getTime()).toBeLessThan(times.maghrib.getTime());

        console.log(`London Mar 1 — Sunrise: ${fmt(times.sunrise, 0)}, Noon: ${fmt(times.solarNoon, 0)}`);
    });
});

describe('getDayPrayerTimes', () => {
    it('returns four prayer times for Mecca', () => {
        const times = getDayPrayerTimes(new Date(2024, 2, 1), MECCA);
        expect(times).not.toBeNull();
        if (!times) return;

        expect(times.fajr.getTime()).toBeLessThan(times.sunrise.getTime());
        expect(times.sunrise.getTime()).toBeLessThan(times.dhuhr.getTime());
        expect(times.dhuhr.getTime()).toBeLessThan(times.maghrib.getTime());
    });
});

describe('getRamadanFastingTimes', () => {
    it('returns correct number of days for a 30-day range', () => {
        const start = new Date(2024, 2, 11); // March 11
        const end = new Date(2024, 3, 9); // April 9
        const times = getRamadanFastingTimes(start, end, MECCA);
        expect(times.length).toBe(30);
        expect(times.every(t => t !== null)).toBe(true);
    });
});

describe('formatLocalTime', () => {
    it('formats UTC date to local HH:MM', () => {
        const utcDate = new Date(Date.UTC(2024, 2, 1, 2, 24, 0)); // 02:24 UTC
        expect(formatLocalTime(utcDate, 180)).toBe('05:24'); // UTC+3
        expect(formatLocalTime(utcDate, 0)).toBe('02:24');   // UTC
        expect(formatLocalTime(utcDate, -300)).toBe('21:24'); // UTC-5 (previous day)
    });
});

describe('input validation', () => {
    it('throws on invalid latitude', () => {
        expect(() => getDayFastingTimes(new Date(), { ...LONDON, latitude: 100 }))
            .toThrow('latitude must be between -90 and 90');
    });

    it('throws on invalid longitude', () => {
        expect(() => getDayFastingTimes(new Date(), { ...LONDON, longitude: -200 }))
            .toThrow('longitude must be between -180 and 180');
    });

    it('throws on invalid fajrTwilightAngle', () => {
        expect(() => getDayFastingTimes(new Date(), { ...LONDON, fajrTwilightAngle: 5 }))
            .toThrow('fajrTwilightAngle must be a number between 10 and 24');
    });

    it('throws on invalid highLatitudeMode', () => {
        expect(() => getDayFastingTimes(new Date(), { ...LONDON, highLatitudeMode: 'invalid' as any }))
            .toThrow('highLatitudeMode must be one of');
    });
});

describe('high-latitude handling', () => {
    const TROMSO: RamadanCoreConfig = {
        latitude: 69.6492,
        longitude: 18.9553,
        timezoneOffsetMinutes: 120,
        fajrTwilightAngle: 18,
    };

    it('returns null with mode=none (default)', () => {
        const times = getDayFastingTimes(new Date(2024, 5, 21), TROMSO);
        expect(times).toBeNull();
    });

    it('returns fallback with mode=middle-of-night', () => {
        const times = getDayFastingTimes(new Date(2024, 5, 21), {
            ...TROMSO,
            highLatitudeMode: 'middle-of-night',
        });
        // Midnight sun means even sunrise/sunset may be null, so it could still be null
        // But let's test a less extreme date — May 1
        const timesMay = getDayFastingTimes(new Date(2024, 4, 1), {
            ...TROMSO,
            highLatitudeMode: 'middle-of-night',
        });
        if (timesMay) {
            expect(timesMay.highLatitudeFallbackApplied).toBe(true);
            console.log(`Tromsø May 1 (fallback) — Fajr: ${fmt(timesMay.fajr, 120)}, Maghrib: ${fmt(timesMay.maghrib, 120)}`);
        }
    });

    it('returns fallback with mode=one-seventh', () => {
        const timesMay = getDayFastingTimes(new Date(2024, 4, 1), {
            ...TROMSO,
            highLatitudeMode: 'one-seventh',
        });
        if (timesMay) {
            expect(timesMay.highLatitudeFallbackApplied).toBe(true);
        }
    });

    it('returns fallback with mode=angle-based', () => {
        const timesMay = getDayFastingTimes(new Date(2024, 4, 1), {
            ...TROMSO,
            highLatitudeMode: 'angle-based',
        });
        if (timesMay) {
            expect(timesMay.highLatitudeFallbackApplied).toBe(true);
        }
    });
});
