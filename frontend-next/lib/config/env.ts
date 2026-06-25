export const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("brak NEXT_PUBLIC_API_URL");
}