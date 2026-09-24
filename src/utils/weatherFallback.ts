import { WeatherData } from '../types';

export const SINGAPORE_DEFAULT_AREAS = [
  { area: 'City', forecast: 'Partly Cloudy (Day)', lat: 1.292, lng: 103.844 },
  { area: 'Ang Mo Kio', forecast: 'Partly Cloudy (Day)', lat: 1.375, lng: 103.839 },
  { area: 'Bedok', forecast: 'Partly Cloudy (Day)', lat: 1.321, lng: 103.924 },
  { area: 'Bishan', forecast: 'Partly Cloudy (Day)', lat: 1.3507, lng: 103.839 },
  { area: 'Boon Lay', forecast: 'Partly Cloudy (Day)', lat: 1.304, lng: 103.701 },
  { area: 'Bukit Batok', forecast: 'Partly Cloudy (Day)', lat: 1.353, lng: 103.754 },
  { area: 'Bukit Merah', forecast: 'Partly Cloudy (Day)', lat: 1.277, lng: 103.819 },
  { area: 'Bukit Panjang', forecast: 'Partly Cloudy (Day)', lat: 1.362, lng: 103.771 },
  { area: 'Bukit Timah', forecast: 'Partly Cloudy (Day)', lat: 1.325, lng: 103.791 },
  { area: 'Changi', forecast: 'Partly Cloudy (Day)', lat: 1.357, lng: 103.987 },
  { area: 'Clementi', forecast: 'Partly Cloudy (Day)', lat: 1.315, lng: 103.76 },
  { area: 'Geylang', forecast: 'Partly Cloudy (Day)', lat: 1.318, lng: 103.884 },
  { area: 'Jurong East', forecast: 'Partly Cloudy (Day)', lat: 1.326, lng: 103.737 },
  { area: 'Kallang', forecast: 'Partly Cloudy (Day)', lat: 1.312, lng: 103.862 },
  { area: 'Marine Parade', forecast: 'Partly Cloudy (Day)', lat: 1.297, lng: 103.891 },
  { area: 'Novena', forecast: 'Partly Cloudy (Day)', lat: 1.327, lng: 103.826 },
  { area: 'Pasir Ris', forecast: 'Partly Cloudy (Day)', lat: 1.37, lng: 103.948 },
  { area: 'Punggol', forecast: 'Partly Cloudy (Day)', lat: 1.401, lng: 103.904 },
  { area: 'Queenstown', forecast: 'Partly Cloudy (Day)', lat: 1.291, lng: 103.785 },
  { area: 'Sentosa', forecast: 'Partly Cloudy (Day)', lat: 1.243, lng: 103.832 },
  { area: 'Tampines', forecast: 'Partly Cloudy (Day)', lat: 1.345, lng: 103.944 },
  { area: 'Toa Payoh', forecast: 'Partly Cloudy (Day)', lat: 1.334, lng: 103.856 },
  { area: 'Woodlands', forecast: 'Partly Cloudy (Day)', lat: 1.432, lng: 103.786 },
  { area: 'Yishun', forecast: 'Partly Cloudy (Day)', lat: 1.418, lng: 103.839 },
];

export function generateSingaporeWeatherFallback(
  lat?: number,
  lng?: number,
  areaQuery?: string
): WeatherData {
  let matched = SINGAPORE_DEFAULT_AREAS[0];

  if (areaQuery && areaQuery.trim()) {
    const q = areaQuery.trim().toLowerCase();
    const found = SINGAPORE_DEFAULT_AREAS.find((a) => a.area.toLowerCase().includes(q));
    if (found) matched = found;
  } else if (lat !== undefined && lng !== undefined) {
    let minD = Infinity;
    for (const a of SINGAPORE_DEFAULT_AREAS) {
      const d = Math.hypot(lat - a.lat, lng - a.lng);
      if (d < minD) {
        minD = d;
        matched = a;
      }
    }
  }

  const now = new Date();
  const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const startStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    area: matched.area,
    forecast: matched.forecast,
    valid_period: {
      start: now.toISOString(),
      end: endTime.toISOString(),
      text: `${startStr} to ${endStr}`,
    },
    update_timestamp: now.toISOString(),
    label_location: {
      latitude: matched.lat,
      longitude: matched.lng,
    },
    all_areas: SINGAPORE_DEFAULT_AREAS,
  };
}
