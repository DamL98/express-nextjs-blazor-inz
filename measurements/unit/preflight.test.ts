import { test } from "node:test";
import assert from "node:assert/strict";
import { checkServices } from "../scripts/preflight";
import { urls } from "../measurement-config";

function responses(): Record<string, unknown> {
  return {
    [`${urls.next}/measurement-info`]: { production: true, api: urls.api, renderer: "react-client" },
    [`${urls.blazor}/measurement-info`]: { production: true, api: urls.api, environment: "Measurement", renderer: "webassembly" },
    [`${new URL(urls.api).origin}/measurement-info`]: { production: true, isolated: true, rateLimitEnabled: false },
    [`${urls.blazor}/appsettings.json`]: { Api: { BaseUrl: "http://localhost:4000/api/v1/" } },
    [`${urls.blazor}/appsettings.Measurement.json`]: { Api: { BaseUrl: `${urls.api}/` } },
  };
}

test("preflight accepts matching measurement profiles including the WASM override", async (context) => {
  const data = responses();
  context.mock.method(globalThis, "fetch", async (url: string) => Response.json(data[url]));
  const result = await checkServices();
  assert.equal(result.api.isolated, true);
});

for (const [name, path, replacement] of [
  ["Next production API", `${urls.next}/measurement-info`, { production: true, api: "http://localhost:4000/api/v1", renderer: "react-client" }],
  ["Blazor host API", `${urls.blazor}/measurement-info`, { production: true, api: "http://localhost:4000/api/v1", environment: "Measurement", renderer: "webassembly" }],
  ["Blazor client API", `${urls.blazor}/appsettings.Measurement.json`, { Api: { BaseUrl: "http://localhost:4000/api/v1/" } }],
  ["missing Blazor override", `${urls.blazor}/appsettings.Measurement.json`, {}],
  ["non-isolated API", `${new URL(urls.api).origin}/measurement-info`, { production: true, isolated: false, rateLimitEnabled: false }],
  ["enabled limiter", `${new URL(urls.api).origin}/measurement-info`, { production: true, isolated: true, rateLimitEnabled: true }],
] as const) {
  test(`preflight rejects ${name} before measurements start`, async (context) => {
    const data = { ...responses(), [path]: replacement };
    context.mock.method(globalThis, "fetch", async (url: string) => Response.json(data[url]));
    await assert.rejects(checkServices());
  });
}
