import GuageMeterList from "@/components/GuageMeterLists";
import Hero from "@/components/Hero";
import AirQualityIndexChart from "@/components/AirQualityIndexChart";
import ParameterChartList from "@/components/ParameterChartList";
import { BiArrowBack } from "react-icons/bi";
import Link from "next/link";
import ChartCard from "@/components/ChartCard";

export default function AdvancedDashboard(){
    return(
        <section className="w-[95vw] relative mx-auto overflow-hidden px-4">
            <Link 
                href={"/"}
                about="Simple Dashboard"
            >
                <button className="absolute top-5 left-0 bg-surface-light dark:bg-surface-dark shadow-lg rounded-2xl p-4 text-xl font-extrabold cursor-pointer">
                    <BiArrowBack className="cursor-pointer" />
                </button>
            </Link>
            <Hero />
            <GuageMeterList />
            <ChartCard title="Air Quality Index" unit="AQI" endpoint="/api/sensor/aqi" />
            <ParameterChartList />
        </section>
    );
}