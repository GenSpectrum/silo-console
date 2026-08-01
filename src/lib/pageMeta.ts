import { useEffect } from 'react';

const DEFAULT_DESCRIPTION = 'RhyDB is a high-performance analytical database for sequence alignment data.';

export function usePageMeta(title?: string, description = DEFAULT_DESCRIPTION) {
    useEffect(() => {
        document.title = title ? `${title} | RhyDB` : 'RhyDB | Analytical database for sequence alignment data';
        const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
        if (meta) meta.content = description;

        return () => {
            document.title = 'RhyDB | Analytical database for sequence alignment data';
            if (meta) meta.content = DEFAULT_DESCRIPTION;
        };
    }, [description, title]);
}
