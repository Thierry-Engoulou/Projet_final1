import { useEffect, useState } from "react";
import { FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { MdHealthAndSafety } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

export default function AlertPage() {
  const [alerts, setAlerts] = useState([]);
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://data-real-time-6.onrender.com/previsions");
        let text = await res.text();
        text = text.replace(/\bNaN\b/g, "null");
        const parsed = JSON.parse(text);

        if (parsed.status === "success" && Array.isArray(parsed.data)) {
          setAlerts(parsed.data);
        } else {
          throw new Error("Format inattendu");
        }
      } catch (err) {
        console.error("Erreur lors du chargement :", err);
      }
    };

    fetchData();
  }, []);

  const filteredAlerts = showOnlyAlerts
    ? alerts.filter((item) => item.Alerte && item.Alerte !== "RAS")
    : alerts;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white p-6">
      <h1 className="text-4xl font-bold text-center mb-6">🚨 Alertes Météo</h1>

      {/* Toggle filtre */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => setShowOnlyAlerts((v) => !v)}
          className={`px-6 py-2 rounded-full font-semibold transition-colors duration-300 ${
            showOnlyAlerts
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {showOnlyAlerts ? "Afficher tout" : "Afficher uniquement les alertes"}
        </button>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredAlerts.length === 0 && (
            <motion.p
              key="no-alerts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full text-center text-gray-400 mt-20"
            >
              Aucune alerte à afficher.
            </motion.p>
          )}

          {filteredAlerts.map((item, index) => {
            const isAlert = item.Alerte && item.Alerte !== "RAS";

            return (
              <motion.div
                key={item.days + index}
                className={`rounded-xl p-6 shadow-xl border-l-8 ${
                  isAlert
                    ? "border-red-500 bg-red-500/10"
                    : "border-green-400 bg-green-400/10"
                }`}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <div className="flex items-center gap-3 mb-4">
                  {isAlert ? (
                    <FaExclamationTriangle className="text-red-400 text-2xl" />
                  ) : (
                    <FaCheckCircle className="text-green-400 text-2xl" />
                  )}
                  <h2 className="text-xl font-semibold">{item.days}</h2>
                </div>

                <p className="text-md mb-4">
                  <span className="font-semibold">Alerte :</span>{" "}
                  <span className={isAlert ? "text-red-300" : "text-green-300"}>
                    {item.Alerte}
                  </span>
                </p>

                {item.Expert_Analysis && (
                  <div className="bg-white/5 border border-white/10 p-4 rounded-md text-sm leading-relaxed space-y-2 flex gap-2">
                    <MdHealthAndSafety className="text-yellow-300 text-lg mt-1 shrink-0" />
                    <p className="whitespace-pre-line">{item.Expert_Analysis}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
