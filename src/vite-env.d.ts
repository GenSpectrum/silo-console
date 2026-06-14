/// <reference types="vite/client" />

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'nightingale-manager': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
            'nightingale-navigation': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
                'height'?: string | number;
                'length'?: number;
                'width'?: number;
                'display-start'?: string | number;
                'display-end'?: string | number;
                'margin-left'?: string | number;
            };
            'nightingale-msa': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
                'ref'?: React.Ref<HTMLElement>;
                'length'?: number;
                'width'?: number;
                'height'?: number;
                'label-width'?: string | number;
                'color-scheme'?: string;
                'display-start'?: string | number;
                'display-end'?: string | number;
            };
        }
    }
}
