import { type ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logoUrl from '../rhydb-logo-white.png';

const navigation = [
    { to: '/', label: 'Home', end: true },
    { to: '/docs', label: 'Documentation' },
    { to: '/exercises', label: 'Exercises' },
    { to: '/console', label: 'Console' },
];

function navClass({ isActive }: { isActive: boolean }) {
    return isActive ? 'font-semibold text-primary' : '';
}

export default function Layout({ children }: { children: ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => setMenuOpen(false), [location.pathname]);

    useEffect(() => {
        if (location.hash) {
            requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
            return;
        }
        window.scrollTo(0, 0);
    }, [location.hash, location.pathname]);

    return (
        <div className='site-shell flex min-h-dvh flex-col bg-base-100'>
            <header className='site-header sticky top-0 z-40 border-b border-base-300 bg-base-100/95 backdrop-blur'>
                <div className='site-navbar navbar mx-auto min-h-16 w-full max-w-7xl px-4 lg:px-6'>
                    <div className='navbar-start'>
                        <Link className='site-brand flex items-center hover:no-underline' to='/' aria-label='Home'>
                            <img className='h-10 w-auto' src={logoUrl} alt='' aria-hidden='true' />
                        </Link>
                    </div>
                    <nav className='site-nav navbar-center hidden lg:block' aria-label='Main navigation'>
                        <ul className='menu menu-horizontal gap-1 px-1'>
                            {navigation.map((item) => (
                                <li key={item.to}>
                                    <NavLink to={item.to} end={item.end} className={navClass}>
                                        {item.label}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <div className='navbar-end gap-2'>
                        <a
                            className='btn hidden btn-ghost btn-sm sm:inline-flex'
                            href='https://github.com/GenSpectrum/LAPIS-SILO'
                            target='_blank'
                            rel='noreferrer'
                        >
                            GitHub
                        </a>
                        <button
                            className='btn btn-square btn-ghost lg:hidden'
                            type='button'
                            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((open) => !open)}
                        >
                            {menuOpen ? <CloseIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>
                {menuOpen && (
                    <nav
                        className='border-t border-base-300 bg-base-100 px-4 py-2 lg:hidden'
                        aria-label='Mobile navigation'
                    >
                        <ul className='menu w-full'>
                            {navigation.map((item) => (
                                <li key={item.to}>
                                    <NavLink to={item.to} end={item.end} className={navClass}>
                                        {item.label}
                                    </NavLink>
                                </li>
                            ))}
                            <li className='sm:hidden'>
                                <a href='https://github.com/GenSpectrum/LAPIS-SILO' target='_blank' rel='noreferrer'>
                                    GitHub
                                </a>
                            </li>
                        </ul>
                    </nav>
                )}
            </header>

            <main className='site-content flex-1'>{children}</main>
        </div>
    );
}

function MenuIcon() {
    return (
        <svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' strokeWidth='2'>
            <path d='M4 7h16M4 12h16M4 17h16' />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' strokeWidth='2'>
            <path d='M6 6l12 12M18 6L6 18' />
        </svg>
    );
}
