export function getXsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export async function apiFetch(url: string, method = 'POST', body?: object): Promise<Response> {
    return fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-XSRF-TOKEN': getXsrfToken(),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
}

export async function apiGet(url: string): Promise<Response> {
    return fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-XSRF-TOKEN': getXsrfToken(),
        },
    });
}
