/**
 * Subject Mapping Service
 * Fetches curriculum hierarchy from the backend API
 */

import { API_BASE_URL } from './api.service';
import { NavigationTopic } from '@/types/navigation';

/**
 * SubjectMappingTreeNode from backend
 */
interface SubjectMappingTreeNode {
  id: string;
  key: string;
  name: string;
  shortDescription?: string;
  level: number;
  parentId: string | null;
  path: string;
  subject: string;
  gradeLevel: string;
  orderIndex: number;
  isLeaf: boolean;
  taskCount: number;
  children?: SubjectMappingTreeNode[];
}

/**
 * Transform SubjectMappingTreeNode to NavigationTopic format
 * This converts the backend tree structure to the format expected by CascadingSelect
 */
function transformToNavigationTopic(node: SubjectMappingTreeNode): NavigationTopic {
  const navigationTopic: NavigationTopic = {
    name: node.name,
  };

  // If node has children, transform them recursively
  if (node.children && node.children.length > 0) {
    navigationTopic.sub_topics = node.children.map(transformToNavigationTopic);
  }

  return navigationTopic;
}

/**
 * Fetch subject tree from backend API
 *
 * @param country - Country code (e.g., "HU", "MX")
 * @param subject - Subject name (e.g., "mathematics")
 * @param gradeLevel - Grade level (e.g., "grade_9_10", "grade_11_12")
 * @returns Array of NavigationTopic representing the curriculum hierarchy
 */
export async function fetchSubjectTree(
  country: string,
  subject: string,
  gradeLevel: string
): Promise<NavigationTopic[]> {
  try {
    const endpoint = `${API_BASE_URL}/api/countries/${country}/subjects/${subject}/grades/${gradeLevel}/tree`;

    console.log('[Subject Mapping Service] Fetching subject tree:', {
      country,
      subject,
      gradeLevel,
      endpoint,
    });

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Subject Mapping Service] Error response:', errorData);
      throw new Error(errorData.message || `Failed to fetch subject tree: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Subject Mapping Service] Received tree data:', data);

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from subject mapping API');
    }

    // Transform backend tree nodes to NavigationTopic format
    const tree: SubjectMappingTreeNode[] = data.data;

    // The backend returns a tree with a root node (e.g., "Grade 9-10")
    // We want to skip the root and return its children directly
    if (tree.length === 1 && tree[0].children && tree[0].children.length > 0) {
      // Skip the root node and return its children
      const navigationTopics = tree[0].children.map(transformToNavigationTopic);
      console.log('[Subject Mapping Service] Transformed to NavigationTopics (skipped root):', navigationTopics);
      return navigationTopics;
    }

    // Fallback: if structure is different, return as-is
    const navigationTopics = tree.map(transformToNavigationTopic);
    console.log('[Subject Mapping Service] Transformed to NavigationTopics:', navigationTopics);

    return navigationTopics;
  } catch (error) {
    console.error('[Subject Mapping Service] Error fetching subject tree:', error);

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend is running.`);
    }

    throw error;
  }
}

/**
 * Fetch subject trees for both grade levels
 *
 * @param country - Country code (e.g., "HU", "MX")
 * @param subject - Subject name (e.g., "mathematics")
 * @returns Object with grade_9_10 and grade_11_12 trees
 */
export async function fetchAllGradeTrees(
  country: string,
  subject: string = 'mathematics'
): Promise<{
  grade_9_10: NavigationTopic[];
  grade_11_12: NavigationTopic[];
}> {
  console.log('[Subject Mapping Service] Fetching all grade trees for:', { country, subject });

  // Fetch both grade levels in parallel
  const [grade9_10Tree, grade11_12Tree] = await Promise.all([
    fetchSubjectTree(country, subject, 'grade_9_10'),
    fetchSubjectTree(country, subject, 'grade_11_12'),
  ]);

  return {
    grade_9_10: grade9_10Tree,
    grade_11_12: grade11_12Tree,
  };
}
