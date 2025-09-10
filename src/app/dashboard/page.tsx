import GuageMeterList from "@/components/GuageMeterLists";
import Hero from "@/components/Hero";
import AirQualityIndexChart from "@/components/AirQualityIndexChart";

export default function Dashboard(){
    return(
        <section>
            <Hero />
            <GuageMeterList />
            <AirQualityIndexChart />
        </section>
    );
}