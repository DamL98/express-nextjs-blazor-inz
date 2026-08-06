function buildUrl(apiBaseUrl, path) {
    return new URL(path.replace(/^\//, ""), apiBaseUrl).toString();
}

async function apiRequest(apiBaseUrl, path, options = {}) {
    const response = await fetch(buildUrl(apiBaseUrl, path), {
        method: options.method ?? "GET",
        credentials: "include",
        headers: {
            Accept: "application/json, application/problem+json",
            "Content-Type": "application/json",
        },
    });

    let payload = null;

    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok || payload?.success !== true) {
        return {
            success: false,
            statusCode: response.status,
            errorCode: payload?.code ?? payload?.type ?? `HTTP_${response.status}`,
            errorMessage: payload?.detail ?? payload?.title ?? "Blad API",
        };
    }

    return {
        success: true,
        statusCode: response.status,
        data: payload.data,
    };
}

export function redirectToGoogleLogin(apiBaseUrl, redirectTo) {
    const url = new URL("auth/google/start", apiBaseUrl);
    url.searchParams.set("redirectTo", redirectTo);
    window.location.assign(url.toString());
}

export function getCurrentUser(apiBaseUrl) {
    return apiRequest(apiBaseUrl, "auth/me");
}

export function logout(apiBaseUrl) {
    return apiRequest(apiBaseUrl, "auth/logout", {
        method: "POST",
    });
}

export function confirmAction(message) {
    return window.confirm(message);
}
