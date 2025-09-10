import { IoLocationSharp } from "react-icons/io5";
import Dashboard from './dashboard/page';


export default function Home() {
  return (
    <div>
      <header className="bg-card text-text w-full shadow p-4">
          <span className="container mx-auto flex gap-2 items-center font-display font-semibold">
            <IoLocationSharp />
            {"Test Page"}
          </span>
      </header>
      <section>
        <Dashboard />
      </section>
    </div>
  );
}
