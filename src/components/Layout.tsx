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
        <div className='drawer h-dvh lg:drawer-open'>
            <input
                id='app-drawer'
                type='checkbox'
                className='drawer-toggle'
                checked={menuOpen}
                onChange={(event) => setMenuOpen(event.target.checked)}
            />
            <div className='drawer-content flex min-h-0 flex-col'>
                <header className='navbar min-h-15 flex-none border-b border-base-300 bg-base-100 px-3 lg:px-5'>
                    <button
                        type='button'
                        className='btn mr-1 btn-square btn-ghost btn-sm lg:hidden'
                        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
                        aria-expanded={menuOpen}
                        aria-controls='sidebar-navigation'
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        {menuOpen ? <CloseIcon /> : <MenuIcon />}
                    </button>
                    <div className='flex shrink-0 items-center gap-2'>
                        <img className='h-8 w-auto' src={logoUrl} alt='' aria-hidden='true' />
                        <span className='text-lg font-bold tracking-wide'>SILO</span>
                        <span className='hidden text-xs text-base-content/60 sm:inline'>genomic query console</span>
                    </div>
                    <div className='ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 pl-3'>
                        <label className='hidden text-xs text-base-content/60 sm:block' htmlFor='server'>
                            Server
                        </label>
                        <input
                            id='server'
                            className='input w-full min-w-0 input-sm sm:max-w-md'
                            type='url'
                            value={server}
                            spellCheck={false}
                            aria-label='SILO server URL'
                            placeholder='https://gs-staging-1.int.genspectrum.org/open/v2/silo'
                            onChange={(event) => setServer(event.target.value)}
                        />
                    </div>
                </header>
                <main className='min-h-0 flex-1 overflow-y-auto p-4 lg:p-6'>{children}</main>
            </div>
            <div className='drawer-side z-50 lg:z-auto'>
                <label htmlFor='app-drawer' aria-label='Close navigation' className='drawer-overlay' />
                <Sidebar onNavigate={() => setMenuOpen(false)} />
            </div>
        </div>
    );
}

function MenuIcon() {
    return (
        <svg
            viewBox='0 0 24 24'
            width='22'
            height='22'
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
            width='22'
            height='22'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
        >
            <path d='M6 6l12 12M18 6L6 18' />
        </svg>
    );
}
