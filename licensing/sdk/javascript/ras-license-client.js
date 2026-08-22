export function canonicalJson(value) {
    if (value === null || typeof value !== "object") {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return `[${value.map(canonicalJson).join(",")}]`;
    }
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

function base64UrlToBytes(value) {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===";
    const raw = atob(padded);
    return Uint8Array.from(raw, char => char.charCodeAt(0));
}

function base64ToBytes(value) {
    const raw = atob(value);
    return Uint8Array.from(raw, char => char.charCodeAt(0));
}

export async function verifyActivationPayload(payload, publicKeyBase64) {
    if (!payload?.signature) return false;

    const unsigned = { ...payload };
    delete unsigned.signature;

    try {
        const key = await crypto.subtle.importKey(
            "raw",
            base64ToBytes(publicKeyBase64),
            { name: "Ed25519" },
            false,
            ["verify"]
        );

        return await crypto.subtle.verify(
            "Ed25519",
            key,
            base64UrlToBytes(payload.signature),
            new TextEncoder().encode(canonicalJson(unsigned))
        );
    } catch {
        return false;
    }
}
