import { Router } from "express";

import { getProblemDefinition } from "./problems.controller.js";

const router = Router();

router.get("/:slug", getProblemDefinition);

export default router;
