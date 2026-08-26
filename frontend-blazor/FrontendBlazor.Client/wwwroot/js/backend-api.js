const requestControllers = new Map();

export async function sendApiRequest(
    requestId,
    apiBaseUrl,
    path,
    method,
    body) {
    const controller = new AbortController();
    requestControllers.set(requestId, controller);

    try {
        const response = await fetch(
            new URL(path.replace(/^\//, ""), apiBaseUrl),
            {
                method,
                credentials: "include",
                headers: {
                    Accept: "application/json, application/problem+json",
                    ...(body === null ? {} : { "Content-Type": "application/json" }),
                },
                body,
                signal: controller.signal,
            });

        return {
            statusCode: response.status,
            body: await response.text(),
        };
    } finally {
        requestControllers.delete(requestId);
    }
}

export function cancelApiRequest(requestId) {
    requestControllers.get(requestId)?.abort();
}
