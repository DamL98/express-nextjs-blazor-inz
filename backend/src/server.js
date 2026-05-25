import "dotenv/config";
import { app } from "./app.js";

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});