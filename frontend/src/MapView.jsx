import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import { useState, useRef, useCallback, useMemo, memo } from "react";
import axios from "axios";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import "./MapView.css";

const DEBOUNCE_MS  = 400;
const API_BASE_URL = process.env.REACT_APP_API_URL;

function MapEvents({ onBoundsChange }) {
  const debounceRef   = useRef(null);
  const prevBoundsRef = useRef(null);

  const handleMove = useCallback(
    (map) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        if (prevBoundsRef.current && prevBoundsRef.current.equals(bounds, 1e-6)) return;
        prevBoundsRef.current = bounds;
        onBoundsChange(bounds);
      }, DEBOUNCE_MS);
    },
    [onBoundsChange]
  );

  useMapEvents({
    moveend(e) { handleMove(e.target); },
    load(e)    { handleMove(e.target); },
  });

  return null;
}

const RestaurantMarker = memo(function RestaurantMarker({ r }) {
  return (
    <CircleMarker
      center={[r.lat, r.lng]}
      radius={6}
      pathOptions={{
        color: "#ffffff",
        fillColor: "#2563eb",
        fillOpacity: 0.8,
        weight: 1.5,
      }}
      eventHandlers={{
        mouseover: (e) => {
          e.target.setRadius(9);
          e.target.setStyle({ fillOpacity: 1, fillColor: "#1d4ed8" });
        },
        mouseout: (e) => {
          e.target.setRadius(6);
          e.target.setStyle({ fillOpacity: 0.8, fillColor: "#2563eb" });
        },
      }}
    >
      <Tooltip direction="top" offset={[0, -8]} opacity={1}>
        <strong>{r.name}</strong>
      </Tooltip>

      <Popup>
        <div className="popup-card">
          <div className="popup-card__name">{r.name}</div>
          <div className="popup-card__coords">
            {r.lat.toFixed(4)}°N, {r.lng.toFixed(4)}°E
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
});

const Markers = memo(function Markers({ restaurants }) {
  const markers = useMemo(
    () => restaurants.map((r) => <RestaurantMarker key={r.id} r={r} />),
    [restaurants]
  );

  return (
    <MarkerClusterGroup chunkedLoading maxClusterRadius={60}>
      {markers}
    </MarkerClusterGroup>
  );
});

export default function MapView() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [fetched, setFetched]         = useState(false);
  const controllerRef                 = useRef(null);

  const fetchRestaurants = useCallback(async (bounds) => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE_URL}/restaurants`, {
        params: {
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast(),
        },
        signal: controllerRef.current.signal,
      });

      setRestaurants(res.data.data ?? []);
      setFetched(true);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        console.error("API error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const showEmpty = fetched && !loading && restaurants.length === 0;

  return (
    <div className="geostream-root">
      <header className="geostream-header">
        <div className="geostream-header__left">
          <div className="geostream-header__title">
            <span className="geostream-header__dot" />
            Nearby Restaurants
          </div>
          <span className="geostream-header__subtitle">
            Explore restaurants around you
          </span>
        </div>
        <span className="geostream-header__badge">
          {restaurants.length > 0
            ? `${restaurants.length} nearby`
            : "Pan to search"}
        </span>
      </header>

      <div className="geostream-map-wrapper">
        <div className={`geostream-status-pill ${loading ? "geostream-status-pill--visible" : ""}`}>
          <span className="geostream-status-pill__dot" />
          Updating results…
        </div>

        <div className={`geostream-loading-overlay ${loading ? "geostream-loading-overlay--visible" : ""}`}>
          <div className="geostream-spinner" />
        </div>

        {showEmpty && (
          <div className="geostream-empty">
            <span className="geostream-empty__icon">📍</span>
            <span className="geostream-empty__text">No restaurants in this area</span>
          </div>
        )}

        <MapContainer
          center={[20.5, 78.9]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapEvents onBoundsChange={fetchRestaurants} />
          <Markers restaurants={restaurants} />
        </MapContainer>
      </div>
    </div>
  );
}
