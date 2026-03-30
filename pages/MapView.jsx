import React, { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const { BaseLayer, Overlay } = LayersControl;

const MapView = ({ data }) => {

  const cleanValue = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number" && isNaN(v)) return null;
    if (v === "NaN") return null;
    return v;
  };

  const safeNumber = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  // dernière observation par station
  const latestPerStation = useMemo(() => {
    if (!data || data.length === 0) return [];
    const stations = {};
    data.forEach((record) => {
      const station = record?.Station;
      if (!station) return;
      const date = new Date(record.DateTime);
      if (!stations[station] || new Date(stations[station].DateTime) < date) {
        stations[station] = record;
      }
    });
    return Object.values(stations);
  }, [data]);

  const getWindDirectionText = (deg) => {
    if (deg === undefined || deg === null) return "Inconnu";
    const directions = ["N","NE","E","SE","S","SW","W","NW"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("fr-FR", { hour12:false });
  };

  const getWindIcon = (angle, speed) => {
    angle = cleanValue(angle) ?? 0;
    speed = cleanValue(speed) ?? 0;
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
      iconSize: [36,36],
      iconAnchor: [18,18],
    });
  };

  return (
    <div className="relative">
      <MapContainer
        center={[4.05, 9.68]}
        zoom={11}
        minZoom={9}
        maxZoom={14}
        style={{ height:"700px", width:"100%" }}
      >
        <LayersControl position="topright">

          {/* Base Layer 1 : OpenStreetMap */}
          <BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>

          {/* Base Layer 2 : Satellite Google */}
          <BaseLayer name="Satellite">
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              subdomains={["mt0","mt1","mt2","mt3"]}
            />
          </BaseLayer>

          {/* Overlay 1 : Carte QGIS (ancien fragment) */}
          <Overlay checked name="Carte port">
            <TileLayer
              url="/tiles/{z}/{x}/{y}.png"
              maxZoom={14}
              opacity={0.7}
            />
          </Overlay>

          {/* Overlay 2 : Nouvelle carte Bulletin PAD */}
          <Overlay checked name="Carte Bulletin PAD">
            <TileLayer
              url="/tiles_v2/{z}/{x}/{y}.png"
              tms={true}
              maxZoom={14}
              opacity={0.7}
            />
          </Overlay>

          {/* Overlay : Stations météo */}
          <Overlay checked name="Stations météo">
            {latestPerStation
              .filter(r => safeNumber(r.Latitude) && safeNumber(r.Longitude))
              .map((record, index) => {
                const lat = safeNumber(record.Latitude);
                const lon = safeNumber(record.Longitude);
                const windDir = safeNumber(record["WIND DIR"]);
                const windSpeed = safeNumber(record["WIND SPEED"]);

                return (
                  <Marker
                    key={index}
                    position={[lat, lon]}
                    icon={getWindIcon(windDir, windSpeed)}
                  >
                    <Popup>
                      <div style={{ width:250, fontSize:13 }}>
                        <h4 style={{ marginTop:0, color:"#007bff" }}>
                          {record.Station}
                        </h4>
                        <p><b>📅 Date :</b> {formatDate(record.DateTime)}</p>
                        <p><b>🌡️ Température :</b> {cleanValue(record["AIR TEMPERATURE"])} °C</p>
                        <p>
                          <b>💨 Vent :</b> {windSpeed} m/s – {windDir}° ({getWindDirectionText(windDir)})
                        </p>
                        <p><b>💧 Humidité :</b> {cleanValue(record["HUMIDITY"])} %</p>
                        <p><b>🧭 Pression :</b> {cleanValue(record["AIR PRESSURE"])} hPa</p>
                        {record["TIDE HEIGHT"] && <p><b>🌊 Marée :</b> {record["TIDE HEIGHT"]} m</p>}
                        {record["SURGE"] && <p><b>⚠️ Surcote :</b> {record["SURGE"]} m</p>}
                      </div>
                    </Popup>
                    <Tooltip direction="top" offset={[0,-10]} permanent>
                      <b>{record.Station}</b>
                    </Tooltip>
                  </Marker>
                );
              })}
          </Overlay>

        </LayersControl>
      </MapContainer>
    </div>
  );
};

export default MapView;