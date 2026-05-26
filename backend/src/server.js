// npm run dev
import "dotenv/config";
import { app } from "./app.js";
import {connectDatabase, disconnectDatabase} from "./config/prisma.js"

const PORT = process.env.PORT || 4000;

async function bootstrap(){
  try {
    await connectDatabase();

    const server = app.listen(PORT, () => {
      console.log(`API server running on http://localhost:${PORT}`);
    });

  } catch(error) {
    console.error(error);
    await disconnectDatabase();

    process.exit(1);
  }
}

bootstrap();