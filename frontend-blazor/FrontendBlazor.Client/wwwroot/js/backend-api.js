function buildUrl(apiBaseUrl, path) {
    return new URL(path.replace(/^\//, ""), apiBaseUrl).toString();
}

const requestTimeoutMs = 15_000;
const responseBodies = new Map();
const requestControllers = new Map();
const cancelledRequests = new Set();

export async function startApiRequest(
    requestId,
    apiBaseUrl,
    path,
    method,
    body) {
    const headers = {
        Accept: "application/json, application/problem+json",
    };

    if (body !== null) {
        headers["Content-Type"] = "application/json";
    }

    const controller = new AbortController();
    requestControllers.set(requestId, controller);

    if (cancelledRequests.delete(requestId)) {
        controller.abort("API_CANCELLED");
    }

    const timeoutId = setTimeout(
        () => controller.abort("API_TIMEOUT"),
        requestTimeoutMs);
    let response;
    let responseBody;

    try {
        response = await fetch(buildUrl(apiBaseUrl, path), {
            method,
            credentials: "include",
            headers,
            body,
            signal: controller.signal,
        });
        responseBody = new Uint8Array(await response.arrayBuffer());
    } catch (error) {
        if (controller.signal.reason === "API_TIMEOUT") {
            throw new Error("API_TIMEOUT");
        }

        if (controller.signal.aborted) {
            throw new Error("API_CANCELLED");
        }

        throw error;
    } finally {
        clearTimeout(timeoutId);
        requestControllers.delete(requestId);
    }
    const responseId = requestId;

    responseBodies.set(responseId, responseBody);

    return {
        responseId,
        statusCode: response.status,
        contentType: response.headers.get("content-type"),
    };
}

export function cancelApiRequest(requestId) {
    const controller = requestControllers.get(requestId);

    if (controller) {
        controller.abort("API_CANCELLED");
    } else {
        cancelledRequests.add(requestId);
        setTimeout(() => cancelledRequests.delete(requestId), requestTimeoutMs);
    }

    responseBodies.delete(requestId);
}

export function getApiResponseBody(responseId) {
    const responseBody = responseBodies.get(responseId);

    if (!responseBody) {
        throw new Error(`Nie znaleziono odpowiedzi API: ${responseId}`);
    }

    return responseBody;
}

export function releaseApiResponse(responseId) {
    responseBodies.delete(responseId);
}
