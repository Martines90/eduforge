/**
 * Export full tree map from Firestore for a given subject and grade level
 * Generates a hierarchical JSON structure suitable for frontend tree display
 */

import { initializeFirebase, getFirestore } from "../config/firebase.config";

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
  nodes.forEach((node) => {
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
      const parentPath = path.substring(0, path.lastIndexOf("/"));
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
    nodes.forEach((node) => {
      if (node.subTopics && node.subTopics.length > 0) {
        sortNodes(node.subTopics);
      }
    });
  };

  sortNodes(rootNodes);

  return rootNodes;
}

async function exportTreeMap(subject: string, gradeLevel: string) {
  console.log(`\n📊 Exporting tree map for ${subject} - ${gradeLevel}...\n`);

  initializeFirebase();
  const db = getFirestore();

  try {
    // Fetch all nodes for the given subject and grade level
    const snapshot = await db
      .collection("subjectMappings")
      .where("subject", "==", subject)
      .where("gradeLevel", "==", gradeLevel)
      .get();

    if (snapshot.empty) {
      console.log("❌ No data found for the specified subject and grade level");
      process.exit(1);
    }

    console.log(`✅ Found ${snapshot.size} nodes in Firestore`);

    // Convert to flat array
    const flatNodes: FirestoreNode[] = [];
    snapshot.docs.forEach((doc) => {
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
    const minLevel = Math.min(...flatNodes.map((n) => n.level));
    console.log(`📌 Root level: ${minLevel}`);

    // Adjust levels so root starts at 0
    flatNodes.forEach((node) => {
      node.level = node.level - minLevel;
    });

    // Build tree
    const tree = buildTreeFromFlat(flatNodes);

    // If root is a single grade level node, extract its children
    let finalTree = tree;
    if (tree.length === 1 && tree[0].key === gradeLevel) {
      finalTree = tree[0].subTopics || [];
      console.log(`\n🔄 Unwrapping grade level container...`);
    }

    console.log(`\n🌳 Tree structure built successfully!`);
    console.log(`📊 Root nodes: ${finalTree.length}`);

    // Calculate total nodes at each level
    const levelCounts = new Map<number, number>();
    const countLevels = (nodes: TreeNode[], depth: number = 0) => {
      nodes.forEach((node) => {
        levelCounts.set(depth, (levelCounts.get(depth) || 0) + 1);
        if (node.subTopics && node.subTopics.length > 0) {
          countLevels(node.subTopics, depth + 1);
        }
      });
    };
    countLevels(finalTree);

    console.log("\n📈 Nodes per level:");
    levelCounts.forEach((count, level) => {
      console.log(`   Level ${level}: ${count} nodes`);
    });

    // Output as JSON
    console.log("\n📄 Generating JSON output...\n");
    console.log(JSON.stringify(finalTree, null, 2));

    console.log("\n✅ Export complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error exporting tree map:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const subjectArg = args.find((arg) => arg.startsWith("--subject="));
const gradeArg = args.find((arg) => arg.startsWith("--grade="));

const subject = subjectArg ? subjectArg.split("=")[1] : "mathematics";
const gradeLevel = gradeArg ? gradeArg.split("=")[1] : "grade_9_10";

exportTreeMap(subject, gradeLevel);
