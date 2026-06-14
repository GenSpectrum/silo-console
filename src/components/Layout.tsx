import { type ReactNode, useEffect, useState } from 'react';
import { useServer } from '../server/ServerContext';
import Sidebar from './Sidebar';
import logoUrl from '../silo-logo-icon-only.png';

export default function Layout({ children }: { children: ReactNode }) {
    const { server, setServer } = useServer();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!menuOpen) return undefined;
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [menuOpen]);

    return (
        <div className='app-shell'>
            <header className='app-header'>
                <button
                    className='menu-toggle'
                    aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    {menuOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
                <div className='brand'>
                    <img className='brand-logo' src={logoUrl} alt='' aria-hidden='true' />
                    <span className='brand-name'>SILO</span>
                    <span className='brand-sub'>genomic query console</span>
                </div>
                <label htmlFor='server'>Server:</label>
                <input
                    id='server'
                    type='url'
                    value={server}
                    spellCheck={false}
                    placeholder='https://gs-staging-1.int.genspectrum.org/open/v2/silo'
                    onChange={(e) => setServer(e.target.value)}
                />
            </header>
            <div className='app-body'>
                <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
                <main className='content'>{children}</main>
            </div>
        </div>
    );
}

function MenuIcon() {
    return (
        <svg
            viewBox='0 0 24 24'
            width='26'
            height='26'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
        >
            <path d='M4 7h16M4 12h16M4 17h16' />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg
            viewBox='0 0 24 24'
            width='26'
            height='26'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
        >
            <path d='M6 6l12 12M18 6L6 18' />
        </svg>
    );
}
