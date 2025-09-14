import { BiSolidUser } from 'react-icons/bi';
import {SlSocialGithub} from 'react-icons/sl'
import ThemeToggle from './ThemeToggle';
export default function TopBar() {

    return (
        <header className='p-5 bg-surface-light dark:bg-surface-dark text-card-light'>
            <div className='container  mx-auto flex items-center justify-between'>
                <span className='rounded-2xl bg-slate-800 p-3 cursor-pointer'>
                    <SlSocialGithub />
                </span>
                <h3>BREATHESAFE+</h3>
                <div className='flex gap-2 items-center'>
                    <span className='rounded-2xl bg-slate-800 p-3 cursor-pointer'>
                        <BiSolidUser />
                    </span>
                    <span className='rounded-2xl bg-slate-800 p-3 cursor-pointer'>
                        <ThemeToggle />
                    </span>
                </div>
            </div>
        </header>
    );
}