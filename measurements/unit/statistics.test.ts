import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sprawdzProbyPomiarowe,
  obliczMediane,
  obliczPrzedzialBootstrap,
  type ProbaPomiarowa,
  type KonfiguracjaPomiaru,
} from "../scripts/statistics";
import { protocolVersion, steps } from "../measurement-config";
const config: KonfiguracjaPomiaru = {
  runId: "unit",
  flow: "read",
  dataset: "small",
  cacheMode: "fresh-context",
  repetitions: 2,
};
function fixture(): ProbaPomiarowa[] {
  return (["next", "blazor"] as const).flatMap((framework) =>
    [0, 1].flatMap((sampleIndex) =>
      steps.read.map((step) => ({
        protocolVersion,
        runId: "unit",
        framework,
        dataset: "small",
        cacheMode: "fresh-context",
        sampleIndex,
        test: step,
        status: "passed",
        retry: 0,
        steps: [
          {
            step,
            durationMs: 10,
            runtime: framework === "next" ? "react-client" : "webassembly",
          },
        ],
      })),
    ),
  );
}
test("complete matrix passes", () =>
  assert.doesNotThrow(() => sprawdzProbyPomiarowe(fixture(), config)));
test("entire missing framework fails", () =>
  assert.throws(
    () =>
      sprawdzProbyPomiarowe(
        fixture().filter((t) => t.framework === "next"),
        config,
      ),
    /Brak/,
  ));
test("partial and failed trials cannot enter a report", () => {
  const records = fixture();
  records[0].status = "failed";
  assert.throws(() => sprawdzProbyPomiarowe(records, config), /zakończona/);
});
test("duplicates and wrong renderer fail", () => {
  const records = fixture();
  assert.throws(
    () => sprawdzProbyPomiarowe([...records, records[0]], config),
    /Powtórzony/,
  );
  records[0].steps[0].runtime = "server";
  assert.throws(() => sprawdzProbyPomiarowe(records, config), /renderer/);
});
test("nonfinite values and out-of-range indices fail", () => {
  let records = fixture();
  records[0].steps[0].durationMs = NaN;
  assert.throws(() => sprawdzProbyPomiarowe(records, config));
  records = fixture();
  records[0].sampleIndex = 2;
  assert.throws(() => sprawdzProbyPomiarowe(records, config));
});
test("median and paired bootstrap preserve a constant difference", () => {
  assert.equal(obliczMediane([9, 1, 5, 3]), 4);
  assert.deepEqual(obliczPrzedzialBootstrap([-5, -5, -5], 1000), {
    low: -5,
    high: -5,
  });
});
