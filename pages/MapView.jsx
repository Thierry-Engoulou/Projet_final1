import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const { BaseLayer, Overlay } = LayersControl;

// Coordonnées fixes des 4 stations (source PAD)
const STATIONS_COORDS = {
  "SM 1": { lat: 3.8048, lon: 9.4601 },
  "SM 2": { lat: 3.9165, lon: 9.4950 },
  "SM 3": { lat: 3.9916, lon: 9.5877 },
  "SM 4": { lat: 4.0539, lon: 9.6857 },
};

// Stations hors service (pas de données temps réel)
const STATIONS_HORS_SERVICE = ["SM 1", "SM 4"];

const MapView = ({ data }) => {
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const cleanValue = (v) => {
    if (v === null || v === undefined) return "—";
    if (v === "NaN") return "—";
    const n = parseFloat(v);
    return isNaN(n) ? v : Number(n.toFixed(2));
  };

  const safeNumber = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  // Dernière observation par station (parmi les données temps réel)
  const latestPerStation = useMemo(() => {
    if (!data || data.length === 0) return {};
    const stations = {};
    data.forEach((record) => {
      const station = record?.Station;
      if (!station) return;
      const date = new Date(record.DateTime);
      if (!stations[station] || new Date(stations[station].DateTime) < date) {
        stations[station] = record;
      }
    });
    return stations;
  }, [data]);

  const getWindDirectionText = (deg) => {
    if (deg === undefined || deg === null) return "Inconnu";
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("fr-FR", { hour12: false });
  };

  // Icône flèche de vent pour station active
  const getWindIcon = (angle, speed) => {
    angle = safeNumber(angle) ?? 0;
    speed = safeNumber(speed) ?? 0;
    const rotation = `rotate(${angle - 180}deg)`;
    let color = "#3b82f6";
    if (speed >= 3 && speed <= 7) color = "#f97316";
    else if (speed > 7) color = "#8B0000";
    const animatedClass = speed > 7 ? "animate-pulse" : "";
    return L.divIcon({
      className: "custom-icon",
      html: `
        <div style="transform:${rotation}; width:36px; height:36px;" class="${animatedClass}">
          <svg width="36" height="36" viewBox="0 0 24 24">
            <path d="M12 2L15 8H9L12 2Z" fill="${color}" />
            <line x1="12" y1="8" x2="12" y2="22" stroke="${color}" stroke-width="2"/>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  // Icône croix grise pour station hors service
  const getOfflineIcon = () => {
    return L.divIcon({
      className: "custom-icon",
      html: `
        <div style="width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
          <svg width="36" height="36" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#6b7280" opacity="0.7" stroke="#374151" stroke-width="1.5"/>
            <line x1="7" y1="7" x2="17" y2="17" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="17" y1="7" x2="7" y2="17" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  return (
    <div className="relative">
      <MapContainer
        center={[3.97, 9.57]}
        zoom={11}
        minZoom={9}
        maxZoom={14}
        style={{ height: "700px", width: "100%" }}
      >
        <LayersControl position="topright">

          {/* Base Layer 1 : OpenStreetMap */}
          <BaseLayer checked name="OpenStreetMap">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </BaseLayer>

          {/* Base Layer 2 : Satellite Google */}
          <BaseLayer name="Satellite">
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              subdomains={["mt0", "mt1", "mt2", "mt3"]}
            />
          </BaseLayer>

          {/* Overlay 1 : Carte QGIS */}
          <Overlay checked name="Carte port">
            <TileLayer url="/tiles/{z}/{x}/{y}.png" maxZoom={14} opacity={0.7} />
          </Overlay>

          {/* Overlay 2 : Carte Bulletin PAD */}
          <Overlay checked name="Carte Bulletin PAD">
            <TileLayer url="/tiles_v2/{z}/{x}/{y}.png" tms={true} maxZoom={14} opacity={0.7} />
          </Overlay>

          {/* Overlay : Aide à la Navigation – toutes les stations */}
          <Overlay checked name="Aide à la Navigation">
            {Object.entries(STATIONS_COORDS).map(([stationName, coords]) => {
              const isHorsService = STATIONS_HORS_SERVICE.includes(stationName);
              const record = latestPerStation[stationName];

              if (isHorsService) {
                // Station hors service : icône grise + popup maintenance
                return (
                  <Marker
                    key={stationName}
                    position={[coords.lat, coords.lon]}
                    icon={getOfflineIcon()}
                  >
                    <Popup>
                      <div style={{ width: 250, fontSize: 13 }}>
                        <h4 style={{ marginTop: 0, color: "#dc2626" }}>
                          🔴 {stationName} — Hors Service
                        </h4>
                        <p style={{ color: "#6b7280" }}>
                          ⚙️ Cette station est actuellement <strong>non fonctionnelle</strong>.
                          Une opération de maintenance est en cours. Les données seront
                          disponibles dès la remise en service.
                        </p>
                        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
                          📍 Lat : {coords.lat} | Lon : {coords.lon}
                        </p>
                      </div>
                    </Popup>
                    <Tooltip direction="top" offset={[0, -10]} permanent>
                      <span style={{ color: "#dc2626" }}>🔴 {stationName}</span>
                    </Tooltip>
                  </Marker>
                );
              }

              // Station active : flèche vent + données complètes
              if (!record) return null;
              const windDir = safeNumber(record["WIND DIR"]);
              const windSpeed = safeNumber(record["WIND SPEED"]);

              return (
                <Marker
                  key={stationName}
                  position={[coords.lat, coords.lon]}
                  icon={getWindIcon(windDir, windSpeed)}
                >
                  <Popup>
                    <div style={{ width: 260, fontSize: 13 }}>
                      <h4 style={{ marginTop: 0, color: "#007bff" }}>
                        🟢 {record.Station}
                      </h4>
                      <p><b>📅 Date :</b> {formatDate(record.DateTime)}</p>
                      <p><b>🌡️ Température :</b> {cleanValue(record["AIR TEMPERATURE"])} °C</p>
                      <p><b>💧 Humidité :</b> {cleanValue(record["HUMIDITY"])} %</p>
                      <p><b>🧭 Pression :</b> {cleanValue(record["AIR PRESSURE"])} hPa</p>
                      <p>
                        <b>💨 Vent :</b>{" "}
                        {windSpeed !== null ? Number(windSpeed.toFixed(2)) : "—"} m/s
                      </p>
                      <p>
                        <b>🧭 Direction :</b>{" "}
                        {windDir !== null ? Number(windDir.toFixed(2)) : "—"}°
                        ({getWindDirectionText(windDir)})
                      </p>
                      {record["TIDE HEIGHT"] && (
                        <p><b>🌊 Marée :</b> {cleanValue(record["TIDE HEIGHT"])} m</p>
                      )}
                      {record["SURGE"] && (
                        <p><b>⚠️ Surcote :</b> {cleanValue(record["SURGE"])} m</p>
                      )}
                    </div>
                  </Popup>
                  <Tooltip direction="top" offset={[0, -10]} permanent>
                    <b>{record.Station}</b>
                  </Tooltip>
                </Marker>
              );
            })}
          </Overlay>

        </LayersControl>
      </MapContainer>

      {/* Légende — Aide à la Navigation + Vent */}
      <div
        className="absolute bottom-4 left-4 z-[400] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300"
        style={{ minWidth: isLegendOpen ? 210 : "auto", maxHeight: "85vh", overflowY: "auto", fontSize: 11 }}
      >

        {/* En-tête — Aide à la Navigation (Togglable) */}
        <div 
          className="bg-[#0f2d5e] text-white px-3 py-2 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-[#1a3d75] transition-colors"
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          title="Afficher/Masquer la légende"
        >
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="flex flex-col">
              <p className="font-extrabold tracking-wide text-xs">LÉGENDE / AIDE</p>
              {isLegendOpen && (
                <p className="text-blue-200 leading-none mt-0.5" style={{ fontSize: 9 }}>Carte du Port de Douala</p>
              )}
            </div>
          </div>
          <div className="text-white text-xs opacity-70">
            {isLegendOpen ? "▼" : "▲"}
          </div>
        </div>

        {/* Corps de la légende */}
        {isLegendOpen && (
          <div className="p-3">

          {/* Vitesse du vent */}
          <p className="font-bold text-gray-500 mb-1.5 uppercase tracking-widest" style={{ fontSize: 9 }}>⚡ Vitesse du vent</p>
          {[
            { color: "#3b82f6", label: "< 3 m/s", desc: "Faible" },
            { color: "#f97316", label: "3 – 7 m/s", desc: "Modéré" },
            { color: "#8B0000", label: "> 7 m/s", desc: "Fort ⚠️", pulse: true },
          ].map(({ color, label, desc, pulse }) => (
            <div key={label} className="flex items-center gap-2 mb-1">
              <div
                className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${pulse ? "animate-pulse" : ""}`}
                style={{ backgroundColor: color }}
              />
              <span className="font-semibold" style={{ color }}>{label}</span>
              <span className="text-gray-500">— {desc}</span>
            </div>
          ))}

          {/* Séparateur */}
          <div className="border-t border-dashed border-gray-200 my-3" />

          {/* Direction du vent — explication bateau */}
          <p className="font-bold text-gray-500 mb-1.5 uppercase tracking-widest" style={{ fontSize: 9 }}>🧭 Direction du vent</p>

          {/* Grille 8 directions — style horloge 4×2 */}
          <p className="text-gray-400 mb-1.5 text-center" style={{ fontSize: 9 }}>Exemples de directions :</p>
          <div className="grid grid-cols-2 gap-1">
            {[
              { label: "Nord (N)",        rotation: 0   },
              { label: "Nord-Est (NE)",   rotation: 45  },
              { label: "Est (E)",         rotation: 90  },
              { label: "Sud-Est (SE)",    rotation: 135 },
              { label: "Sud (S)",         rotation: 180 },
              { label: "Sud-Ouest (SO)",  rotation: 225 },
              { label: "Ouest (O)",       rotation: 270 },
              { label: "Nord-Ouest (NO)", rotation: 315 },
            ].map(({ label, rotation }) => (
              <div key={label} className="flex items-center gap-1.5 bg-gray-50 hover:bg-blue-50 rounded px-1.5 py-1 transition-colors cursor-default">
                <svg width="14" height="14" viewBox="0 0 24 24" style={{ transform: `rotate(${rotation}deg)`, flexShrink: 0 }}>
                  <path d="M12 2L15 8H9L12 2Z" fill="#3b82f6" />
                  <line x1="12" y1="8" x2="12" y2="22" stroke="#3b82f6" strokeWidth="2.5"/>
                </svg>
                <span className="text-gray-600 leading-none" style={{ fontSize: 9 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Séparateur */}
          <div className="border-t border-dashed border-gray-200 my-3" />

          {/* Station hors service */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="10" height="10" viewBox="0 0 10 10">
                <line x1="2" y1="2" x2="8" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="8" y1="2" x2="2" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-red-600 font-semibold">Station hors service</span>
          </div>

        {/* Footer */}
          <p className="text-gray-300 text-center mt-3 border-t border-gray-100 pt-2" style={{ fontSize: 8 }}>
            🛟 Port Autonome de Douala — MeteoMarinePAD
          </p>
        </div>
        )}
      </div>

    </div>
  );
};

export default MapView;