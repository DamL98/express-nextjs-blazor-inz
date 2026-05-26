import { ZodError } from "zod";
import { ApiError } from "../errors/apiError.js";

export function errorMiddleware(error, req, res, next){

  // jesli typ bledu z logiki biznesowej
  if (error instanceof ApiError){
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code || "APP_ERROR",
        message: error.message,
        details: error.details || null
      }
    });
  }

  // bledy przez walidacje danych wejsciowych od validate.middleware
  if(error instanceof ZodError){
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Dane wejsciowe niepoprawne",
        details: error.flatten().fieldErrors,
      }
    });
  }

  console.error("Nieprzewidziany error: ",error);

  // blad servera
  return res.status(500).json({
    success: false,
    error: {
      message: "Wystąpił nieoczekiwany błąd serwera.",
      details: process.env.NODE_ENV === "development" ? error.message : null,
    }
  });
}