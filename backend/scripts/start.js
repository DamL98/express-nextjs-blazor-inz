import "dotenv/config";
import { getStartupEnvironment } from "../src/config/startup-environment.js";

// Configure the profile before importing modules that capture environment values.
Object.assign(process.env, getStartupEnvironment(process.argv[2], process.env));
await import("../src/server.js");
