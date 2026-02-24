# @danishfareed/ramadan-timings

[![npm version](https://img.shields.io/npm/v/@danishfareed/ramadan-timings.svg)](https://www.npmjs.com/package/@danishfareed/ramadan-timings)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@danishfareed/ramadan-timings)](https://bundlephobia.com/package/@danishfareed/ramadan-timings)
[![license](https://img.shields.io/npm/l/@danishfareed/ramadan-timings.svg)](./LICENSE)
[![zero deps](https://img.shields.io/badge/dependencies-0-brightgreen.svg)]()

A **minimal, zero-dependency** library that calculates Ramadan fasting times and **all 5 daily prayer times** (Fajr, Dhuhr, Asr, Maghrib, Isha) worldwide using built-in solar math.

## ✨ Features

| Feature | Details |
|---------|---------|
| **Zero dependencies** | Pure TypeScript — no moment, no date-fns, no astronomy libs |
| **All 5 prayers** | Fajr, Dhuhr, Asr (Standard / Hanafi), Maghrib, Isha |
| **Single authentic method** | True Fajr → Sunset, per Qur'an 2:187 and authentic Sunnah |
| **Accurate everywhere** | Built-in Meeus/NOAA solar algorithms (±1-2 min) |
| **City search** | Resolve city names or reverse-geocode coordinates (OpenStreetMap) |
| **Dual CJS + ESM** | Works in Node, browsers, serverless, Deno |
| **Tiny bundle** | ~12 kB packed |
| **High-latitude fallbacks** | `middle-of-night`, `one-seventh`, and `angle-based` modes |
| **Input validation** | Descriptive `RangeError` messages for invalid configs |

---

## Installation

```bash
npm install @danishfareed/ramadan-timings
```

---

## Quick Start

```typescript
import { getDayFastingTimes, formatLocalTime } from '@danishfareed/ramadan-timings';

const times = getDayFastingTimes(new Date(2025, 2, 1), {
  latitude: 25.2048,       // Dubai
  longitude: 55.2708,
  timezoneOffsetMinutes: 240, // UTC+4
  fajrTwilightAngle: 18.5,
  imsakMarginMinutes: 10,
});

if (times) {
  console.log(`Imsak:   ${formatLocalTime(times.imsak,   240)}`);
  console.log(`Fajr:    ${formatLocalTime(times.fajr,    240)}`);
  console.log(`Sunrise: ${formatLocalTime(times.sunrise, 240)}`);
  console.log(`Noon:    ${formatLocalTime(times.solarNoon, 240)}`);
  console.log(`Maghrib: ${formatLocalTime(times.maghrib, 240)}`);
  console.log(`Duration: ${times.fastingDurationMinutes} mins`);
}
```

---

## API Reference

### `getDayFastingTimes(date, config): FastingTimes | null`

Returns fasting times for a single calendar day, or `null` if times cannot be computed (extreme latitudes with no fallback).

### `getDayPrayerTimes(date, config): PrayerTimes | null`

Returns all 5 prayer times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) for a single day. Asr defaults to the Sunni Standard (Shafi'i/Maliki/Hanbali) method; set `asrMethod: 'hanafi'` for the Hanafi school.

### `getRamadanFastingTimes(startDate, endDate, config): (FastingTimes | null)[]`

Returns daily fasting times for a date range (e.g. entire Ramadan).

### `formatLocalTime(date, timezoneOffsetMinutes): string`

Converts a UTC `Date` to a local `"HH:MM"` string.

### `validateConfig(config): void`

Throws a descriptive `RangeError` if any config value is invalid.

### `formatDuration(totalMinutes): string`

Formats a duration in minutes into a human-readable string like `"14h 20m"`.

### `reverseGeocode(latitude, longitude): Promise<string>`

Reverse-geocodes coordinates to a human-readable area name using the free OpenStreetMap Nominatim API. Returns formatted strings like `"Al Haram, Mecca, Saudi Arabia"`.

### `getCityCoordinates(cityName, date?): Promise<...>`

Resolves a city name to coordinates and timezone using the free Open-Meteo Geocoding API.

### `getFastingTimesByCity(cityName, date?, config?): Promise<...>`

Fetches coordinates for a city and returns fasting times.

### `getPrayerTimesByCity(cityName, date?, config?): Promise<...>`

Fetches coordinates for a city and returns prayer times.

---

### `RamadanCoreConfig`

```typescript
interface RamadanCoreConfig {
  latitude: number;               // -90 to 90
  longitude: number;              // -180 to 180
  timezoneOffsetMinutes: number;  // UTC offset in minutes (e.g. +240 for UTC+4)

  imsakMarginMinutes?: number;    // Minutes before Fajr to stop eating (default: 0)
  maghribDelayMinutes?: number;   // Minutes after sunset to break fast (default: 0)
  fajrTwilightAngle?: number;     // Fajr angle below horizon (default: 18)
  ishaTwilightAngle?: number;     // Isha angle below horizon (default: 18)
  asrMethod?: 'standard' | 'hanafi'; // Asr shadow method (default: 'standard')

  highLatitudeMode?: HighLatitudeMode; // Fallback strategy (default: 'none')
}

type HighLatitudeMode = 'none' | 'middle-of-night' | 'one-seventh' | 'angle-based';
```

### `FastingTimes`

```typescript
interface FastingTimes {
  date: Date;
  fajr: Date;                       // True dawn
  imsak: Date;                      // Fajr minus imsakMarginMinutes
  sunrise: Date;                    // Sun's upper limb above horizon
  solarNoon: Date;                  // Solar transit (Dhuhr)
  maghrib: Date;                    // Sunset — fast ends
  fastingDurationMinutes: number;   // maghrib – fajr in minutes
  highLatitudeFallbackApplied: boolean;
}
```

### `PrayerTimes`

```typescript
interface PrayerTimes {
  date: Date;
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  highLatitudeFallbackApplied: boolean;
}
```

---

## High-Latitude Handling

At extreme latitudes (above ~48°) during certain seasons, the sun may never reach 18° below the horizon. When this happens, `getDayFastingTimes` returns `null` by default. You can configure a fallback:

| Mode | Description |
|------|-------------|
| `'none'` | Return `null` (default) |
| `'middle-of-night'` | Fajr = midpoint of the night (sunset → sunrise) |
| `'one-seventh'` | Fajr = sunrise minus 1/7 of night duration |
| `'angle-based'` | Fajr = proportional to `fajrAngle / 60` of night |

```typescript
const times = getDayFastingTimes(date, {
  ...config,
  highLatitudeMode: 'one-seventh',
});
```

---

## Method & Fiqh

This package uses **one consistent method** based on Qur'an and authentic Sunnah:

- **Fasting begins at true Fajr (dawn)** — when the horizontal white light of dawn becomes distinct from the dark night (Qur'an 2:187, hadith of Ibn 'Umar and 'Adi ibn Hatim).
- **Fasting ends at sunset (Maghrib)** — the moment the sun's disk fully disappears below the horizon, even if the sky is still bright.
- No madhhab switching. No imsak is *required* by Shariah, but a configurable safety margin (`imsakMarginMinutes`) is supported.

The Fajr angle defaults to **18°** below the horizon (astronomical twilight), which closely matches the observed "true dawn". Use `18.5°` to match conventions like Umm al-Qura.

---

## License

MIT
