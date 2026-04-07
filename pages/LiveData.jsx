import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Spinner from "../components/Spinner";
import { format } from "date-fns";
const round = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? (val || "-") : Number(n.toFixed(2));
};

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
          <th className="border border-slate-600 rounded-md">N°</th>
          <th className="border border-slate-600 rounded-md">Station</th>
          <th className="border border-slate-600 rounded-md">Latitude</th>
          <th className="border border-slate-600 rounded-md">Longitude</th>
          <th className="border border-slate-600 rounded-md">DateTime</th>
          <th className="border border-slate-600 rounded-md">TIDE HEIGHT</th>
          <th className="border border-slate-600 rounded-md">WIND SPEED</th>
          <th className="border border-slate-600 rounded-md">WIND DIR</th>
          <th className="border border-slate-600 rounded-md">AIR PRESSURE</th>
          <th className="border border-slate-600 rounded-md">AIR TEMPERATURE</th>
          <th className="border border-slate-600 rounded-md">DEWPOINT</th>
          <th className="border border-slate-600 rounded-md">HUMIDITY</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item, index) => (
          <tr key={item._id}>
            <td className="border border-sky-700 rounded-md text-center">{index + 1}</td>
            <td className="border border-sky-700 rounded-md text-center">{item["Station"]}</td>
            <td className="border border-sky-700 rounded-md text-center">{round(item["Latitude"])}</td>
            <td className="border border-sky-700 rounded-md text-center">{round(item["Longitude"])}</td>
            <td className="border border-sky-700 rounded-md text-center">{item["DateTime"]}</td>
            <td className="border border-sky-700 rounded-md text-center">{round(item["TIDE HEIGHT"])}</td>
            <td className="border border-sky-700 rounded-md text-center">{round(item["WIND SPEED"])}</td>
            <td className="border border-sky-700 rounded-md text-center">{round(item["WIND DIR"])}</td>
            <td className="border border-sky-700 rounded-md text-center">{round(item["AIR PRESSURE"])}</td>
            <td className="border border-sky-700 rounded-md text-center">{round(item["AIR TEMPERATURE"])}</td>
            <td className="border border-sky-700 rounded-md text-center">{round(item["DEWPOINT"])}</td>
            <td className="border border-sky-700 rounded-md text-center">{round(item["HUMIDITY"])}</td>
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
    axios
      .get("https://data-real-time-6.onrender.com/donnees?limit=20")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return station === "all"
      ? data
      : data.filter((item) => item.Station === station);
  }, [data, station]);

  const visibleData = useMemo(() => {
    return filteredData.slice(0, 30);
  }, [filteredData]);

  const getDirectionText = (deg) => {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    if (isNaN(deg)) return "Inconnu";
    const index = Math.floor((deg + 22.5) / 45) % 8;
    return dirs[index];
  };

  const latestData = useMemo(() => {
    if (!data) return [];
    const sorted = [...data].sort(
      (a, b) => new Date(b.DateTime) - new Date(a.DateTime)
    );
    return sorted.slice(0, 3);
  }, [data]);

  if (!data) return <Spinner />;

  return (
    <div className="p-4 bg-gradient-to-br from-slate-900 to-black text-white min-h-screen">
      <div className="flex flex-col text-md items-center mb-4 text-center justify-center max-w-3xl mx-auto">
        <h1 className="text-xl font-bold mb-4">
          Données Météorologiques en Temps Réel
        </h1>
        <p className="mb-4">
          Les données suivantes sont mises à jour en temps réel pour vous
          fournir les informations les plus précises sur les conditions
          météorologiques actuelles au Port Autonome de Douala.
        </p>
        <p>
          <b>Note :</b> Les données sont collectées toutes les 10 minutes et
          peuvent varier légèrement en fonction des conditions locales.
        </p>
      </div>

      {/* Bloc Résumé météo – 3 dernières observations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto mb-6">
        {latestData.map((row, idx) => (
          <div
            key={idx}
            className="bg-white text-black rounded-xl p-4 shadow-lg"
          >
            <h2 className="text-lg font-bold mb-2">📍 Station {row.Station}</h2>
            <ul className="text-sm space-y-1">
              <li>
                🕒 Observation :{" "}
                {format(new Date(row.DateTime), "yyyy-MM-dd HH:mm:ss")}
              </li>
              <li>🌡️ Température : {round(row["AIR TEMPERATURE"])} °C</li>
              <li>💧 Humidité : {round(row["HUMIDITY"])} %</li>
              <li>💨 Vent : {round(row["WIND SPEED"])} m/s</li>
              <li>
                🧭 Direction du vent : {round(row["WIND DIR"])}° (
                {getDirectionText(parseFloat(row["WIND DIR"]))})
              </li>
              <li>⚖️ Pression : {round(row["AIR PRESSURE"])} hPa</li>
              {row["TIDE HEIGHT"] && (
                <li>🌊 Marée : {round(row["TIDE HEIGHT"])} m</li>
              )}
              {row["SURGE"] && <li>⚠️ SURGE : {round(row["SURGE"])} m</li>}
            </ul>
          </div>
        ))}
      </div>

      {/* Filtres + message de téléchargement */}
      <div className="max-w-md mx-auto flex flex-col items-center gap-4 mb-6">
        <label htmlFor="station" className="block text-sm font-semibold">
          Filtrer par station
        </label>
        <select
          name="station"
          id="station"
          className="bg-transparent outline-none px-3 py-1 rounded border border-gray-600 text-white cursor-pointer"
          onChange={(e) => setStation(e.target.value)}
          value={station}
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
          <p className="text-center text-sm text-gray-400 mt-2">
            ⚠️ L’affichage est limité à 30 lignes. Utilisez les liens ci-dessus pour consulter ou télécharger l’ensemble des données.
          </p>
        )}
      </div>
    </div>
  );
}

export default LiveData;
