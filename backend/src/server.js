import "dotenv/config";

import { app } from "./app.js";
import { getApplicationEnvironment } from "./config/environment.js";
import { connectDatabase, disconnectDatabase } from "./config/prisma.js";
import { validateRuntimeConfiguration } from "./config/runtime-config.js";

const { port } = getApplicationEnvironment();

async function bootstrap() {
  try {
    validateRuntimeConfiguration();
    await connectDatabase();

    app.listen(port, () => {
      console.log(`API server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error(error);
    await disconnectDatabase();
    process.exit(1);
  }
}

bootstrap();
