import { useEffect } from 'react';

const DEFAULT_DESCRIPTION = 'SILO is a high-performance analytical database for sequence alignment data.';

export function usePageMeta(title?: string, description = DEFAULT_DESCRIPTION) {
    useEffect(() => {
        document.title = title ? `${title} | SILO` : 'SILO | Analytical database for sequence alignment data';
        const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
        if (meta) meta.content = description;

        return () => {
            document.title = 'SILO | Analytical database for sequence alignment data';
            if (meta) meta.content = DEFAULT_DESCRIPTION;
        };
    }, [description, title]);
}
