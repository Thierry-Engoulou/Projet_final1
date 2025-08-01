import { useLocation, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import logo from "../src/assets/images/logoPAD.jpg";


export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };
  const location = useLocation();
  const menuRef = useRef(null);
  // Close the menu when clicking outside of it
  // This effect adds an event listener to the document to handle clicks outside the menu

  useEffect(() => {
    // Close the menu when the route changes
    setIsOpen(false);
  }, [location.pathname]);

  // set the document title based on the current route
  useEffect(() => {
    const titles = {
      "/": "Home",
      "/map": "Map View",
      "/live-data": "Live Data",
      "/forecast": "Forecast",
      "/alerts": "Alerts",
    };
    document.title = `Meteo PAD - ${titles[location.pathname]}`;
  }, [location.pathname]);
  return (
    <header className="bg-slate-900 flex h-[80px] sticky z-10 top-0 justify-between items-center px-2 py-4 text-white">
      <div>
        <figure className=" ">
          <img
            className="aspect-square w-11 rounded-lg"
            src={logo}
            alt=""
          />
        </figure>
        <p className="hidden md:block">Check the weather in your area</p>
      </div>
      <nav className=" flex items-center w-1/2  justify-end">
        {/*         burger menu for mobile view
         */}{" "}
        <button className="md:hidden ml-4" onClick={toggleMenu}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={4}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
        {isOpen && (
          <ul
            ref={menuRef}
            className={`md:hidden z-20 divide-y absolute bg-transparent backdrop-blur-sm duration-300 bg-blend-multiply space-y-2 h-[12rem] w-[95%] top-[4.5rem] p-2 flex items-center flex-col text-white `}
          >
            <li>
              <Link to="/" className="">
                Home
              </Link>
            </li>
            <li>
              <Link to="/map">Map View</Link>
            </li>
            <li>
              <Link to="/live-data">Live Data</Link>
            </li>
            <li>
              <Link to="/forecast">Forecast</Link>
            </li>
            <li>
              <Link to="/alerts">Alerts</Link>
            </li>
          </ul>
        )}
        <ul className={`hidden z-10 md:flex md:space-x-4 p-1`}>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/map">Map View</Link>
          </li>
          <li>
            <Link to="/live-data">Live Data</Link>
          </li>
          <li>
            <Link to="/forecast">Forecast</Link>
          </li>
          <li>
            <Link to="/alerts">Alerts</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
