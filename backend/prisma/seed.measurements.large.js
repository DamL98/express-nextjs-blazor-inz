import { runMeasurementSeedFromCli } from "./seed.measurements.medium.js";

await runMeasurementSeedFromCli({
  name: "LARGE",
  roomCount: 100,
  reservationCount: 400,
});
