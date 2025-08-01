import {
  FaCloudSun,
  FaMapMarkedAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import logo from "../src/assets/images/logoPAD.jpg";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] text-gray-100 flex flex-col items-center justify-center p-8">
      <header className="mb-16 text-center flex flex-col items-center max-w-3xl">
        <img
          src={logo}
          alt=""
          className="rounded-full mb-4 w-[50%] aspect-square"
        />
        <h1 className="text-3xl font-extrabold mb-4 drop-shadow-md">
          Bienvenue sur MeteoMarinePAD
        </h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Votre source fiable pour les prévisions météorologiques détaillées,
          les alertes en temps réel, et les analyses expertes. Surveillez les
          conditions atmosphériques, la marée, et les risques liés au climat où
          que vous soyez.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl w-full">
        <FeatureCard
          href={"/forecast"}
          icon={<FaCloudSun size={40} className="text-yellow-400" />}
          title="Prévisions Précises"
          description="Consultez les prévisions météorologiques pour les jours à venir avec des données fiables  et régulièrement mises à jour."
        />
        <FeatureCard
          href={"/map"}
          icon={<FaMapMarkedAlt size={40} className="text-cyan-400" />}
          title="Cartes Interactives"
          description="Visualisez les stations météo du PAD (SM1,SM2,SM3,SM4) sur une carte interactive pour mieux comprendre les conditions locales."
        />
        <FeatureCard
          href={"/alerts"}
          icon={<FaExclamationTriangle size={40} className="text-red-500" />}
          title="Alertes & Conseils"
          description="Recevez des alertes sur les conditions météorologiques dangereuses accompagnées de recommandations d’experts."
        />
      </section>

      <footer className="mt-20 text-center text-gray-400 max-w-md">
        <p>© {new Date().getFullYear()} MeteoExpert. Tous droits réservés.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, href }) {
  return (
    <Link to={href} className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg text-center flex flex-col items-center gap-4 hover:scale-[1.03] transition-transform duration-300 cursor-default">
      <div>{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </Link>
  );
}
