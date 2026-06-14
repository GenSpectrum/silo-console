import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_SERVER } from '../config.js';

const STORAGE_KEY = 'silo-console-server';

const ServerContext = createContext(null);

export function ServerProvider({ children }) {
    const [server, setServerState] = useState(() => {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return stored;
        }
        return DEFAULT_SERVER;
    });

    useEffect(() => {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, server);
    }, [server]);

    const setServer = useCallback((value) => setServerState(value), []);

    // Base URL with trailing slashes trimmed (matches the old console behaviour).
    const getBase = useCallback(() => (server || '').trim().replace(/\/+$/, ''), [server]);

    return <ServerContext.Provider value={{ server, setServer, getBase }}>{children}</ServerContext.Provider>;
}

export function useServer() {
    const ctx = useContext(ServerContext);
    if (!ctx) throw new Error('useServer must be used within a ServerProvider');
    return ctx;
}
