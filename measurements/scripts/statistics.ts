import { frameworkRuntime, protocolVersion, steps, type Flow } from "../measurement-config";

export type PomiarKroku = { step: string; durationMs: number; runtime: string };

export type ProbaPomiarowa = {
  protocolVersion: number;
  runId: string;
  framework: keyof typeof frameworkRuntime;
  dataset: string;
  cacheMode: string;
  sampleIndex: number;
  test: string;
  status: string;
  retry: number;
  steps: PomiarKroku[];
};

export type KonfiguracjaPomiaru = {
  runId: string;
  flow: Flow;
  dataset: string;
  cacheMode: string;
  repetitions: number;
};

// każda para framework/próba musi mieć dokładnie jeden pomiar każdego kroku
export function sprawdzProbyPomiarowe(proby: ProbaPomiarowa[], config: KonfiguracjaPomiaru) {
  const zarejestrowanePomiary = new Set<string>();

  for (const proba of proby) {
    if (proba.protocolVersion !== protocolVersion || proba.runId !== config.runId ||
        proba.dataset !== config.dataset || proba.cacheMode !== config.cacheMode
      ) {
      throw new Error("Niezgodne metadane próby pomiarowej.");
    }

    if (proba.status !== "passed" || proba.retry !== 0) {
      throw new Error(`Próba nie została zakończona poprawnie: ${proba.test}`);
    }

    if (!Object.hasOwn(frameworkRuntime, proba.framework) || !Number.isInteger(proba.sampleIndex) ||
        proba.sampleIndex < 0 || proba.sampleIndex >= config.repetitions) {
      throw new Error("Nieprawidłowa tożsamość próby pomiarowej.");
    }

    const oczekiwaneKroki = config.flow === "write" ? steps.write : [proba.test];
    if (proba.steps.length !== oczekiwaneKroki.length ||
        proba.steps.some((pomiar, index) => pomiar.step !== oczekiwaneKroki[index])
      ) {
      throw new Error("Niepełna lista kroków próby pomiarowej.");
    }

    for (const pomiar of proba.steps) {
      if (!(steps[config.flow] as readonly string[]).includes(pomiar.step) ||
          pomiar.runtime !== frameworkRuntime[proba.framework] ||
          !Number.isFinite(pomiar.durationMs) || pomiar.durationMs < 0
        ) {
        throw new Error("Nieprawidłowy krok lub renderer.");
      }
      const klucz = `${proba.framework}|${proba.sampleIndex}|${pomiar.step}`;
      if (zarejestrowanePomiary.has(klucz)) throw new Error(`Powtórzony pomiar: ${klucz}`);
      zarejestrowanePomiary.add(klucz);
    }
  }

  for (const framework of Object.keys(frameworkRuntime)) {
    for (let index = 0; index < config.repetitions; index++) {
      for (const step of steps[config.flow]) {
        if (!zarejestrowanePomiary.has(`${framework}|${index}|${step}`)) {
          throw new Error(`Brak pomiaru: ${framework}/${index}/${step}`);
        }
      }
    }
  }
}

export function obliczMediane(values: number[]) {
  if (!values.length) throw new Error("Nie można obliczyć mediany pustej próby.");

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function obliczPrzedzialBootstrap(roznice: number[], liczbaIteracji = 10000) {
  let seed = 123456789;

  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const mediany = Array.from({ length: liczbaIteracji }, () =>
    obliczMediane(roznice.map(() => roznice[Math.floor(random() * roznice.length)])),
  ).sort((a, b) => a - b);
  return {
    low: mediany[Math.floor(liczbaIteracji * 0.025)],
    high: mediany[Math.ceil(liczbaIteracji * 0.975) - 1],
  };
}

export function obliczStatystyki(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDifferences = values.reduce((sum, value) => sum + (value - mean) ** 2, 0);

  return {
    count: values.length,
    medianMs: obliczMediane(values),
    meanMs: mean,
    minMs: sorted[0],
    maxMs: sorted.at(-1),
    p95Ms: sorted[Math.ceil(values.length * 0.95) - 1],
    standardDeviationMs: values.length > 1 ? Math.sqrt(squaredDifferences / (values.length - 1)) : 0,
  };
}
