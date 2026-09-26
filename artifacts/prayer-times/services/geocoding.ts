import * as Location from 'expo-location';

const FALLBACK_NAME = 'موقعي الحالي';

/**
 * Reverse-geocodes coordinates into a short, human-readable place name
 * (e.g. "صفاقس، تونس"), using the device's native geocoder — Google Play
 * services on Android, Apple's geocoder on iOS. No separate API key needed.
 * Falls back to a generic label if geocoding fails or returns nothing.
 */
export async function coordinatesToPlaceName(
  latitude: number,
  longitude: number,
): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = results[0];
    if (!place) return FALLBACK_NAME;
    const locality = place.city || place.subregion || place.district || place.region;
    const country = place.country;
    if (locality && country) return `${locality}، ${country}`;
    return locality || country || FALLBACK_NAME;
  } catch {
    return FALLBACK_NAME;
  }
}

export interface GeocodedPlace {
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * Forward-geocodes a place name typed by the user (e.g. "صفاقس") into
 * coordinates plus a cleaned-up display name, using the device's native
 * geocoder. Returns null if nothing matched or the device can't geocode.
 */
export async function placeNameToCoordinates(
  query: string,
): Promise<GeocodedPlace | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const results = await Location.geocodeAsync(trimmed);
    const match = results[0];
    if (!match) return null;
    const resolvedName = await coordinatesToPlaceName(
      match.latitude,
      match.longitude,
    );
    return {
      name: resolvedName === FALLBACK_NAME ? trimmed : resolvedName,
      latitude: match.latitude,
      longitude: match.longitude,
    };
  } catch {
    return null;
  }
}
