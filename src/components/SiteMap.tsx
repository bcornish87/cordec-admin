import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

// Fix default marker icons (Leaflet + bundlers issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface SiteLocation {
  id: string;
  name: string;
  address: string | null;
  developer_name: string | null;
  lat: number;
  lng: number;
}

const CACHE_KEY = 'site-map-geocache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function loadCache(): Record<string, { lat: number; lng: number; ts: number }> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    // Evict expired entries
    for (const key of Object.keys(parsed)) {
      if (now - parsed[key].ts > CACHE_TTL) delete parsed[key];
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, { lat: number; lng: number; ts: number }>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full — ignore
  }
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { 'User-Agent': 'SiteSupervisorHub/1.0' } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    // network error — skip
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Default centre: UK
const UK_CENTER: [number, number] = [53.5, -2.5];
const DEFAULT_ZOOM = 6;

export default function SiteMap() {
  const [sites, setSites] = useState<SiteLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState('');
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    (async () => {
      // Fetch active sites with addresses
      const { data, error } = await supabase
        .from('sites')
        .select('id, name, address, developer:developers(name)')
        .eq('is_archived', false)
        .not('address', 'is', null);

      if (error || !data) {
        setLoading(false);
        return;
      }

      const cache = loadCache();
      const results: SiteLocation[] = [];
      let geocoded = 0;

      for (const site of data) {
        if (abortRef.current) break;
        const addr = (site.address ?? '').trim();
        if (!addr) continue;

        const cacheKey = addr.toLowerCase();

        if (cache[cacheKey]) {
          results.push({
            id: site.id,
            name: site.name,
            address: addr,
            developer_name: (site.developer as { name: string } | null)?.name ?? null,
            lat: cache[cacheKey].lat,
            lng: cache[cacheKey].lng,
          });
          continue;
        }

        // Geocode with rate-limit respect (1 req/sec for Nominatim)
        if (geocoded > 0) await sleep(1100);
        setProgress(`Geocoding ${results.length + 1} of ${data.length}…`);
        const coords = await geocode(addr);
        geocoded++;

        if (coords) {
          cache[cacheKey] = { ...coords, ts: Date.now() };
          results.push({
            id: site.id,
            name: site.name,
            address: addr,
            developer_name: (site.developer as { name: string } | null)?.name ?? null,
            lat: coords.lat,
            lng: coords.lng,
          });
        }
      }

      saveCache(cache);
      setSites(results);
      setLoading(false);
    })();

    return () => {
      abortRef.current = true;
    };
  }, []);

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Site Locations
        </h2>
        {loading && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            {progress || 'Loading sites…'}
          </span>
        )}
        {!loading && (
          <span className="text-xs text-muted-foreground">
            {sites.length} site{sites.length !== 1 ? 's' : ''} mapped
          </span>
        )}
      </div>
      <div className="h-[400px] w-full">
        <MapContainer
          center={UK_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full z-0"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {sites.map((site) => (
            <Marker key={site.id} position={[site.lat, site.lng]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{site.name}</p>
                  {site.developer_name && (
                    <p className="text-gray-600">{site.developer_name}</p>
                  )}
                  {site.address && (
                    <p className="text-gray-500 text-xs mt-1">{site.address}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
