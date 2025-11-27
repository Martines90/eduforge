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
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';
import { TreeNode, TaskItem } from '@/types/task-tree';
import { useTranslation } from '@/lib/i18n';
import styles from './TaskTreeView.module.scss';

export interface TaskTreeViewProps {
  data: TreeNode[];
  onTaskClick?: (task: TaskItem) => void;
}

interface RowProps {
  node: TreeNode;
  level: number;
  onTaskClick?: (task: TaskItem) => void;
}

/**
 * Recursive Row Component
 * Renders a single tree node with expand/collapse functionality
 */
const TreeRow: React.FC<RowProps> = ({ node, level, onTaskClick }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>(node.tasks || []);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const hasChildren = node.subTopics && node.subTopics.length > 0;
  const isLeaf = !hasChildren; // Leaf nodes can have tasks
  const hasTasks = tasks.length > 0;

  const handleToggle = async () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    // If expanding a leaf node and tasks haven't been loaded yet
    if (newExpandedState && isLeaf && tasks.length === 0 && !loadingTasks) {
      setLoadingTasks(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/v2/tasks?subjectMappingId=${node.key}&isPublished=true`);
        // const data = await response.json();
        // setTasks(data.tasks);

        // For now, keep existing sample data if provided
        console.log('Would fetch tasks for leaf node:', node.key);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoadingTasks(false);
      }
    }
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
            {(hasChildren || hasTasks) && (
              <IconButton
                size="small"
                onClick={handleToggle}
                className={styles.expandButton}
              >
                {isExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
              </IconButton>
            )}
            {!hasChildren && !hasTasks && <Box sx={{ width: 40 }} />}
            <Typography
              variant={level <= 1 ? 'subtitle1' : 'body2'}
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
            />
          ))}
        </>
      )}

      {/* Loading state for tasks */}
      {isExpanded && isLeaf && loadingTasks && (
        <TableRow className={styles.taskRow}>
          <TableCell colSpan={3} style={{ paddingLeft: `${(level + 1) * 24 + 48}px` }}>
            <Typography variant="body2" color="text.secondary">
              {t('Loading tasks...')}
            </Typography>
          </TableCell>
        </TableRow>
      )}

      {/* No tasks message for empty leaf nodes */}
      {isExpanded && isLeaf && !loadingTasks && !hasTasks && (
        <TableRow className={styles.taskRow}>
          <TableCell colSpan={3} style={{ paddingLeft: `${(level + 1) * 24 + 48}px` }}>
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              {t('No tasks available for this topic yet')}
            </Typography>
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
              onClick={() => onTaskClick?.(task)}
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
export const TaskTreeView: React.FC<TaskTreeViewProps> = ({ data, onTaskClick }) => {
  const { t } = useTranslation();

  return (
    <TableContainer component={Paper} className={styles.treeContainer}>
      <Table stickyHeader>
        <TableHead>
          <TableRow className={styles.headerRow}>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('Category / Task Title')}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('Rating')}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('Views')}
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((node) => (
            <TreeRow key={node.key} node={node} level={0} onTaskClick={onTaskClick} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TaskTreeView;
