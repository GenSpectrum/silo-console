import type { ReactNode } from 'react';

export function contextualNavClass({ isActive }: { isActive: boolean }) {
    const wrapping = 'h-auto min-h-8 whitespace-normal';
    return isActive ? `${wrapping} bg-primary/12 font-semibold text-primary` : wrapping;
}

export default function ContextualSidebar({
    label,
    navigation,
    children,
}: {
    label: string;
    navigation: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className='contextual-shell mx-auto grid w-full max-w-7xl gap-5 px-4 py-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:px-6 lg:py-10'>
            <aside className='contextual-aside'>
                <details className='collapse border border-base-300 bg-base-200 lg:hidden'>
                    <summary className='collapse-title min-h-0 py-3 font-semibold'>{label}</summary>
                    <div className='collapse-content px-2 pb-2'>{navigation}</div>
                </details>
                <nav className='sticky top-24 hidden lg:block' aria-label={label}>
                    {navigation}
                </nav>
            </aside>
            <div className='contextual-content min-w-0'>{children}</div>
        </div>
    );
}
