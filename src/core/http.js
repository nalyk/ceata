export async function postJSON(url, headers, body, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        return response;
    }
    finally {
        clearTimeout(timeoutId);
    }
}
