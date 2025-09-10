type PollutantCardProps = {
  heading: string;
  details: string[];
  indexes: string[];
  color: { bg: string; solid: string; text: string };
};

export default function PollutantCard({
  heading,
  details,
  indexes,
  color,
}: PollutantCardProps) {
  return (
    <div
      className={`relative flex flex-col justify-center backdrop-blur-3xl rounded-2xl p-2 shadow-lg `}
    >
      {/* Soft glow around the card */}
      <div
        className={`absolute inset-0 rounded-2xl ${color.solid} opacity-20 blur-sm`}
      ></div>

      {/* Card content */}
      <div className="relative grid grid-cols-4 items-stretch justify-between">
        {/* Left: pollutant details */}
        <div className={`${color.solid} ${color.text} p-4 rounded-lg shadow-md col-span-3`}>
          <h2 className="font-bold mb-4">{heading}</h2>
          {details.map((det, idx) => (
            <p className="mb-2 text-sm" key={idx}>{det}</p>
          ))}
        </div>

        {/* Right: indexes */}
        <div className="pt-14 text-right text-sm">
          {indexes.map((data, idx) => (
            <p className="mb-3 text-sm" key={idx}>{data}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
    