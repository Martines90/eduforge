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
  Rating,
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
}

interface RowProps {
  node: TreeNode;
  level: number;
  onTaskClick?: (task: TaskItem) => void;
  subject: string;
  gradeLevel: string;
  pathFromRoot: string[];
  isTeacher: boolean;
}

/**
 * Recursive Row Component
 * Renders a single tree node with expand/collapse functionality
 */
const TreeRow: React.FC<RowProps> = ({ node, level, onTaskClick, subject, gradeLevel, pathFromRoot, isTeacher }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>(node.tasks || []);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksFetched, setTasksFetched] = useState(false);

  const hasChildren = node.subTopics && node.subTopics.length > 0;
  const isLeaf = !hasChildren; // Leaf nodes can have tasks
  const hasTasks = tasks.length > 0;

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
        const data = await fetchTasksByCurriculumPath(curriculumPath, true);

        if (data.success && data.data?.tasks) {
          // Map backend task format to frontend TaskItem format
          const mappedTasks = data.data.tasks.map((task: any) => ({
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
        <TableCell style={{ paddingLeft: `${level * 24 + 8}px` }}>
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
      {isExpanded && hasChildren && (
        <>
          {node.subTopics!.map((child) => (
            <TreeRow
              key={child.key}
              node={child}
              level={level + 1}
              onTaskClick={onTaskClick}
              subject={subject}
              gradeLevel={gradeLevel}
              pathFromRoot={currentPath}
              isTeacher={isTeacher}
            />
          ))}
        </>
      )}

      {/* Loading state for tasks */}
      {isExpanded && isLeaf && loadingTasks && (
        <TableRow className={styles.emptyRow}>
          <TableCell colSpan={3} style={{ paddingLeft: `${(level + 1) * 24 + 48}px` }}>
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
          <TableCell colSpan={3} style={{ paddingLeft: `${(level + 1) * 24 + 48}px` }}>
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
              <TableCell style={{ paddingLeft: `${(level + 1) * 24 + 48}px` }}>
                <Typography variant="body2" color="primary">
                  {task.title}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating value={task.rating} readOnly size="small" precision={0.5} />
                  <Typography variant="caption" color="text.secondary">
                    ({task.rating.toFixed(1)})
                  </Typography>
                </Box>
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
export const TaskTreeView: React.FC<TaskTreeViewProps> = ({ data, onTaskClick, subject, gradeLevel }) => {
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
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TaskTreeView;
