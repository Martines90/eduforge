import { Subject } from '@/types/i18n';
import { CountryCode } from '@/types/i18n';

export interface SubjectOption {
  value: Subject;
  labelEN: string;
  labelHU: string;
  emoji: string;
  category?: 'stem' | 'humanities' | 'arts' | 'other';
}

export const SUBJECTS: SubjectOption[] = [
  // STEM Subjects
  { value: 'mathematics', labelEN: 'Mathematics', labelHU: 'Matematika', emoji: '🔢', category: 'stem' },
  { value: 'physics', labelEN: 'Physics', labelHU: 'Fizika', emoji: '⚛️', category: 'stem' },
  { value: 'chemistry', labelEN: 'Chemistry', labelHU: 'Kémia', emoji: '🧪', category: 'stem' },
  { value: 'biology', labelEN: 'Biology', labelHU: 'Biológia', emoji: '🧬', category: 'stem' },
  { value: 'computer-science', labelEN: 'Computer Science', labelHU: 'Informatika', emoji: '💻', category: 'stem' },

  // Humanities & Social Sciences
  { value: 'history', labelEN: 'History', labelHU: 'Történelem', emoji: '📜', category: 'humanities' },
  { value: 'geography', labelEN: 'Geography', labelHU: 'Földrajz', emoji: '🌍', category: 'humanities' },
  { value: 'social-studies', labelEN: 'Social Studies', labelHU: 'Társadalomismeret', emoji: '👥', category: 'humanities' },
  { value: 'economics', labelEN: 'Economics', labelHU: 'Közgazdaságtan', emoji: '📊', category: 'humanities' },
  { value: 'philosophy', labelEN: 'Philosophy', labelHU: 'Filozófia', emoji: '🤔', category: 'humanities' },
  { value: 'psychology', labelEN: 'Psychology', labelHU: 'Pszichológia', emoji: '🧠', category: 'humanities' },

  // Languages & Literature
  { value: 'literature', labelEN: 'Literature', labelHU: 'Irodalom', emoji: '📚', category: 'humanities' },
  { value: 'english', labelEN: 'English Language', labelHU: 'Angol nyelv', emoji: '🔤', category: 'humanities' },
  { value: 'foreign-languages', labelEN: 'Foreign Languages', labelHU: 'Idegen nyelvek', emoji: '🌐', category: 'humanities' },

  // Arts & Physical Education
  { value: 'arts', labelEN: 'Visual Arts', labelHU: 'Rajz és vizuális kultúra', emoji: '🎨', category: 'arts' },
  { value: 'music', labelEN: 'Music', labelHU: 'Ének-zene', emoji: '🎵', category: 'arts' },
  { value: 'drama', labelEN: 'Drama/Theater', labelHU: 'Dráma és tánc', emoji: '🎭', category: 'arts' },
  { value: 'physical-education', labelEN: 'Physical Education', labelHU: 'Testnevelés', emoji: '⚽', category: 'other' },

  // Other
  { value: 'religious-studies', labelEN: 'Religious Studies', labelHU: 'Hittan/Etika', emoji: '🕊️', category: 'other' },
  { value: 'health-education', labelEN: 'Health Education', labelHU: 'Egészségnevelés', emoji: '🏥', category: 'other' },
];

/**
 * Get subject label based on country/language
 */
export function getSubjectLabel(subject: Subject, country: CountryCode): string {
  const subjectOption = SUBJECTS.find(s => s.value === subject);
  if (!subjectOption) return subject;

  return country === 'HU' ? subjectOption.labelHU : subjectOption.labelEN;
}

/**
 * Get all subjects with labels for a specific country
 */
export function getSubjectsForCountry(country: CountryCode): Array<{ value: Subject; label: string; emoji: string }> {
  return SUBJECTS.map(subject => ({
    value: subject.value,
    label: country === 'HU' ? subject.labelHU : subject.labelEN,
    emoji: subject.emoji,
  }));
}
