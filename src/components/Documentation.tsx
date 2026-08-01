import type { ReactNode } from 'react';
import { usePageMeta } from '../lib/pageMeta';

export function DocumentationPage({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
    usePageMeta(title);

    return (
        <article className='documentation-page prose-rhydb w-full max-w-4xl text-[15px] leading-relaxed'>
            <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
            {lead && <p className='mt-3 text-lg leading-relaxed text-base-content/65'>{lead}</p>}
            <div className='mt-8'>{children}</div>
        </article>
    );
}

export function CodeBlock({ children }: { children: ReactNode }) {
    return (
        <pre className='my-4 overflow-x-auto rounded-box border border-base-300 bg-neutral p-4 text-sm leading-6 text-neutral-content'>
            <code>{children}</code>
        </pre>
    );
}

export function Note({ children, title = 'Note' }: { children: ReactNode; title?: string }) {
    return (
        <div className='my-5 alert items-start border-info/25 bg-info/8 text-base-content'>
            <span className='mt-0.5 text-info'>●</span>
            <div>
                <div className='font-semibold'>{title}</div>
                <div className='mt-1 text-sm leading-relaxed text-base-content/70'>{children}</div>
            </div>
        </div>
    );
}

export function ReferenceItem({
    id,
    name,
    description,
    children,
}: {
    id?: string;
    name: string;
    description: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className='scroll-mt-24 border-t border-base-300 py-5 first:border-t-0 first:pt-0' id={id}>
            <h3 className='text-base font-semibold'>
                <code>{name}</code>
            </h3>
            <div className='mt-1 text-sm text-base-content/70'>{description}</div>
            <CodeBlock>{children}</CodeBlock>
        </section>
    );
}
