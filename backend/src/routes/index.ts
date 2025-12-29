import { Router } from "express";
import taskRoutes from "./task.routes";
import authRoutes from "./auth.routes";
import guestAuthRoutes from "./guest-auth.routes";
import subscriptionRoutes from "./subscription.routes";
import subjectMappingRoutes from "./subject-mapping.routes";
import tasksV2Routes from "./tasks-v2.routes";
import treeMapRoutes from "./tree-map.routes";

const router = Router();

// Mount auth routes
router.use("/api/auth", authRoutes);
router.use("/api/auth", guestAuthRoutes);

// Mount subscription routes
router.use("/api/subscription", subscriptionRoutes);

// Mount legacy task generation routes
router.use(taskRoutes);

// Mount new Firestore-based routes
router.use(subjectMappingRoutes);
router.use(tasksV2Routes);
router.use("/api/tree-map", treeMapRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current health status of the API server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default router;
