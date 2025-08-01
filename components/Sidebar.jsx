import { useLocation, Link } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => {
    setIsOpen(!isOpen);
    console.log(isOpen);
  };
  const location = useLocation();
  const menuRef = useRef(null);
  // Close the menu when clicking outside of it
  // This effect adds an event listener to the document to handle clicks outside the menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    <aside className="md:col-span-3 bg-blue-900 fixed h-screen top-0">
      <div>
        <h1>Weather App</h1>
        <p className="hidden md:block">Check the weather in your area</p>
      </div>
      <nav className=" flex items-center w-1/2 flex justify-end">
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
            className={`md:hidden z-10 divide-y absolute bg-black duration-300 bg-blend-multiply space-y-2 h-[12rem] w-[95%] top-[4rem] p-2 flex items-center flex-col text-white `}
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
    </aside>
  );
}
