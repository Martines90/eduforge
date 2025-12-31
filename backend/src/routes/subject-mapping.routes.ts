/**
 * Subject Mapping Routes
 * API endpoints for curriculum hierarchy
 */

import { Router, Request, Response } from "express";
import * as subjectMappingService from "../services/subject-mapping.service";

const router = Router();

/**
 * GET /api/countries/:country/subjects/:subject/grades/:grade/tree
 * Get hierarchical tree structure for a subject and grade in a specific country
 */
router.get(
  "/api/countries/:country/subjects/:subject/grades/:grade/tree",
  async (req: Request, res: Response) => {
    try {
      const { country, subject, grade } = req.params;

      const tree = await subjectMappingService.getSubjectTree(
        country,
        subject,
        grade
      );

      res.status(200).json({
        success: true,
        data: tree,
      });
    } catch (error: any) {
      console.error("Error getting subject tree:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get subject tree",
      });
    }
  }
);

/**
 * GET /api/countries/:country/subjects/:subject/grades/:grade/mappings
 * Get flat list of all mappings for a subject and grade in a specific country
 */
router.get(
  "/api/countries/:country/subjects/:subject/grades/:grade/mappings",
  async (req: Request, res: Response) => {
    try {
      const { country, subject, grade } = req.params;

      const mappings = await subjectMappingService.getSubjectMappings(
        country,
        subject,
        grade
      );

      res.status(200).json({
        success: true,
        data: mappings,
        count: mappings.length,
      });
    } catch (error: any) {
      console.error("Error getting subject mappings:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get subject mappings",
      });
    }
  }
);

/**
 * GET /api/countries/:country/subjects/:subject/grades/:grade/leaf-nodes
 * Get only leaf nodes (where tasks can be assigned)
 */
router.get(
  "/api/countries/:country/subjects/:subject/grades/:grade/leaf-nodes",
  async (req: Request, res: Response) => {
    try {
      const { country, subject, grade } = req.params;

      const leafNodes = await subjectMappingService.getLeafNodes(
        country,
        subject,
        grade
      );

      res.status(200).json({
        success: true,
        data: leafNodes,
        count: leafNodes.length,
      });
    } catch (error: any) {
      console.error("Error getting leaf nodes:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get leaf nodes",
      });
    }
  }
);

/**
 * GET /api/countries/:country/subjects/:subject/grades/:grade/mappings/:id
 * Get a specific subject mapping by ID
 */
router.get(
  "/api/countries/:country/subjects/:subject/grades/:grade/mappings/:id",
  async (req: Request, res: Response) => {
    try {
      const { country, subject, grade, id } = req.params;

      const mapping = await subjectMappingService.getSubjectMappingById(
        country,
        subject,
        id,
        grade
      );

      if (!mapping) {
        return res.status(404).json({
          success: false,
          message: "Subject mapping not found",
        });
      }

      res.status(200).json({
        success: true,
        data: mapping,
      });
    } catch (error: any) {
      console.error("Error getting subject mapping:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get subject mapping",
      });
    }
  }
);

/**
 * GET /api/countries/:country/subjects/:subject/grades/:grade/mappings/:id/children
 * Get children of a specific node
 */
router.get(
  "/api/countries/:country/subjects/:subject/grades/:grade/mappings/:id/children",
  async (req: Request, res: Response) => {
    try {
      const { country, subject, grade, id } = req.params;

      const children = await subjectMappingService.getChildren(
        country,
        subject,
        id,
        grade
      );

      res.status(200).json({
        success: true,
        data: children,
        count: children.length,
      });
    } catch (error: any) {
      console.error("Error getting children:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get children",
      });
    }
  }
);

/**
 * GET /api/countries/:country/subjects/:subject/grades/:grade/mappings/:id/breadcrumb
 * Get breadcrumb path from root to this node
 */
router.get(
  "/api/countries/:country/subjects/:subject/grades/:grade/mappings/:id/breadcrumb",
  async (req: Request, res: Response) => {
    try {
      const { country, subject, grade, id } = req.params;

      const breadcrumb = await subjectMappingService.getBreadcrumbPath(
        country,
        subject,
        id,
        grade
      );

      res.status(200).json({
        success: true,
        data: breadcrumb,
      });
    } catch (error: any) {
      console.error("Error getting breadcrumb:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get breadcrumb",
      });
    }
  }
);

export default router;
