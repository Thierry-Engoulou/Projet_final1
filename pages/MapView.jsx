import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapView = ({ data }) => {
  const [showLegend, setShowLegend] = useState(true);

  const getWindDirectionText = (deg) => {
    if (deg === undefined || deg === null) return "Unknown";
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", { hour12: false });
  };

  const getWindIcon = (angle, speed) => {
    const rotation = `rotate(${angle}deg)`;
    let color = "#3b82f6";
    if (speed >= 3 && speed <= 7) color = "#f97316";
    else if (speed > 7) color = "#000000";

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

  return (
    <div className="relative space-y-6">
      <MapContainer center={[4.05, 9.68]} zoom={9} style={{ height: "700px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {data.map((record, index) => {
          const windDir = parseFloat(record["WIND DIR"]);
          const windSpeed = parseFloat(record["WIND SPEED"]);
          return (
            <Marker
              key={index}
              position={[record.Latitude, record.Longitude]}
              icon={getWindIcon(windDir, windSpeed)}
            >
              <Popup>
                <div style={{ width: 250, fontSize: 13 }}>
                  <h4 style={{ marginTop: 0, color: "#007bff" }}>📍 {record.Station}</h4>
                  <p><b>📅 Date:</b> {formatDate(record.DateTime)}</p>
                  <p><b>🌡️ Temperature:</b> {record["AIR TEMPERATURE"]} °C</p>
                  <p><b>💨 Wind:</b> {windSpeed} m/s – {windDir}° ({getWindDirectionText(windDir)})</p>
                  <p><b>💧 Humidity:</b> {record["HUMIDITY"]} %</p>
                  <p><b>🧭 Pressure:</b> {record["AIR PRESSURE"]} hPa</p>
                  {record["TIDE HEIGHT"] && <p><b>🌊 Tide:</b> {record["TIDE HEIGHT"]} m</p>}
                  {record["SURGE"] && <p><b>⚠️ Surge:</b> {record["SURGE"]} m</p>}
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -10]} permanent>
                <b>{record.Station}</b>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[1000] w-[280px]">
        <button
          onClick={() => setShowLegend((prev) => !prev)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-sm rounded-t shadow hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300"
        >
          <span>{showLegend ? "Hide Legend" : "Show Legend"}</span>
          <span>{showLegend ? "🔽" : "🔼"}</span>
        </button>

        <div
          className={`overflow-hidden transition-all duration-500 bg-white text-black dark:bg-gray-900 dark:text-white text-sm rounded-b shadow-lg ${
            showLegend ? "max-h-[500px] p-3" : "max-h-0 p-0"
          }`}
        >
          <div className="space-y-4">
            {/* Wind Speed */}
            <div>
              <b>💨 Wind Speed</b>
              <div className="flex items-center gap-2">
                <span>
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M12 2L15 8H9L12 2Z" fill="#3b82f6" />
                    <line x1="12" y1="8" x2="12" y2="22" stroke="#3b82f6" strokeWidth="2" />
                  </svg>
                </span>
                <span>Low (&lt; 3 m/s)</span>
              </div>
              <div className="flex items-center gap-2">
                <span>
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M12 2L15 8H9L12 2Z" fill="#f97316" />
                    <line x1="12" y1="8" x2="12" y2="22" stroke="#f97316" strokeWidth="2" />
                  </svg>
                </span>
                <span>Moderate (3–7 m/s)</span>
              </div>
              <div className="flex items-center gap-2">
                <span>
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M12 2L15 8H9L12 2Z" fill="#000000" />
                    <line x1="12" y1="8" x2="12" y2="22" stroke="#000000" strokeWidth="2" />
                  </svg>
                </span>
                <span>Strong (&gt; 7 m/s)</span>
              </div>
            </div>

            {/* Wind Direction */}
            <div>
              <b>🧭 Wind Direction</b>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {[
                  { name: "North", angle: 0 },
                  { name: "North-East", angle: 45 },
                  { name: "East", angle: 90 },
                  { name: "South-East", angle: 135 },
                  { name: "South", angle: 180 },
                  { name: "South-West", angle: 225 },
                  { name: "West", angle: 270 },
                  { name: "North-West", angle: 315 },
                ].map((dir, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span style={{ transform: `rotate(${dir.angle}deg)` }}>
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M12 2L15 8H9L12 2Z" fill="#555" />
                        <line x1="12" y1="8" x2="12" y2="22" stroke="#555" strokeWidth="2" />
                      </svg>
                    </span>
                    <span>{dir.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;