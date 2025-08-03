import React, { useState, useEffect } from "react";
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

      {/* 🔗 Liens d'orientation */}
      <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded shadow text-sm">
        <p className="mb-2">📡 Si vous souhaitez <strong>charger les données</strong>, cliquez ici :</p>
        <a
          href="https://data-real-time-2.onrender.com/donnees"
          className="text-blue-600 dark:text-blue-400 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          🔄 https://data-real-time-2.onrender.com/donnees
        </a>

        <p className="mt-4 mb-2">📊 Une fois les données chargées, <strong>cliquez ici pour les visualiser :</strong></p>
        <a
          href="https://padgrah.onrender.com/"
          className="text-green-600 dark:text-green-400 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          🌐 https://padgrah.onrender.com/
        </a>
      </div>

      {/* 🗺️ Carte Leaflet */}
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
                  <h4 style={{ marginTop: 0, color: "#007bff" }}> {record.Station}</h4>
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

      {/* 🌐 Carte Windy */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">🌐 Carte météo animée – Windy</h2>
        {loadingWindy && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-300">
            ⏳ Chargement de la carte Windy...
          </div>
        )}
        <iframe
          title="Windy Map"
          width="100%"
          height="450"
          src="https://embed.windy.com/embed2.html?lat=4.05&lon=9.68&zoom=9&type=wind"
          frameBorder="0"
          style={{ display: loadingWindy ? "none" : "block" }}
          onLoad={() => setLoadingWindy(false)}
        ></iframe>
      </div>

    </div>
  );
};

export default MapView;
