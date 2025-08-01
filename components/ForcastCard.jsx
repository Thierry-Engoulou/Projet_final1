import {
  BiSolidThermometer,
  BiWater,
  BiWind,
  BiTachometer,
} from "react-icons/bi";

export default function ForcastCard({ data }) {
  const temperature = parseFloat(data["AIR TEMPERATURE"]);
  const humidity = parseFloat(data["HUMIDITY"]);
  const windSpeed = data["WIND"];
  const tideHeight = data["TIDE HEIGHT"];

  return (
    <div className="bg-transparent backdrop-blur-xl shadow-md items-center rounded-lg p-4 text-gray-100 grid grid-cols-2 gap-4 w-[15rem]">
      <div className="col-span-2 text-center text-lg font-bold">
        {data["days"]}
      </div>

      <div className="text-center flex items-center flex-col">
        <BiSolidThermometer />{" "}
        {isNaN(temperature) ? "N/A" : `${temperature} °C`}
      </div>

      <div className="text-center flex items-center flex-col">
        <BiWater /> {isNaN(humidity) ? "N/A" : `${humidity} %`}
      </div>

      <div className="text-center flex items-center flex-col">
        <BiWind /> {windSpeed != null ? `${windSpeed} km/h` : "N/A"}
      </div>

      <div className="text-center flex items-center flex-col">
        <BiTachometer /> {tideHeight != null ? `${tideHeight} m` : "N/A"}
      </div>
    </div>
  );
}
