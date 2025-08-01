import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "../pages/Home";
import Sidebar from "../components/Sidebar";
import Forecast from "../pages/Forecast";
import LiveData from "../pages/LiveData";
import MapView from "../pages/MapView";
import Alerts from "../pages/Alerts";
import Header from "../components/Header";
import NotFound from "../pages/NotFound";
import "leaflet/dist/leaflet.css";

export default function App() {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true); // ⏳ état de chargement
  const [error, setError] = useState(null); // ❌ état d'erreur

  const fetchWeatherData = async () => {
    try {
      const response = await fetch(
        "https://data-real-time-6.onrender.com/donnees"
      );
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();

      // ✅ Vérification que les données sont bien un tableau
      if (!Array.isArray(data)) {
        throw new Error("Données invalides : ce n'est pas un tableau");
      }

      setWeatherData(data);
    } catch (error) {
      console.error("Échec du chargement des données météo :", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-black">
      <Header />

      {/* Affichage global d’erreur ou de chargement */}
      {loading ? (
        <p className="text-center mt-20 text-gray-500 text-lg">
          Chargement des données météo...
        </p>
      ) : error ? (
        <p className="text-center mt-20 text-red-500 text-lg">
          Erreur : {error}
        </p>
      ) : (
        <main className=" ">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/live-data" element={<LiveData />} />
            <Route path="/map" element={<MapView data={weatherData} />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      )}
    </div>
  );
}
