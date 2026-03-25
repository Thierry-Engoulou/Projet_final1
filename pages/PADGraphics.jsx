import React, { useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, TimeScale,
} from "chart.js";
import 'chartjs-adapter-date-fns';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, TimeScale);

const API_URL = "https://data-real-time-6.onrender.com/donnees";
const STATION_COLORS = { "SM 2": "rgba(54, 162, 235, 1)", "SM 3": "rgba(255, 99, 132, 1)", "SM 4": "rgba(75, 192, 192, 1)" };
const params_list = ["TIDE_HEIGHT", "WIND_SPEED", "WIND_DIR", "AIR_PRESSURE", "AIR_TEMPERATURE", "DEWPOINT", "HUMIDITY_RELATIVE"];

export default function PADGraphics() {
  const [activeTab, setActiveTab] = useState("1_day");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const [isSynced1d, setIsSynced1d] = useState(false);
  const [isSynced7d, setIsSynced7d] = useState(false);
  const [data1d, setData1d] = useState([]);
  const [data7d, setData7d] = useState([]);
  
  const [lissage, setLissage] = useState(5);
  const [noDownsample, setNoDownsample] = useState(false);
  const [showDataExpander, setShowDataExpander] = useState(false);

  const parseSafeDate = (dateStr) => {
    if (!dateStr) return new Date(NaN);
    return new Date(String(dateStr).replace(" ", "T"));
  };

  // Filtrage IQR (Interquartile Range) pour supprimer les aberrations
  const filterOutliers = (data, field) => {
    const values = data.map(d => d[field]).filter(v => !isNaN(v)).sort((a, b) => a - b);
    if (values.length < 10) return data;
    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];
    // Ajout d'une marge de sécurité (epsilon) pour éviter un IQR de 0 qui supprimerait tout
    const iqr = Math.max(q3 - q1, 0.01);
    const lower = q1 - 3 * iqr; // Multiplicateur 3 pour être un peu plus permissif
    const upper = q3 + 3 * iqr;
    return data.map(d => {
      const v = d[field];
      if (!isNaN(v) && (v < lower || v > upper)) return { ...d, [field]: NaN };
      return d;
    });
  };

  // Modèle Harmonique (Moindres carrés pour signal sinusoïdal)
  const getHarmonicModel = (data, station) => {
    const stationData = data.filter(d => d.Station === station && !isNaN(d.TIDE_HEIGHT));
    if (stationData.length < 10) return null;

    const t0 = stationData[0].DateTime.getTime();
    const omega = (2 * Math.PI) / 12.4206; // Fréquence M2 (heures)
    
    // On construit les sommes pour OLS
    let n = 0, sumC = 0, sumS = 0, sumCC = 0, sumSS = 0, sumCS = 0;
    let sumY = 0, sumYC = 0, sumYS = 0;

    stationData.forEach(d => {
      const th = (d.DateTime.getTime() - t0) / (1000 * 3600); // Temps en heures
      const c = Math.cos(omega * th);
      const s = Math.sin(omega * th);
      const y = d.TIDE_HEIGHT;
      n++; sumC += c; sumS += s; sumCC += c*c; sumSS += s*s; sumCS += c*s;
      sumY += y; sumYC += y*c; sumYS += y*s;
    });

    // Matrice Normale A * Coeffs = B
    const A = [
      [n, sumC, sumS],
      [sumC, sumCC, sumCS],
      [sumS, sumCS, sumSS]
    ];
    const B = [sumY, sumYC, sumYS];

    // Résolution 3x3 (Cramer)
    const det = (m) => 
      m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1]) - 
      m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0]) + 
      m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);

    const D = det(A);
    if (Math.abs(D) < 1e-10) return null;

    const h0 = det([ [B[0], A[0][1], A[0][2]], [B[1], A[1][1], A[1][2]], [B[2], A[2][1], A[2][2]] ]) / D;
    const a = det([ [A[0][0], B[0], A[0][2]], [A[1][0], B[1], A[1][2]], [A[2][0], B[2], A[2][2]] ]) / D;
    const b = det([ [A[0][0], A[0][1], B[0]], [A[1][0], A[1][1], B[1]], [A[2][0], A[2][1], B[2]] ]) / D;

    return (timeMs) => {
        const th = (timeMs - t0) / (1000 * 3600);
        return h0 + a * Math.cos(omega * th) + b * Math.sin(omega * th);
    };
  };

  const cleanData = (chunks) => {
    if (!Array.isArray(chunks)) return [];
    let res = chunks.map(d => ({
      DateTime: parseSafeDate(d.DateTime || d["DATE/TIME"] || d.Datetime || d.date),
      Station: d["STATION NAME"] || d.Station || d.station || "Inconnue",
      TIDE_HEIGHT: parseFloat(d["TIDE HEIGHT"] || d["TIDE_HEIGHT"] || d.TIDE_HEIGHT || d.tide_height),
      WIND_SPEED: parseFloat(d["WIND SPEED"] || d["WIND_SPEED"] || d.WIND_SPEED || d.wind_speed),
      WIND_DIR: parseFloat(d["WIND DIR"] || d["WIND_DIR"] || d.WIND_DIR || d.wind_dir),
      AIR_PRESSURE: parseFloat(d["AIR PRESSURE"] || d["AIR_PRESSURE"] || d.AIR_PRESSURE || d.air_pressure),
      AIR_TEMPERATURE: parseFloat(d["AIR TEMPERATURE"] || d["AIR_TEMPERATURE"] || d.AIR_TEMPERATURE || d.air_temperature),
      DEWPOINT: parseFloat(d.DEWPOINT || d.Dewpoint || d.dewpoint),
      HUMIDITY_RELATIVE: parseFloat(d.HUMIDITY || d.HUMIDITY_RELATIVE || d.humidity || d.humidity_relative)
    })).filter(d => d.DateTime && !isNaN(d.DateTime.getTime()));
    
    // Filtrage IQR pour chaque paramètre
    ["TIDE_HEIGHT", "WIND_SPEED", "AIR_PRESSURE", "AIR_TEMPERATURE", "DEWPOINT", "HUMIDITY_RELATIVE"].forEach(f => {
        res = filterOutliers(res, f);
    });

    res.sort((a, b) => a.DateTime - b.DateTime);
    return res;
  };

  const fetchSync = async (targetDays) => {
    setLoading(true);
    setStatusMsg(`🔄 Synchronisation Scientifique en cours...`);
    try {
      let raw = [];
      if (targetDays === 1) {
        const resp = await axios.get(API_URL, { params: { limit: 1500 } });
        raw = Array.isArray(resp.data) ? resp.data : (resp.data?.data || []);
      } else {
        const start = new Date(); start.setDate(start.getDate() - 7);
        const promises = [];
        for (let i = 0; i <= 7; i++) {
          let cs = new Date(start); cs.setDate(start.getDate() + i);
          let ce = new Date(cs); ce.setDate(cs.getDate() + 1);
          promises.push(axios.get(API_URL, { params: { limit: 4000, start: cs.toISOString().split('T')[0], end: ce.toISOString().split('T')[0] } }).catch(() => ({ data: [] })));
        }
        const resps = await Promise.all(promises);
        resps.forEach(r => raw = raw.concat(Array.isArray(r.data) ? r.data : (r.data?.data || [])));
      }

      const cleaned = cleanData(raw);
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - targetDays);
      const filtered = cleaned.filter(d => d.DateTime >= cutoff);

      if (targetDays === 1) { setData1d(filtered); setIsSynced1d(true); }
      else { setData7d(filtered); setIsSynced7d(true); }
      
      setStatusMsg(`✅ Succès : ${filtered.length} lignes récupérées et filtrées.`);
    } catch (err) {
      setStatusMsg("❌ Erreur de synchronisation.");
    } finally {
      setLoading(false);
    }
  };

  const applyRollingMean = (data, p) => {
    let res = [];
    const win = parseInt(lissage);
    for (let i = 0; i < data.length; i++) {
      let sum = 0; let count = 0;
      for (let j = Math.max(0, i - Math.floor(win / 2)); j <= Math.min(data.length - 1, i + Math.floor(win / 2)); j++) {
        if (!isNaN(data[j][p])) { sum += data[j][p]; count++; }
      }
      res.push({ ...data[i], display_val: count > 0 ? sum / count : null });
    }
    return res;
  };

  const renderGraphs = (dataArray) => {
    if (dataArray.length === 0) return null;
    const limitData = noDownsample ? dataArray : dataArray.filter((_, i) => i % Math.ceil(dataArray.length / 1500) === 0);

    return params_list.map(p => {
      const stations = [...new Set(limitData.map(d => d.Station))];
      const datasets = [];

      stations.forEach(st => {
        const dSt = limitData.filter(d => d.Station === st);
        const col = STATION_COLORS[st] || "white";

        if (p === "TIDE_HEIGHT") {
          const modelFunc = getHarmonicModel(dSt, st);
          if (modelFunc) {
            // Courbe Sinusoïdale (Ligne)
            datasets.push({
              label: `${st} (Modèle)`,
              data: dSt.map(d => ({ x: d.DateTime, y: modelFunc(d.DateTime.getTime()) })),
              borderColor: col, borderWidth: 3, pointRadius: 0, showLine: true, tension: 0.4
            });
          }
          // Données Brutes (Points)
          datasets.push({
            label: `${st} (Brut)`,
            data: dSt.map(d => ({ x: d.DateTime, y: d.TIDE_HEIGHT })),
            borderColor: col, backgroundColor: col, borderWidth: 0, pointRadius: 3, showLine: false
          });
        } else {
          const processed = applyRollingMean(dSt, p);
          datasets.push({
            label: st,
            data: processed.map(d => ({ x: d.DateTime, y: d.display_val })),
            borderColor: col, borderWidth: 2, pointRadius: 0, showLine: true, tension: 0.2
          });
        }
      });

      const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

      return (
        <div key={p} className={`mb-10 p-6 rounded-2xl shadow-lg border ${p === "TIDE_HEIGHT" ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-200 text-black"}`}>
          <Line options={{ 
            responsive: true, animation: false,
            plugins: { 
                title: { display: true, text: `${p.replace("_", " ")} - ${today}`, color: p==='TIDE_HEIGHT'?'white':'black', font: { size: 18, weight: 'bold' } },
                legend: { labels: { color: p==='TIDE_HEIGHT'?'white':'black' } }
            },
            scales: { 
              x: { type: 'time', ticks: { color: p==='TIDE_HEIGHT'? '#ccc':'#333' } }, 
              y: { ticks: { color: p==='TIDE_HEIGHT'? '#ccc':'#333'} } 
            }
          }} data={{ datasets }} />
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-white bg-slate-950">
      {/* SIDEBAR */}
      <div className="w-full md:w-80 bg-slate-900 p-6 border-r border-slate-800">
        <h2 className="text-2xl font-bold mb-6">Météo Douala</h2>
        <div className="w-full h-px bg-slate-800 mb-6"></div>
        <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-widest">Contrôles</h3>
        <label className="block text-sm mb-2 text-gray-400">Lissage du vent/temp ({lissage})</label>
        <input type="range" min="1" max="51" step="2" value={lissage} onChange={e => setLissage(e.target.value)} className="w-full mb-6" />
        <label className="flex items-center gap-2 text-sm mb-8 cursor-pointer hover:text-white transition-colors">
          <input type="checkbox" checked={noDownsample} onChange={e => setNoDownsample(e.target.checked)} />
          Haute Résolution (Sans échantillonnage)
        </label>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-slate-950">
        <h1 className="text-4xl font-extrabold mb-8 tracking-tight text-white">Visualisation Scientifique PAD</h1>
        
        <div className="flex gap-10 border-b border-slate-800 mb-10 text-lg font-bold">
          <button className={`pb-4 transition-all ${activeTab === '1_day' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`} onClick={() => setActiveTab('1_day')}>Aujourd'hui</button>
          <button className={`pb-4 transition-all ${activeTab === '7_days' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`} onClick={() => setActiveTab('7_days')}>7 derniers jours</button>
        </div>

        {statusMsg && <div className="mb-8 p-5 bg-blue-900/20 border border-blue-500/30 text-blue-300 font-bold rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            {statusMsg}
        </div>}

        <div className="space-y-12">
          <section>
            <h3 className="text-xl font-bold mb-4 opacity-80 uppercase tracking-widest text-sm">Action</h3>
            <button 
                onClick={() => fetchSync(activeTab === '1_day' ? 1 : 7)} 
                disabled={loading}
                className={`px-12 py-4 rounded-xl font-black text-lg shadow-xl shadow-blue-500/10 transition-all active:scale-95 ${loading ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
            >
              {loading ? "CHARGEMENT EN COURS..." : `SYNCHRONISER ${activeTab === '1_day' ? '1 JOUR' : '7 JOURS'}`}
            </button>
          </section>

          {((activeTab === '1_day' && isSynced1d) || (activeTab === '7_days' && isSynced7d)) && (
            <section className="animate-in fade-in zoom-in-95 duration-500">
               <div className="w-full h-px bg-slate-800 mb-12"></div>
               <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black italic tracking-tighter">ANALYSE GRAPHIQUE</h3>
                    <button onClick={() => setShowDataExpander(!showDataExpander)} className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-2 border border-slate-800 rounded-full">
                        {showDataExpander ? "Cacher l'aperçu" : "Aperçu Technique"}
                    </button>
               </div>
               
               {showDataExpander && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-12 overflow-x-auto shadow-inner">
                    <table className="w-full text-xs font-mono text-left">
                      <thead><tr className="text-slate-600 border-b border-slate-800 uppercase tracking-tighter text-[10px]"><th className="p-3">DateTime</th><th className="p-3">Station</th><th className="p-3">Maree (m)</th><th className="p-3">Air Temp (°C)</th></tr></thead>
                      <tbody>
                        {(activeTab === '1_day' ? data1d : data7d).slice(0, 10).map((r, i) => (
                           <tr key={i} className="border-b border-slate-800/50 hover:bg-white/5"><td className="p-3 text-blue-400">{r.DateTime.toLocaleString()}</td><td className="p-3 font-bold text-white">{r.Station}</td><td className="p-3">{r.TIDE_HEIGHT}</td><td className="p-3">{r.AIR_TEMPERATURE}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               )}

                <div className="grid grid-cols-1 gap-8">
                  {renderGraphs(activeTab === '1_day' ? data1d : data7d)}
               </div>

               {/* FOOTER DOWNLOAD */}
               <div className="mt-20 p-10 bg-blue-600 rounded-3xl text-center shadow-2xl shadow-blue-500/20">
                  <h3 className="text-2xl font-black mb-4">Besoin des données brutes ?</h3>
                  <p className="text-blue-100 mb-8 max-w-2xl mx-auto">Pour télécharger les relevés complets au format Excel ou NetCDF, veuillez utiliser notre portail sécurisé de téléchargement.</p>
                  <a 
                    href="https://padgrah.onrender.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-white text-blue-600 px-10 py-4 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
                  >
                    🚀 CLIQUER ICI POUR TÉLÉCHARGER
                  </a>
               </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
