import { getDayFastingTimes, getDayPrayerTimes } from './index.js';
import type { RamadanCoreConfig, FastingTimes, PrayerTimes } from './types.js';

/**
 * Basic Geocoding Response from Open-Meteo
 */
interface GeocodingResponse {
    results?: Array<{
        name: string;
        latitude: number;
        longitude: number;
        timezone: string;
        country: string;
        admin1?: string;
    }>;
}

/**
 * Calculates current timezone offset in minutes for a given IANA timezone string.
 * Native Intl API handles daylight saving time correctly based on the exact date.
 */
function getOffsetMinutesForTimezone(timezone: string, date: Date): number {
    const dateString = date.toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' });
    const match = dateString.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);

    if (!match) return 0; // Fallback for UTC

    const sign = match[1] === '-' ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;

    // Returning minutes (e.g., UTC+4 -> 240, UTC-5 -> -300)
    return sign * ((hours * 60) + minutes);
}

/**
 * Resolves a city name to its latitude, longitude, and timezone offset using the free Open-Meteo API.
 */
export async function getCityCoordinates(cityName: string, date: Date = new Date()): Promise<{
    name: string;
    latitude: number;
    longitude: number;
    timezoneOffsetMinutes: number;
    timezoneString: string;
}> {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch city data: ${response.statusText}`);
    }

    const data = (await response.json()) as GeocodingResponse;

    if (!data.results || data.results.length === 0) {
        throw new Error(`City not found: ${cityName}`);
    }

    const result = data.results[0];
    const offset = getOffsetMinutesForTimezone(result.timezone, date);

    return {
        name: `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}, ${result.country}`,
        latitude: result.latitude,
        longitude: result.longitude,
        timezoneOffsetMinutes: offset,
        timezoneString: result.timezone
    };
}

/**
 * Fetches coordinates for a city name and returns the complete fasting times for a given date.
 */
export async function getFastingTimesByCity(
    cityName: string,
    date: Date = new Date(),
    configOverrides?: Partial<Omit<RamadanCoreConfig, 'latitude' | 'longitude' | 'timezoneOffsetMinutes'>>
): Promise<{ locationName: string; times: FastingTimes | null }> {

    const coords = await getCityCoordinates(cityName, date);

    const config: RamadanCoreConfig = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        timezoneOffsetMinutes: coords.timezoneOffsetMinutes,
        ...configOverrides
    };

    return {
        locationName: coords.name,
        times: getDayFastingTimes(date, config)
    };
}

/**
 * Fetches coordinates for a city name and returns the basic prayer times for a given date.
 */
export async function getPrayerTimesByCity(
    cityName: string,
    date: Date = new Date(),
    configOverrides?: Partial<Omit<RamadanCoreConfig, 'latitude' | 'longitude' | 'timezoneOffsetMinutes'>>
): Promise<{ locationName: string; times: PrayerTimes | null }> {

    const coords = await getCityCoordinates(cityName, date);

    const config: RamadanCoreConfig = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        timezoneOffsetMinutes: coords.timezoneOffsetMinutes,
        ...configOverrides
    };

    return {
        locationName: coords.name,
        times: getDayPrayerTimes(date, config)
    };
}
