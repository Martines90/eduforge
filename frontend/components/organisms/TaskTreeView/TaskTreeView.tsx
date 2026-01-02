'use client';

import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Typography,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';
import AddIcon from '@mui/icons-material/Add';
import { TreeNode, TaskItem } from '@/types/task-tree';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/context/UserContext';
import { Button } from '@/components/atoms/Button';
import { fetchTasksByCurriculumPath } from '@/lib/services/api.service';
import styles from './TaskTreeView.module.scss';

export interface TaskTreeViewProps {
  data: TreeNode[];
  onTaskClick?: (task: TaskItem) => void;
  subject: string;
  gradeLevel: string;
  searchQuery?: string;
}

interface RowProps {
  node: TreeNode;
  level: number;
  onTaskClick?: (task: TaskItem) => void;
  subject: string;
  gradeLevel: string;
  pathFromRoot: string[];
  isTeacher: boolean;
  searchQuery?: string;
  shouldExpand?: boolean;
  parentMatched?: boolean;
}

/**
 * Recursive Row Component
 * Renders a single tree node with expand/collapse functionality
 */
const TreeRow: React.FC<RowProps> = ({ node, level, onTaskClick, subject, gradeLevel, pathFromRoot, isTeacher, searchQuery, shouldExpand, parentMatched }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(shouldExpand || false);
  const [tasks, setTasks] = useState<TaskItem[]>(node.tasks || []);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksFetched, setTasksFetched] = useState(false);

  // Auto-expand when shouldExpand changes
  React.useEffect(() => {
    if (shouldExpand !== undefined) {
      setIsExpanded(shouldExpand);
    }
  }, [shouldExpand]);

  const hasChildren = node.subTopics && node.subTopics.length > 0;
  const isLeaf = !hasChildren; // Leaf nodes can have tasks
  const hasTasks = tasks.length > 0;

  // Check if this node or any of its children match the search
  const matchesSearch = (node: TreeNode, query: string): boolean => {
    if (!query || query.length < 3) return true;
    const lowerQuery = query.toLowerCase();

    // Check if current node matches
    if (node.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Check if any child matches (recursive)
    if (node.subTopics && node.subTopics.length > 0) {
      return node.subTopics.some(child => matchesSearch(child, query));
    }

    return false;
  };

  // Check if this node itself matches (not just children)
  const nodeDirectlyMatches = (node: TreeNode, query: string): boolean => {
    if (!query || query.length < 3) return false;
    return node.name.toLowerCase().includes(query.toLowerCase());
  };

  const thisNodeMatches = nodeDirectlyMatches(node, searchQuery || '');

  // Visibility rules:
  // 1. If parent matched directly, show this child (entire subtree visible)
  // 2. Otherwise, show only if this node or its descendants match
  const selfOrDescendantMatches = matchesSearch(node, searchQuery || '');
  const isVisible = parentMatched || selfOrDescendantMatches;

  // Auto-expand parent nodes that have matching descendants
  // This expands the tree to reveal matches, but doesn't auto-expand leaf nodes to load tasks
  // IMPORTANT: Only auto-expand if this node has children (not a leaf node)
  const shouldAutoExpand = !!(searchQuery && searchQuery.length >= 3 && hasChildren &&
    node.subTopics?.some(child => matchesSearch(child, searchQuery)));

  if (!isVisible) {
    return null;
  }

  // Build the full path for this node (using names for URL compatibility with navigation data)
  const currentPath = [...pathFromRoot, node.name];
  const pathString = currentPath.join(':');

  // Build full curriculum path for API calls
  const curriculumPath = `${subject}:${gradeLevel}:${pathString}`;

  const handleToggle = async () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    // If expanding a leaf node and tasks haven't been loaded yet
    if (newExpandedState && isLeaf && !tasksFetched && !loadingTasks) {
      setLoadingTasks(true);
      try {
        // Fetch tasks from backend API using full curriculum path
        console.log('[TaskTreeView] Fetching tasks for curriculum path:', curriculumPath);
        console.log('[TaskTreeView] Path components:', { subject, gradeLevel, pathString });
        const data = await fetchTasksByCurriculumPath(curriculumPath, true);
        console.log('[TaskTreeView] API Response:', data);

        if (data.success && data.tasks) {
          // Map backend task format to frontend TaskItem format
          console.log('[TaskTreeView] Found', data.tasks.length, 'tasks');
          const mappedTasks = data.tasks.map((task: any) => ({
            id: task.id,
            title: task.title,
            subject: task.subject,
            educationalModel: task.educationalModel,
            rating: task.ratingAverage || 0,
            views: task.viewCount || 0,
            description: task.description,
            createdAt: task.created_at,
            gradeLevel: task.gradeLevel,
          }));
          setTasks(mappedTasks);
        }
        setTasksFetched(true);
      } catch (error) {
        console.error('Error loading tasks:', error);
        setTasksFetched(true);
      } finally {
        setLoadingTasks(false);
      }
    }
  };

  const handleGoToTaskCreator = () => {
    // Build URL with subject path selection
    const url = `/task_creator?subject_path_selection=${encodeURIComponent(pathString)}&subject=${subject}&gradeLevel=${gradeLevel}`;
    window.location.href = url;
  };

  // Determine row style based on level
  const getRowClass = () => {
    switch (level) {
      case 0:
        return styles.levelSubject;
      case 1:
        return styles.levelGrade;
      case 2:
        return styles.levelMainCategory;
      case 3:
        return styles.levelSubCategory;
      default:
        return styles.levelDeep;
    }
  };

  return (
    <>
      {/* Category Row */}
      <TableRow className={`${styles.treeRow} ${getRowClass()}`}>
        <TableCell
          sx={{
            paddingLeft: {
              xs: `${level * 8 + 8}px`,  // Mobile: smaller indent
              sm: `${level * 16 + 8}px`, // Tablet: medium indent
              md: `${level * 24 + 8}px`  // Desktop: full indent
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Show expand button for nodes with children OR leaf nodes (which can have tasks) */}
            {(hasChildren || isLeaf) && (
              <IconButton
                size="small"
                onClick={handleToggle}
                className={styles.expandButton}
              >
                {isExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
              </IconButton>
            )}
            {!hasChildren && !isLeaf && <Box sx={{ width: 40 }} />}
            <Typography
              variant={level <= 1 ? 'subtitle1' : 'body2'}
              component="div"
              fontWeight={level <= 2 ? 600 : 400}
            >
              {node.name}
            </Typography>
            {node.short_description && (
              <Tooltip title={node.short_description}>
                <SchoolIcon fontSize="small" color="action" />
              </Tooltip>
            )}
          </Box>
        </TableCell>
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
      </TableRow>

      {/* Expanded Children Rows */}
      {(isExpanded || shouldAutoExpand) && hasChildren && (
        <>
          {node.subTopics!.map((child) => {
            // Check if child is a leaf node (no subTopics)
            const childIsLeaf = !child.subTopics || child.subTopics.length === 0;

            return (
              <TreeRow
                key={child.key}
                node={child}
                level={level + 1}
                onTaskClick={onTaskClick}
                subject={subject}
                gradeLevel={gradeLevel}
                pathFromRoot={currentPath}
                isTeacher={isTeacher}
                searchQuery={searchQuery}
                // Don't pass shouldExpand to leaf nodes - they should only expand on user click
                shouldExpand={childIsLeaf ? false : shouldAutoExpand}
                parentMatched={thisNodeMatches || parentMatched}
              />
            );
          })}
        </>
      )}

      {/* Loading state for tasks */}
      {isExpanded && isLeaf && loadingTasks && (
        <TableRow className={styles.emptyRow}>
          <TableCell
            colSpan={3}
            sx={{
              paddingLeft: {
                xs: `${(level + 1) * 8 + 16}px`,  // Mobile: smaller padding
                sm: `${(level + 1) * 16 + 32}px`, // Tablet: medium padding
                md: `${(level + 1) * 24 + 48}px`  // Desktop: full padding
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('Loading tasks...')}
              </Typography>
            </Box>
          </TableCell>
        </TableRow>
      )}

      {/* No tasks message for empty leaf nodes */}
      {isExpanded && isLeaf && !loadingTasks && !hasTasks && tasksFetched && (
        <TableRow className={styles.emptyRow}>
          <TableCell
            colSpan={3}
            sx={{
              paddingLeft: {
                xs: `${(level + 1) * 8 + 16}px`,  // Mobile: smaller padding
                sm: `${(level + 1) * 16 + 32}px`, // Tablet: medium padding
                md: `${(level + 1) * 24 + 48}px`  // Desktop: full padding
              }
            }}
          >
            <Box sx={{ py: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('No teacher added any tasks yet.')}
                </Typography>
                {isTeacher && (
                  <>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {t('Be the first one who creates a new task')}
                    </Typography>
                    <Button
                      variant="primary"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleGoToTaskCreator}
                    >
                      {t('Go to Task Creator')}
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </TableCell>
        </TableRow>
      )}

      {/* Tasks for this leaf node */}
      {isExpanded && isLeaf && !loadingTasks && hasTasks && (
        <>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className={styles.taskRow}
              onClick={() => window.open(`/tasks/${task.id}`, '_blank')}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
            >
              <TableCell
                sx={{
                  paddingLeft: {
                    xs: `${(level + 1) * 8 + 16}px`,  // Mobile: smaller padding
                    sm: `${(level + 1) * 16 + 32}px`, // Tablet: medium padding
                    md: `${(level + 1) * 24 + 48}px`  // Desktop: full padding
                  }
                }}
              >
                <Typography variant="body2" color="primary">
                  {task.title}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {task.rating > 0 ? `${task.rating.toFixed(1)}/5 ★` : 'N/A'}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <VisibilityIcon fontSize="small" color="action" />
                  <Typography variant="body2">{task.views}</Typography>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </>
      )}
    </>
  );
};

/**
 * TaskTreeView Component
 * Displays a hierarchical tree of tasks with expandable categories
 */
export const TaskTreeView: React.FC<TaskTreeViewProps> = ({ data, onTaskClick, subject, gradeLevel, searchQuery }) => {
  const { t } = useTranslation();
  const { user } = useUser();

  // Determine if current user is a teacher
  const isTeacher = user.identity === 'teacher' && user.isRegistered;

  return (
    <TableContainer component={Paper} className={styles.treeContainer}>
      <Table stickyHeader>
        <TableHead>
          <TableRow className={styles.headerRow}>
            <TableCell>
              <Typography variant="subtitle2" component="div" fontWeight={600}>
                {t('Category / Task Title')}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" component="div" fontWeight={600}>
                {t('Rating')}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" component="div" fontWeight={600}>
                {t('Views')}
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((node) => (
            <TreeRow
              key={node.key}
              node={node}
              level={0}
              onTaskClick={onTaskClick}
              subject={subject}
              gradeLevel={gradeLevel}
              pathFromRoot={[]}
              isTeacher={isTeacher}
              searchQuery={searchQuery}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TaskTreeView;
