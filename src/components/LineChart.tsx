type LineChartProps = {
    title: string,
    pollutant: string,
    value: number
}
export default function LineChart({title, pollutant, value} : LineChartProps){
    return (
        <div className="bg-surface-light dark:bg-surface-dark">
            <h2 className="mb-4">Title</h2>
            
        </div>
    );
}