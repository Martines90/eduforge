/**
 * Subject Mapping Service
 * Handles CRUD operations for curriculum hierarchy
 */

import { getFirestore } from '../config/firebase.config';
import { SubjectMappingDocument, SubjectMappingTreeNode } from '../types/task.types';

/**
 * Get all subject mappings for a specific country, subject and grade
 */
export async function getSubjectMappings(
  country: string,
  subject: string,
  gradeLevel: string
): Promise<(SubjectMappingDocument & { id: string })[]> {
  const db = getFirestore();

  const snapshot = await db
    .collection('countries').doc(country)
    .collection('subjectMappings')
    .where('subject', '==', subject)
    .where('gradeLevel', '==', gradeLevel)
    .orderBy('level')
    .orderBy('orderIndex')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as SubjectMappingDocument),
  }));
}

/**
 * Build hierarchical tree from flat list of mappings
 */
export function buildTree(
  flatList: (SubjectMappingDocument & { id: string })[]
): SubjectMappingTreeNode[] {
  // Create a map for quick lookup
  const nodeMap = new Map<string, SubjectMappingTreeNode>();

  // Initialize all nodes
  flatList.forEach((item) => {
    nodeMap.set(item.id, {
      ...item,
      children: [],
    });
  });

  // Build tree structure
  const rootNodes: SubjectMappingTreeNode[] = [];

  flatList.forEach((item) => {
    const node = nodeMap.get(item.id)!;

    if (item.parentId === null) {
      // Root node
      rootNodes.push(node);
    } else {
      // Child node - add to parent
      const parent = nodeMap.get(item.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    }
  });

  return rootNodes;
}

/**
 * Get hierarchical tree for a country, subject and grade
 */
export async function getSubjectTree(
  country: string,
  subject: string,
  gradeLevel: string
): Promise<SubjectMappingTreeNode[]> {
  const flatList = await getSubjectMappings(country, subject, gradeLevel);
  return buildTree(flatList);
}

/**
 * Get only leaf nodes (where tasks can be assigned)
 */
export async function getLeafNodes(
  country: string,
  subject: string,
  gradeLevel: string
): Promise<(SubjectMappingDocument & { id: string })[]> {
  const db = getFirestore();

  const snapshot = await db
    .collection('countries').doc(country)
    .collection('subjectMappings')
    .where('subject', '==', subject)
    .where('gradeLevel', '==', gradeLevel)
    .where('isLeaf', '==', true)
    .orderBy('path')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as SubjectMappingDocument),
  }));
}

/**
 * Get a specific subject mapping by ID
 */
export async function getSubjectMappingById(
  country: string,
  id: string
): Promise<(SubjectMappingDocument & { id: string }) | null> {
  const db = getFirestore();
  const doc = await db.collection('countries').doc(country)
    .collection('subjectMappings').doc(id).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...(doc.data() as SubjectMappingDocument),
  };
}

/**
 * Get children of a specific node
 */
export async function getChildren(country: string, parentId: string): Promise<(SubjectMappingDocument & { id: string })[]> {
  const db = getFirestore();

  const snapshot = await db
    .collection('countries').doc(country)
    .collection('subjectMappings')
    .where('parentId', '==', parentId)
    .orderBy('orderIndex')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as SubjectMappingDocument),
  }));
}

/**
 * Increment task count for a subject mapping
 */
export async function incrementTaskCount(country: string, mappingId: string): Promise<void> {
  const db = getFirestore();
  const docRef = db.collection('countries').doc(country)
    .collection('subjectMappings').doc(mappingId);

  await docRef.update({
    taskCount: (db as any).FieldValue.increment(1),
    updatedAt: new Date(),
  });
}

/**
 * Decrement task count for a subject mapping
 */
export async function decrementTaskCount(country: string, mappingId: string): Promise<void> {
  const db = getFirestore();
  const docRef = db.collection('countries').doc(country)
    .collection('subjectMappings').doc(mappingId);

  await docRef.update({
    taskCount: (db as any).FieldValue.increment(-1),
    updatedAt: new Date(),
  });
}

/**
 * Validate that a mapping exists and is a leaf node
 */
export async function validateLeafMapping(country: string, mappingId: string): Promise<boolean> {
  const mapping = await getSubjectMappingById(country, mappingId);

  if (!mapping) {
    throw new Error('Subject mapping not found');
  }

  if (!mapping.isLeaf) {
    throw new Error('Tasks can only be assigned to leaf nodes (deepest level categories)');
  }

  return true;
}

/**
 * Get breadcrumb path for a mapping
 * Returns array from root to current node
 */
export async function getBreadcrumbPath(
  country: string,
  mappingId: string
): Promise<(SubjectMappingDocument & { id: string })[]> {
  const db = getFirestore();
  const breadcrumbs: (SubjectMappingDocument & { id: string })[] = [];

  let currentId: string | null = mappingId;

  while (currentId) {
    const doc = await db.collection('countries').doc(country)
      .collection('subjectMappings').doc(currentId).get();

    if (!doc.exists) {
      break;
    }

    const data = doc.data() as SubjectMappingDocument;
    breadcrumbs.unshift({
      id: doc.id,
      ...data,
    });

    currentId = data.parentId;
  }

  return breadcrumbs;
}
