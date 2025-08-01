import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BiSolidThermometer,
  BiWater,
  BiWind,
  BiTachometer,
  BiChevronDown,
  BiChevronUp,
} from "react-icons/bi";

export default function ForecastPage() {
  const [data, setData] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [filterWithRisk, setFilterWithRisk] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://data-real-time-6.onrender.com/previsions");
        let text = await res.text();
        text = text.replace(/\bNaN\b/g, "null");
        const parsed = JSON.parse(text);

        if (parsed.status === "success" && Array.isArray(parsed.data)) {
          setData(parsed.data);
        } else {
          throw new Error("Format inattendu");
        }
      } catch (err) {
        console.error("Erreur lors du chargement :", err);
      }
    };

    fetchData();
  }, []);

  // Filtre optionnel: garder que les jours avec un risque de précipitation > 0%
  const filteredData = filterWithRisk
    ? data.filter((d) => {
        const risk = d.precipitation_Risk || "0%";
        // Extraire chiffre et vérifier > 0
        const val = parseInt(risk.replace("%", ""), 10);
        return val > 0;
      })
    : data;

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black p-6 text-white">
      <h1 className="text-4xl font-bold text-center mb-8">Prévisions Météo</h1>

      <div className="flex justify-center mb-6">
        <button
          onClick={() => setFilterWithRisk((v) => !v)}
          className={`px-6 py-2 rounded-full font-semibold transition-colors duration-300 ${
            filterWithRisk
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {filterWithRisk
            ? "Afficher toutes les journées"
            : "Afficher seulement les jours avec risque"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredData.length === 0 && (
            <motion.p
              key="no-data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full text-center text-gray-300 mt-16"
            >
              Aucune donnée à afficher.
            </motion.p>
          )}

          {filteredData.map((item, index) => {
            const isExpanded = expandedIndex === index;

            return (
              <motion.div
                key={item.days + index}
                className="bg-white/10 rounded-xl shadow-lg p-5 cursor-pointer select-none"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{item.days}</h2>
                  {isExpanded ? (
                    <BiChevronUp size={24} />
                  ) : (
                    <BiChevronDown size={24} />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm sm:text-base">
                  <div className="flex items-center gap-2">
                    <BiSolidThermometer size={20} className="text-yellow-400" />
                    <span>{item["AIR TEMPERATURE"] || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BiWater size={20} className="text-cyan-400" />
                    <span>{item["HUMIDITY"] || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BiWind size={20} className="text-indigo-400" />
                    <span>{item["WIND"] ? `${item["WIND"]} km/h` : "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BiTachometer size={20} className="text-green-400" />
                    <span>
                      {item["TIDE HEIGHT"] ? `${item["TIDE HEIGHT"]} m` : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="font-semibold">
                      Risque de précipitation :
                    </span>{" "}
                    <span>{item.precipitation_Risk || "N/A"}</span>
                  </div>
                </div>

                {isExpanded && item.Expert_Analysis && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-3 bg-white/20 rounded-md text-sm whitespace-pre-line"
                  >
                    <strong>Analyse experte :</strong>
                    <p className="mt-1">{item.Expert_Analysis}</p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
