import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCloudUploadAlt, FaFilePdf, FaLock, FaUnlock, FaCalendarAlt, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = "https://api-pdf-6s00.onrender.com/api";

export default function ForecastPAD() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedDoc, setSelectedDoc] = useState(null); // Pour le lecteur PDF plein écran

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (password.trim()) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setMessage({ type: "success", text: "✅ Connecté en tant qu'administrateur" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !password) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("fichier", file);

    try {
      await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${password}`,
        },
      });
      setMessage({ type: "success", text: "✅ Bulletin uploadé avec succès !" });
      setFile(null);
      // Reset file input
      document.getElementById("pdf-file-input").value = "";
      fetchDocuments();
    } catch (error) {
      const errMsg = error.response?.data?.erreur || error.response?.data?.message || error.message || "Erreur lors de l'upload";
      setMessage({ type: "error", text: `❌ ${errMsg}` });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 6000);
    }
  };

  // Fix Cloudinary URLs: raw-type URLs need /raw/ replaced with /image/ for inline PDF display
  // New uploads (auto type) already work; old 'raw' uploads need this transform
  const getPdfEmbedUrl = (url) => {
    if (!url) return null;
    // Transform /raw/upload/ to /image/upload/ for proper Content-Type
    let newUrl = url.replace('/raw/upload/', '/image/upload/');
    if (!newUrl.includes('#')) {
      newUrl += '#toolbar=0&navpanes=0';
    }
    return newUrl;
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen text-white">
      {/* ============================================================
          LECTEUR PDF PLEIN ÉCRAN (quand on clique sur un bulletin)
      ============================================================ */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          >
            {/* Barre du lecteur */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <FaFilePdf className="text-red-400 text-xl" />
                <span className="font-semibold text-lg truncate max-w-md">{selectedDoc.nom}</span>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 rounded-full bg-slate-700 hover:bg-red-600 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Affichage du PDF via iframe (sans la barre de téléchargement) */}
            <div className="flex-1 w-full bg-slate-900 flex flex-col items-center relative">
              <iframe
                src={getPdfEmbedUrl(selectedDoc.urlFichier)}
                className="w-full h-full border-none flex-1 bg-white"
                title={selectedDoc.nom}
              />
              {/* Couche de protection transparente pour éviter le clic droit simple sur l'iframe */}
              <div 
                className="absolute inset-x-0 inset-y-0 z-10" 
                onContextMenu={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none' }}
              />
              <div className="p-4 w-full text-center bg-slate-900/90 backdrop-blur-sm shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20">
                <p className="text-gray-300 italic text-sm">Consultation protégée — Reproduction et téléchargement interdits</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          CONTENU PRINCIPAL
      ============================================================ */}
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        {/* En-tête */}
        <header className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Forecast PAD
            </h1>
            <p className="text-gray-400 text-lg">
              Prévisions maritimes officielles — Port Autonome de Douala
            </p>
          </div>

          {/* Bouton Admin (discret) */}
          <button
            onClick={() => (isAdmin ? (setIsAdmin(false), setPassword("")) : setShowAdminLogin(true))}
            title={isAdmin ? "Se déconnecter" : "Accès administrateur"}
            className={`p-3 rounded-full transition-all duration-300 border ${
              isAdmin
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                : "bg-slate-800/50 text-gray-600 border-slate-700 hover:text-gray-400"
            }`}
          >
            {isAdmin ? <FaUnlock /> : <FaLock />}
          </button>
        </header>

        {/* Formulaire de connexion Admin */}
        <AnimatePresence>
          {showAdminLogin && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="mb-10 p-6 rounded-2xl bg-slate-800/60 border border-slate-700 backdrop-blur-sm max-w-sm mx-auto"
            >
              <h2 className="text-lg font-semibold mb-4 text-center">Accès Administrateur</h2>
              <form onSubmit={handleAdminLogin} className="space-y-3">
                <input
                  type="password"
                  placeholder="Mot de passe"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-medium transition-colors"
                  >
                    Entrer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdminLogin(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Panneau d'upload Admin */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border border-blue-500/30"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <FaCloudUploadAlt className="text-blue-400 text-2xl" />
                Publier un nouveau bulletin de prévision
              </h2>
              <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm text-gray-400 mb-2">
                    Fichier PDF du bulletin
                  </label>
                  <input
                    id="pdf-file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2
                      file:bg-blue-600 file:border-none file:text-white file:rounded-md
                      file:px-4 file:py-2 file:mr-4 file:hover:bg-blue-500 file:cursor-pointer
                      file:text-sm cursor-pointer"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold transition-all
                    ${uploading || !file
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-900/40"
                    }`}
                >
                  {uploading ? "Publication en cours..." : "Publier le bulletin"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message de retour (succès / erreur) */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`mb-8 p-4 rounded-xl text-center font-medium ${
                message.type === "success"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                  : "bg-red-500/15 text-red-400 border border-red-500/40"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================
            LISTE DES BULLETINS (pour tous)
        ================================ */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-24 text-center text-gray-500">
            <FaFilePdf className="text-5xl mx-auto mb-4 text-gray-700" />
            <p className="text-lg">Aucun bulletin disponible pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {documents.map((doc, index) => (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all duration-300"
                style={{ background: "rgba(15, 23, 42, 0.7)" }}
              >
                {/* En-tête du bulletin */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-slate-800/50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                      <FaFilePdf className="text-red-400 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-blue-300 transition-colors">
                        {doc.nom}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                        <FaCalendarAlt className="text-xs" />
                        <span>Publié le {formatDate(doc.dateAjout)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bouton pour ouvrir le lecteur plein écran */}
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="hidden md:flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white
                      border border-blue-500/40 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300"
                  >
                    Lire le bulletin
                  </button>
                </div>

                {/* Aperçu PDF intégré via iframe (sans barre téléchargement) */}
                <div className="w-full bg-slate-900 flex flex-col relative group/pdf" style={{ height: "500px" }}>
                  <iframe
                    src={getPdfEmbedUrl(doc.urlFichier)}
                    className="w-full h-full border-none bg-white"
                    title={doc.nom}
                  />
                  {/* Calque pour empêcher le téléchargement direct au survol */}
                  <div 
                    className="absolute inset-x-0 inset-y-0 z-10 pointer-events-none" 
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>

                {/* Pied de bulletin pour mobile */}
                <div className="px-6 py-3 md:hidden border-t border-slate-700/60">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white
                      border border-blue-500/40 py-2 rounded-full text-sm font-semibold transition-all"
                  >
                    Lire le bulletin en plein écran
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
