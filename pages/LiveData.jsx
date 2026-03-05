import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Spinner from "../components/Spinner";
import { format } from "date-fns";

const API_URL = "https://data-real-time-2.onrender.com/donnees?limit=50";

function DataTable({ rows }) {
  if (!rows.length)
    return (
      <p className="text-center text-gray-400 mt-6">
        Aucune donnée disponible pour cette sélection.
      </p>
    );

  return (
    <table className="w-full border-separate border-spacing-2 my-4">
      <thead>
        <tr>
          {[
            "N°",
            "Station",
            "Latitude",
            "Longitude",
            "DateTime",
            "TIDE HEIGHT",
            "WIND SPEED",
            "WIND DIR",
            "AIR PRESSURE",
            "AIR TEMPERATURE",
            "DEWPOINT",
            "HUMIDITY",
          ].map((h) => (
            <th key={h} className="border border-slate-600 rounded-md">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((item, index) => (
          <tr key={item._id || index}>
            <td className="border border-sky-700 rounded-md text-center">{index + 1}</td>
            <td className="border border-sky-700 rounded-md text-center">{item.Station ?? "-"}</td>
            <td className="border border-sky-700 rounded-md text-center">{item.Latitude ?? "-"}</td>
            <td className="border border-sky-700 rounded-md text-center">{item.Longitude ?? "-"}</td>
            <td className="border border-sky-700 rounded-md text-center">{item.DateTime ?? "-"}</td>
            <td className="border border-sky-700 rounded-md text-center">{item["TIDE HEIGHT"] ?? "-"}</td>
            <td className="border border-sky-700 rounded-md text-center">{item["WIND SPEED"] ?? "-"}</td>
            <td className="border border-sky-700 rounded-md text-center">{item["WIND DIR"] ?? "-"}</td>
            <td className="border border-sky-700 rounded-md text-center">{item["AIR PRESSURE"] ?? "-"}</td>
            <td className="border border-sky-700 rounded-md text-center">{item["AIR TEMPERATURE"] ?? "-"}</td>
            <td className="border border-sky-700 rounded-md text-center">{item["DEWPOINT"] ?? "-"}</td>
            <td className="border border-sky-700 rounded-md text-center">{item["HUMIDITY"] ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LiveData() {
  const [data, setData] = useState(null);
  const [station, setStation] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(API_URL, {
          responseType: "text", // empêche crash JSON
          timeout: 10000,
        });

        let text = res.data;

        // 🔧 Corriger JSON cassé (NaN → null)
        text = text.replace(/NaN/g, "null");

        const parsed = JSON.parse(text);

        // ⚡ nettoyage rapide pour toutes les valeurs
        const cleaned = parsed.map((row) => {
          const obj = { ...row };
          Object.keys(obj).forEach((k) => {
            if (obj[k] === undefined || obj[k] === null || Number.isNaN(obj[k])) {
              obj[k] = null;
            }
          });
          return obj;
        });

        setData(cleaned);
      } catch (err) {
        console.error("Erreur API :", err);
        setData([]);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // 🔁 refresh toutes les 5 min
    return () => clearInterval(interval);
  }, []);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return station === "all" ? data : data.filter((item) => item.Station === station);
  }, [data, station]);

  const visibleData = useMemo(() => filteredData.slice(0, 30), [filteredData]);

  const getDirectionText = (deg) => {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    if (!deg || isNaN(deg)) return "Inconnu";
    const index = Math.floor((deg + 22.5) / 45) % 8;
    return dirs[index];
  };

  const latestData = useMemo(() => {
    if (!data) return [];
    return [...data]
      .sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime))
      .slice(0, 3);
  }, [data]);

  if (!data) return <Spinner />;

  return (
    <div className="p-4 bg-gradient-to-br from-slate-900 to-black text-white min-h-screen">
      <div className="text-center max-w-3xl mx-auto mb-6">
        <h1 className="text-xl font-bold mb-3">Données Météorologiques en Temps Réel</h1>
        <p>Les observations sont collectées toutes les 10 minutes au Port Autonome de Douala.</p>
      </div>

      {/* Résumé météo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto mb-6">
        {latestData.map((row, idx) => (
          <div key={idx} className="bg-white text-black rounded-xl p-4 shadow-lg">
            <h2 className="font-bold mb-2">📍 Station {row.Station}</h2>
            <ul className="text-sm space-y-1">
              <li>🕒 {row.DateTime ? format(new Date(row.DateTime), "yyyy-MM-dd HH:mm:ss") : "-"}</li>
              <li>🌡️ Température : {row["AIR TEMPERATURE"] ?? "-"} °C</li>
              <li>💧 Humidité : {row["HUMIDITY"] ?? "-"} %</li>
              <li>💨 Vent : {row["WIND SPEED"] ?? "-"} m/s</li>
              <li>🧭 Direction : {row["WIND DIR"] ?? "-"}° ({getDirectionText(parseFloat(row["WIND DIR"]))})</li>
              <li>⚖️ Pression : {row["AIR PRESSURE"] ?? "-"} hPa</li>
              {row["TIDE HEIGHT"] && <li>🌊 Marée : {row["TIDE HEIGHT"]} m</li>}
            </ul>
          </div>
        ))}
      </div>

      {/* Filtre station */}
      <div className="max-w-md mx-auto flex flex-col items-center gap-3 mb-6">
        <label className="text-sm font-semibold">Filtrer par station</label>
        <select
          className="bg-transparent border border-gray-600 px-3 py-1 rounded"
          value={station}
          onChange={(e) => setStation(e.target.value)}
        >
          <option value="all">Toutes les stations</option>
          <option value="SM 1">SM 1</option>
          <option value="SM 2">SM 2</option>
          <option value="SM 3">SM 3</option>
          <option value="SM 4">SM 4</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="max-w-6xl mx-auto px-2">
        <DataTable rows={visibleData} />
        {filteredData.length > 30 && (
          <p className="text-center text-gray-400 text-sm">⚠️ Affichage limité à 30 lignes.</p>
        )}
      </div>
    </div>
  );
}

export default LiveData;
