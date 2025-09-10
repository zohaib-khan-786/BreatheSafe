"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { BiSolidMoon, BiSolidSun } from "react-icons/bi";

export default function ThemeToggle(){
    const {theme, setTheme} = useTheme();
    console.log(theme);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if(!mounted) return null;

    return (
        <span
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="m-0 p-0"
        >
            {theme === "dark" ? <BiSolidSun /> : <BiSolidMoon />}
        </span>
    );

}