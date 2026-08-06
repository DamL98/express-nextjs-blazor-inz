function buildUrl(apiBaseUrl, path) {
    return new URL(path.replace(/^\//, ""), apiBaseUrl).toString();
}

const responseBodies = new Map();
let responseSequence = 0;

export async function startApiRequest(
    apiBaseUrl,
    path,
    method,
    token,
    body) {
    const headers = {
        Accept: "application/json, application/problem+json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (body !== null) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(buildUrl(apiBaseUrl, path), {
        method,
        credentials: "include",
        headers,
        body,
    });
    const responseBody = new Uint8Array(await response.arrayBuffer());
    const responseId = `${Date.now()}-${responseSequence += 1}`;

    responseBodies.set(responseId, responseBody);

    return {
        responseId,
        statusCode: response.status,
        contentType: response.headers.get("content-type"),
        bodyLength: responseBody.byteLength,
    };
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
