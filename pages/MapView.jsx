import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapView = ({ data }) => {
  const [showLegend, setShowLegend] = useState(true);
  const [loadingWindy, setLoadingWindy] = useState(true);

  const latestPerStation = Object.values(
    data.reduce((acc, record) => {
      const station = record.Station;
      const date = new Date(record.DateTime);
      if (!acc[station] || new Date(acc[station].DateTime) < date) {
        acc[station] = record;
      }
      return acc;
    }, {})
  );

  const getWindDirectionText = (deg) => {
    if (deg === undefined || deg === null) return "Inconnu";
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", { hour12: false });
  };

  const getWindIcon = (angle, speed) => {
    const rotation = `rotate(${angle - 180}deg)`; // ✅ Convention WMO respectée
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

  return (
    <div className="relative space-y-6">

      {/* 📌 1. Orientation utilisateur */}
      <div className="bg-blue-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 p-4 rounded shadow-md leading-6">
        <p><strong>👉 Étape 1 :</strong> Cliquez ici pour <b>charger les données météorologiques</b> :</p>
        <a href="https://data-real-time-2.onrender.com/donnees" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
          🔗 https://data-real-time-2.onrender.com/donnees
        </a>
        <p className="mt-3"><strong>👉 Étape 2 :</strong> Une fois les données chargées, cliquez ici pour <b>les visualiser</b> :</p>
        <a href="https://padgrah.onrender.com/" target="_blank" rel="noopener noreferrer" className="text-green-700 underline">
          🗺️ https://padgrah.onrender.com/
        </a>
      </div>

      {/* 🗺️ 3. Carte Leaflet avec données */}
      <div className="relative">
        <MapContainer center={[4.05, 9.68]} zoom={9} style={{ height: "700px", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {latestPerStation.map((record, index) => {
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
                    <h4 style={{ marginTop: 0, color: "#007bff" }}>{record.Station}</h4>
                    <p><b>📅 Date :</b> {formatDate(record.DateTime)}</p>
                    <p><b>🌡️ Température :</b> {record["AIR TEMPERATURE"]} °C</p>
                    <p><b>💨 Vent :</b> {windSpeed} m/s – {windDir}° ({getWindDirectionText(windDir)})</p>
                    <p><b>💧 Humidité :</b> {record["HUMIDITY"]} %</p>
                    <p><b>🧭 Pression :</b> {record["AIR PRESSURE"]} hPa</p>
                    {record["TIDE HEIGHT"] && <p><b>🌊 Marée :</b> {record["TIDE HEIGHT"]} m</p>}
                    {record["SURGE"] && <p><b>⚠️ Surcote :</b> {record["SURGE"]} m</p>}
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -10]} permanent>
                  <b>{record.Station}</b>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>

        {/* 🧭 4. Légende météo superposée */}
        <div className="absolute bottom-4 left-4 z-[1000] w-[280px]">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-sm rounded-t shadow hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300"
          >
            <span>{showLegend ? "Masquer la légende" : "Afficher la légende"}</span>
            <span>{showLegend ? "▲" : "▼"}</span>
          </button>

          <div
            className={`overflow-hidden transition-all duration-500 bg-white text-black dark:bg-gray-900 dark:text-white text-sm rounded-b shadow-lg ${showLegend ? "max-h-[500px] p-3" : "max-h-0 p-0"}`}
          >
            <div className="space-y-4">
              <div>
                <b>💨 Vitesse du vent</b>
                {[{ label: "Faible (< 3 m/s)", color: "#3b82f6" }, { label: "Modérée (3–7 m/s)", color: "#f97316" }, { label: "Forte (> 7 m/s)", color: "#8B0000" }].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path d="M12 2L15 8H9L12 2Z" fill={item.color} />
                      <line x1="12" y1="8" x2="12" y2="22" stroke={item.color} strokeWidth="2" />
                    </svg>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              <div>
                <b>🧭 Direction du vent</b>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {["N", "NE", "E", "SE", "S", "SW", "W", "NW"].map((dir, idx) => {
                    const angle = idx * 45;
                    const correctedAngle = angle - 180; // ✅ WMO: flèche vers la source
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span style={{ transform: `rotate(${correctedAngle}deg)` }}>
                          <svg width="18" height="18" viewBox="0 0 24 24">
                            <path d="M12 2L15 8H9L12 2Z" fill="#555" />
                            <line x1="12" y1="8" x2="12" y2="22" stroke="#555" strokeWidth="2" />
                          </svg>
                        </span>
                        <span>{dir}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MapView;
