const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

export function withBase(path: string) {
    if (!path.startsWith('/')) return path;
    return `${BASE_PATH}${path}` || '/';
}

export function withoutBase(pathname: string) {
    if (!BASE_PATH || !pathname.startsWith(BASE_PATH)) return pathname;
    return pathname.slice(BASE_PATH.length) || '/';
}
