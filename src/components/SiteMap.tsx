import { useEffect, useState, Component, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface SiteLocation {
  id: string;
  name: string;
  address: string | null;
  developer_name: string | null;
  lat: number;
  lng: number;
}

const UK_CENTER: [number, number] = [53.5, -2.5];
const DEFAULT_ZOOM = 6;

const LazyMap = lazy(() =>
  import('react-leaflet').then((mod) =>
    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css');
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Fit map bounds to show all markers
      function FitBounds({ sites: s }: { sites: SiteLocation[] }) {
        const map = mod.useMap();
        useEffect(() => {
          if (s.length === 0) return;
          const bounds = L.latLngBounds(s.map((site) => [site.lat, site.lng]));
          map.fitBounds(bounds, { padding: [30, 30] });
        }, [map, s]);
        return null;
      }

      const MapInner = ({ sites }: { sites: SiteLocation[] }) => (
        <mod.MapContainer
          center={UK_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <mod.TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds sites={sites} />
          {sites.map((site) => (
            <mod.Marker key={site.id} position={[site.lat, site.lng]}>
              <mod.Popup>
                <div className="text-sm">
                  <p className="font-semibold">{site.name}</p>
                  {site.developer_name && (
                    <p className="text-gray-600">{site.developer_name}</p>
                  )}
                  {site.address && (
                    <p className="text-gray-500 text-xs mt-1">{site.address}</p>
                  )}
                </div>
              </mod.Popup>
            </mod.Marker>
          ))}
        </mod.MapContainer>
      );

      return { default: MapInner };
    })
  )
);

class MapErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[400px] flex items-center justify-center text-muted-foreground text-sm">
          Map failed to load
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SiteMap() {
  const [sites, setSites] = useState<SiteLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name, address, latitude, longitude, developer:developers(name)')
        .eq('is_archived', false)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error || !data) {
        console.error('SiteMap: failed to fetch sites', error);
        setLoading(false);
        return;
      }

      setSites(
        data.map((site) => ({
          id: site.id,
          name: site.name,
          address: site.address,
          developer_name: (site.developer as { name: string } | null)?.name ?? null,
          lat: site.latitude as number,
          lng: site.longitude as number,
        }))
      );
      setLoading(false);
    })();
  }, []);

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Site Locations
        </h2>
        {loading ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading sites…
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {sites.length} site{sites.length !== 1 ? 's' : ''} mapped
          </span>
        )}
      </div>
      <div className="h-[400px] w-full">
        <MapErrorBoundary>
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading map…
              </div>
            }
          >
            <LazyMap sites={sites} />
          </Suspense>
        </MapErrorBoundary>
      </div>
    </div>
  );
}
