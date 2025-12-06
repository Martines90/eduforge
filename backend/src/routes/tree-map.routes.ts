/**
 * API routes for serving subject tree maps
 */

import { Router, Request, Response } from 'express';
import { getFirestore } from '../config/firebase.config';

const router = Router();

interface FirestoreNode {
  key: string;
  name: string;
  level: number;
  parentId: string | null;
  path: string;
  isLeaf: boolean;
  short_description?: string;
  orderIndex?: number;
}

interface TreeNode {
  key: string;
  name: string;
  short_description?: string;
  level: number;
  subTopics?: TreeNode[];
}

/**
 * Build hierarchical tree from flat Firestore data
 */
function buildTreeFromFlat(nodes: FirestoreNode[]): TreeNode[] {
  // Create a map for quick lookup
  const nodeMap = new Map<string, TreeNode & { parentId: string | null }>();

  // Convert Firestore nodes to tree nodes
  nodes.forEach(node => {
    nodeMap.set(node.path, {
      key: node.key,
      name: node.name,
      short_description: node.short_description,
      level: node.level,
      parentId: node.parentId,
      subTopics: [],
    });
  });

  // Build parent-child relationships
  const rootNodes: TreeNode[] = [];

  nodeMap.forEach((node, path) => {
    if (node.parentId) {
      // Find parent by searching for a node whose path matches the parent structure
      const parentPath = path.substring(0, path.lastIndexOf('/'));
      const parent = nodeMap.get(parentPath);

      if (parent) {
        if (!parent.subTopics) {
          parent.subTopics = [];
        }
        // Add child without parentId property
        const { parentId, ...childWithoutParentId } = node;
        parent.subTopics.push(childWithoutParentId);
      }
    } else {
      // This is a root node
      const { parentId, ...nodeWithoutParentId } = node;
      rootNodes.push(nodeWithoutParentId);
    }
  });

  // Sort by orderIndex if available
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      const aIndex = (nodeMap.get(a.key) as any)?.orderIndex || 0;
      const bIndex = (nodeMap.get(b.key) as any)?.orderIndex || 0;
      return aIndex - bIndex;
    });
    nodes.forEach(node => {
      if (node.subTopics && node.subTopics.length > 0) {
        sortNodes(node.subTopics);
      }
    });
  };

  sortNodes(rootNodes);

  return rootNodes;
}

/**
 * GET /api/tree-map/:subject/:gradeLevel
 * DEPRECATED: Backward-compatible route that defaults to Hungary (HU)
 * Use /:country/:subject/:gradeLevel instead
 */
router.get('/:subject/:gradeLevel', async (req: Request, res: Response) => {
  try {
    const { subject, gradeLevel } = req.params;
    const country = 'HU'; // Default to Hungary for backward compatibility

    console.warn(`⚠️  Using deprecated tree-map route without country. Defaulting to ${country}. Please update to use /:country/:subject/:gradeLevel`);

    const db = getFirestore();

    // Fetch all nodes for the given country, subject and grade level
    const snapshot = await db.collection('countries').doc(country)
      .collection('subjectMappings')
      .where('subject', '==', subject)
      .where('gradeLevel', '==', gradeLevel)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No tree map found for the specified subject and grade level',
      });
    }

    // Convert to flat array
    const flatNodes: FirestoreNode[] = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      flatNodes.push({
        key: data.key,
        name: data.name,
        level: data.level,
        parentId: data.parentId,
        path: data.path,
        isLeaf: data.isLeaf,
        short_description: data.short_description,
        orderIndex: data.orderIndex,
      });
    });

    // Find the minimum level (root level)
    const minLevel = Math.min(...flatNodes.map(n => n.level));

    // Adjust levels so root starts at 0
    flatNodes.forEach(node => {
      node.level = node.level - minLevel;
    });

    // Build tree
    const tree = buildTreeFromFlat(flatNodes);

    // If root is a single grade level node, extract its children
    let finalTree = tree;
    if (tree.length === 1 && tree[0].key === gradeLevel) {
      finalTree = tree[0].subTopics || [];
    }

    res.json({
      success: true,
      data: {
        country,
        subject,
        gradeLevel,
        totalNodes: snapshot.size,
        rootNodes: finalTree.length,
        tree: finalTree,
      },
    });
  } catch (error: any) {
    console.error('Error fetching tree map:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tree map',
    });
  }
});

/**
 * GET /api/tree-map/:country/:subject/:gradeLevel
 * Get full hierarchical tree map for a subject and grade level in a specific country
 */
router.get('/:country/:subject/:gradeLevel', async (req: Request, res: Response) => {
  try {
    const { country, subject, gradeLevel } = req.params;

    const db = getFirestore();

    // Fetch all nodes for the given country, subject and grade level
    const snapshot = await db.collection('countries').doc(country)
      .collection('subjectMappings')
      .where('subject', '==', subject)
      .where('gradeLevel', '==', gradeLevel)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No tree map found for the specified country, subject and grade level',
      });
    }

    // Convert to flat array
    const flatNodes: FirestoreNode[] = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      flatNodes.push({
        key: data.key,
        name: data.name,
        level: data.level,
        parentId: data.parentId,
        path: data.path,
        isLeaf: data.isLeaf,
        short_description: data.short_description,
        orderIndex: data.orderIndex,
      });
    });

    // Find the minimum level (root level)
    const minLevel = Math.min(...flatNodes.map(n => n.level));

    // Adjust levels so root starts at 0
    flatNodes.forEach(node => {
      node.level = node.level - minLevel;
    });

    // Build tree
    const tree = buildTreeFromFlat(flatNodes);

    // If root is a single grade level node, extract its children
    let finalTree = tree;
    if (tree.length === 1 && tree[0].key === gradeLevel) {
      finalTree = tree[0].subTopics || [];
    }

    res.json({
      success: true,
      data: {
        country,
        subject,
        gradeLevel,
        totalNodes: snapshot.size,
        rootNodes: finalTree.length,
        tree: finalTree,
      },
    });
  } catch (error: any) {
    console.error('Error fetching tree map:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tree map',
    });
  }
});

export default router;
