import { pollutantData } from "@/data/pollutants";
import PollutantCard from "./PollutantCard";
import AirQualityChart from "./AirQualityChart";
export default function Hero(){
    return (
        <section className="relative">

            <div className="container mx-auto w-full grid grid-cols-2 items-center ">
                <div className=" relative flex items-center justify-center">
                    <AirQualityChart />
                </div>
                <div>
                    <p className="mb-4">Pollutant | Index Level {"(based on pollutant concentration in mg/mg3)"}</p>
                    <div className="grid grid-cols-3 grid-rows-2 gap-4">
                        {pollutantData.map((item, idx) => (
                            <PollutantCard
                                key={idx}
                                heading={item.heading}
                                details={item.details}
                                indexes={item.indexes}
                                color={item.color}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};  