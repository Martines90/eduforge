import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  IconButton,
  Typography,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button } from '@/components/atoms/Button';

interface CustomQuestion {
  question: string;
  score?: number;
}

interface CustomTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    customTitle: string;
    customText: string;
    customQuestions?: CustomQuestion[];
    score?: number;
  }) => Promise<void>;
  initialData?: {
    customTitle?: string;
    customText?: string;
    customQuestions?: CustomQuestion[];
    score?: number;
  };
}

/**
 * Custom Task Dialog Component
 * Allows teachers to create custom tasks (text-only, no images)
 */
export const CustomTaskDialog: React.FC<CustomTaskDialogProps> = ({
  open,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState(initialData?.customTitle || '');
  const [text, setText] = useState(initialData?.customText || '');
  const [questions, setQuestions] = useState<CustomQuestion[]>(
    initialData?.customQuestions || []
  );
  const [totalScore, setTotalScore] = useState<number | undefined>(
    initialData?.score
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', score: undefined }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: 'question' | 'score', value: string | number) => {
    const updated = [...questions];
    if (field === 'question') {
      updated[index].question = value as string;
    } else {
      updated[index].score = value ? Number(value) : undefined;
    }
    setQuestions(updated);
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!text.trim()) {
      setError('Task description is required');
      return;
    }

    // Validate questions if they exist
    if (questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        if (!questions[i].question.trim()) {
          setError(`Question ${i + 1} cannot be empty`);
          return;
        }
      }
    }

    try {
      setIsSaving(true);
      setError(null);

      await onSave({
        customTitle: title.trim(),
        customText: text.trim(),
        customQuestions: questions.length > 0 ? questions : undefined,
        score: totalScore,
      });

      // Reset form
      setTitle('');
      setText('');
      setQuestions([]);
      setTotalScore(undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save custom task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData ? 'Edit Custom Task' : 'Create Custom Task'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Error Alert */}
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {/* Title */}
          <TextField
            label="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            autoFocus
            placeholder="e.g., Solve the equation"
            helperText="A short descriptive title for the task"
          />

          {/* Task Description */}
          <TextField
            label="Task Description"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            fullWidth
            multiline
            rows={6}
            placeholder="Enter the full task description here. You can include problem statements, instructions, or any relevant information."
            helperText="The main content of your custom task. You can use basic HTML formatting if needed."
          />

          <Divider />

          {/* Questions Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Questions (Optional)
              </Typography>
              <Button
                variant="secondary"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddQuestion}
              >
                Add Question
              </Button>
            </Box>

            {questions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No questions added yet. Click "Add Question" to add sub-questions with individual scores.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {questions.map((q, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'flex-start',
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                    }}
                  >
                    <Typography sx={{ minWidth: 30, pt: 2 }}>
                      {index + 1}.
                    </Typography>
                    <TextField
                      label="Question"
                      value={q.question}
                      onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                      fullWidth
                      placeholder="e.g., Calculate the value of x"
                      size="small"
                    />
                    <TextField
                      label="Score"
                      type="number"
                      value={q.score || ''}
                      onChange={(e) => handleQuestionChange(index, 'score', e.target.value)}
                      sx={{ width: 100 }}
                      placeholder="Points"
                      size="small"
                      inputProps={{ min: 0, step: 0.5 }}
                    />
                    <IconButton
                      onClick={() => handleRemoveQuestion(index)}
                      color="error"
                      size="small"
                      sx={{ mt: 0.5 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Divider />

          {/* Total Score */}
          <TextField
            label="Total Score (Optional)"
            type="number"
            value={totalScore || ''}
            onChange={(e) => setTotalScore(e.target.value ? Number(e.target.value) : undefined)}
            sx={{ width: 200 }}
            placeholder="Total points"
            helperText="Overall score for this task"
            inputProps={{ min: 0, step: 0.5 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving || !title.trim() || !text.trim()}
        >
          {isSaving ? 'Saving...' : initialData ? 'Update' : 'Add to Test'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
