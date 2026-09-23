import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Rozszerzenie musi zostać zainicjalizowane przed utworzeniem schematów Zod.
extendZodWithOpenApi(z);

export { z };
