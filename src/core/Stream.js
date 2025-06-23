/**
 * Iterate over decoded `data:` chunks from a Server‑Sent Events stream.
 *
 * @param res Response returned by `fetch` with an SSE body.
 * @example
 * for await (const text of streamSSE(response)) {
 *   console.log(text);
 * }
 */
export async function* streamSSE(res) {
    const reader = res.body?.getReader();
    if (!reader) {
        throw new Error("Response body is not readable");
    }
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
        const { value, done } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        let sepIndex;
        while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
            const chunk = buffer.slice(0, sepIndex);
            buffer = buffer.slice(sepIndex + 2);
            const data = chunk
                .split(/\r?\n/)
                .filter(l => l.startsWith("data:"))
                .map(l => l.slice(5).trim())
                .join("\n");
            if (!data)
                continue;
            if (data === "[DONE]")
                return;
            yield data;
        }
    }
}
