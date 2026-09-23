import { createOpenApiDocument } from "../../config/openapi.js";

let openApiDocument;

export function getOpenApiDocument(_req, res) {
  // Specyfikacja jest generowana raz, bez zapytań do bazy danych.
  openApiDocument ??= createOpenApiDocument();
  return res.json(openApiDocument);
}
