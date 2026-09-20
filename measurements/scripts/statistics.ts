import {
  frameworkRuntime,
  protocolVersion,
  steps,
  type Flow,
} from "../measurement-config";

export type PomiarKroku = {
  step: string;
  durationMs: number;
  runtime: string;
};

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

// Sprawdza, czy próba pochodzi z aktualnej serii pomiarowej.
function sprawdzMetadaneProby(proba: ProbaPomiarowa, config: KonfiguracjaPomiaru): void {
  if (
    proba.protocolVersion !== protocolVersion ||
    proba.runId !== config.runId ||
    proba.dataset !== config.dataset ||
    proba.cacheMode !== config.cacheMode
  ) {
    throw new Error("Niezgodne metadane próby pomiarowej.");
  }
}

// Odrzuca nieudaną, ponowioną albo błędnie zidentyfikowaną próbę.
function sprawdzWynikProby(proba: ProbaPomiarowa, config: KonfiguracjaPomiaru): void {
  if (proba.status !== "passed" || proba.retry !== 0) {
    throw new Error("Próba nie została zakończona poprawnie: " + proba.test);
  }

  if (
    !(proba.framework in frameworkRuntime) ||
    !Number.isInteger(proba.sampleIndex) ||
    proba.sampleIndex < 0 ||
    proba.sampleIndex >= config.repetitions
  ) {
    throw new Error("Nieprawidłowa tożsamość próby pomiarowej.");
  }
}

// Sprawdza kompletność kroków i rejestruje każdy poprawny pomiar.
function sprawdzKrokiProby(
  proba: ProbaPomiarowa,
  config: KonfiguracjaPomiaru,
  zarejestrowanePomiary: Set<string>,
): void {
  const expected = config.flow === "write" ? [...steps.write] : [proba.test];

  if (
    proba.steps.length !== expected.length ||
    proba.steps.some((pomiarKroku, index) => pomiarKroku.step !== expected[index])
  ) {
    throw new Error("Niepełna lista kroków próby pomiarowej.");
  }

  for (const pomiarKroku of proba.steps) {
    if (
      !(steps[config.flow] as readonly string[]).includes(pomiarKroku.step) ||
      pomiarKroku.runtime !== frameworkRuntime[proba.framework] ||
      !Number.isFinite(pomiarKroku.durationMs) ||
      pomiarKroku.durationMs < 0
    ) {
      throw new Error("Nieprawidłowy krok lub renderer.");
    }

    const key = `${proba.framework}|${proba.sampleIndex}|${pomiarKroku.step}`;
    if (zarejestrowanePomiary.has(key)) {
      throw new Error("Powtórzony pomiar: " + key);
    }
    zarejestrowanePomiary.add(key);
  }
}

// Potwierdza, że istnieje każda wymagana kombinacja frameworka, próby i kroku.
function sprawdzKompletnoscMacierzy(
  zarejestrowanePomiary: Set<string>,
  config: KonfiguracjaPomiaru,
): void {
  for (const framework of Object.keys(frameworkRuntime)) {
    for (let sampleIndex = 0; sampleIndex < config.repetitions; sampleIndex++) {
      for (const step of steps[config.flow]) {
        if (!zarejestrowanePomiary.has(`${framework}|${sampleIndex}|${step}`)) {
          throw new Error(`Brak pomiaru: ${framework}/${sampleIndex}/${step}`);
        }
      }
    }
  }
}

// Waliduje wszystkie próby przed utworzeniem raportu statystycznego.
export function sprawdzProbyPomiarowe(
  proby: ProbaPomiarowa[],
  config: KonfiguracjaPomiaru,
): void {
  const zarejestrowanePomiary = new Set<string>();

  for (const proba of proby) {
    sprawdzMetadaneProby(proba, config);
    sprawdzWynikProby(proba, config);
    sprawdzKrokiProby(proba, config, zarejestrowanePomiary);
  }

  sprawdzKompletnoscMacierzy(zarejestrowanePomiary, config);
}

// Wyznacza medianę dla niepustej tablicy wartości.
export function obliczMediane(values: number[]) {
  if (!values.length) {
    throw new Error("Nie można obliczyć mediany pustej próby.");
  }

  const posortowaneWartosci = [...values].sort((a, b) => a - b);
  const middleIndex = Math.floor(posortowaneWartosci.length / 2);

  return posortowaneWartosci.length % 2
    ? posortowaneWartosci[middleIndex]
    : (posortowaneWartosci[middleIndex - 1] + posortowaneWartosci[middleIndex]) / 2;
}

// Oblicza deterministyczny przedział percentylowy mediany różnic sparowanych.
export function obliczPrzedzialBootstrap(roznice: number[], liczbaIteracji = 10000) {
  let seed = 123456789;
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const oszacowaneMediany = Array.from({ length: liczbaIteracji }, () =>
    obliczMediane(roznice.map(() => roznice[Math.floor(random() * roznice.length)])),
  ).sort((a, b) => a - b);

  return {
    low: oszacowaneMediany[Math.floor(liczbaIteracji * 0.025)],
    high: oszacowaneMediany[Math.ceil(liczbaIteracji * 0.975) - 1],
  };
}

// Wylicza statystyki opisowe używane w raporcie dla jednego kroku.
export function obliczStatystyki(values: number[]) {
  const posortowaneWartosci = [...values].sort((a, b) => a - b);
  const srednia = values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    count: values.length,
    medianMs: obliczMediane(values),
    meanMs: srednia,
    minMs: posortowaneWartosci[0],
    maxMs: posortowaneWartosci.at(-1),
    p95Ms: posortowaneWartosci[Math.ceil(values.length * 0.95) - 1],
    standardDeviationMs:
      values.length > 1
        ? Math.sqrt(
            values.reduce((sum, value) => sum + (value - srednia) ** 2, 0) /
              (values.length - 1),
          )
        : 0,
  };
}
