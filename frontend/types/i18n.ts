/**
 * Supported countries and their language codes
 */
export type CountryCode = 'US' | 'HU';

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  language: string;
}

/**
 * Translation keys structure
 */
export interface Translations {
  // Navigation
  'Home': string;
  'Task Creator': string;
  'Open navigation menu': string;
  'Close menu': string;

  // Home page
  'Create educational tasks based on curriculum topics for grades 9-12': string;
  'Go to Task Creator': string;

  // Task Creator page
  'Select a curriculum topic to create an educational task': string;
  'Select Topic': string;
  'Grade 9-10': string;
  'Grade 11-12': string;
  'Reset': string;
  'Selection complete': string;
  'Please select a topic to begin': string;
  'Confirm Selection': string;
  'Topic': string;
  'Path': string;
  'Grade Level': string;
  'Selected Topic': string;
  'Create Task': string;
  'Clear Selection': string;

  // Select component
  'Select an option': string;
  'Select main topic': string;
  'Select sub-topic': string;
  'Level': string;

  // General
  'Close': string;
  'Open': string;
  'Menu': string;
  'Language': string;
  'Country': string;

  // Tasks page
  'Tasks': string;
  'Educational Tasks': string;
  'Browse and explore educational tasks for grades 9-12': string;
  'Search tasks...': string;
  'Subject': string;
  'Grade': string;
  'All Subjects': string;
  'All Grades': string;
  'No Tasks Available Yet': string;
  'Educational tasks will appear here once teachers start creating them. Check back soon!': string;
  'Back to Home': string;
  'Start Task': string;
  'Difficulty': string;
  'Medium': string;
  'Tree View': string;
  'Grid View': string;
  'Category / Task Title': string;
  'School System': string;
  'Rating': string;
  'Views': string;
  'Loading tasks...': string;
  'No tasks available for this topic yet': string;
  'No teacher added any tasks yet.': string;
  'Be the first one who creates a new task': string;

  // Subjects
  'Mathematics': string;
  'Physics': string;
  'Chemistry': string;
  'Biology': string;
  'Geography': string;

  // Profile page
  'My Profile': string;
  'View and manage your account information': string;
  'Personal Information': string;
  'Name': string;
  'Email': string;
  'Role': string;
  'Teacher': string;
  'Student / General User': string;
  'Password & Security': string;
  'Keep your account secure by changing your password regularly.': string;
  'Change Password': string;
  'Current Password': string;
  'New Password': string;
  'Confirm New Password': string;
  'Must be at least 8 characters long': string;
  'Cancel': string;
  'Changing Password...': string;
  'Password changed successfully!': string;
  'View My Tasks': string;
  'Not provided': string;
  'Loading...': string;
  'Loading profile...': string;
  'Redirecting...': string;
  'All password fields are required': string;
  'New password must be at least 8 characters long': string;
  'New password must be different from old password': string;
  'New passwords do not match': string;
  'Failed to change password. Please check your old password and try again.': string;
  'Password change functionality will be implemented with backend API': string;

  // My Tasks page
  'My Tasks': string;
  'View and manage all tasks you\'ve created': string;
  'This page will display all educational tasks you have created. You\'ll be able to view, edit, and manage your tasks from here.': string;
  'No Tasks Yet': string;
  'You haven\'t created any tasks yet. Start by creating your first educational task!': string;
  'Create Your First Task': string;
  'Create New Task': string;
  'View Profile': string;
  'Created': string;

  // User Menu
  'Profile': string;
  'Logout': string;

  // Educational Models
  'Educational Model': string;
  'Select educational model': string;
  'Secular': string;
  'Conservative': string;
  'Traditional': string;
  'Liberal': string;
  'Progressive': string;
  'Religious - Christian': string;
  'Religious - Islamic': string;
  'Religious - Jewish': string;
  'Montessori': string;
  'Waldorf': string;

  // Registration Modal
  'Create Your Account': string;
  'Country & Subject': string;
  'Location and expertise': string;
  'Personal Info': string;
  'Name and Email': string;
  'Verify Email': string;
  'Enter verification code': string;
  'Select your location': string;
  'Select Your Country & Subject': string;
  'Select Your Country': string;
  'Choose your location and primary teaching subject': string;
  'Choose your country to personalize your experience': string;
  'Your Work Information': string;
  'Your Information': string;
  'Full Name': string;
  'Enter your full name': string;
  'Work Email Address': string;
  'Email Address': string;
  'Password': string;
  'At least 6 characters': string;
  'Confirm Password': string;
  'Re-enter your password': string;
  'Back': string;
  'Sending Code...': string;
  'Create Account': string;
  'Verify Your Email': string;
  'We\'ve sent a 6-digit verification code to': string;
  'Please enter a valid 6-digit code': string;
  'Check the console for your verification code (email sending not yet implemented)': string;
  'Verifying...': string;
  'Verify & Create Account': string;
  'Back to Login': string;
  'Next': string;
  'Failed to register user. Please try again.': string;
  'Failed to verify code. Please try again.': string;
  'Registration successful! Welcome to EduForge.': string;

  // Action Selection Modal
  'What would you like to do?': string;
  'Choose your next step for': string;
  'Continue': string;

  // Target Group
  'Target Group': string;
  'Mixed (Boys and Girls)': string;
  'Boys Only': string;
  'Girls Only': string;

  // Image Number
  'Number of Images': string;
  'No images (text only)': string;
  '1 image': string;
  '2 images': string;
}

export type TranslationKey = keyof Translations;

/**
 * User identity types
 */
export type UserIdentity = 'teacher' | 'non-teacher';
export type UserRole = 'guest' | 'registered' | 'admin';

/**
 * User authentication state
 */
export interface UserProfile {
  email: string;
  name: string;
  registeredAt: string;
  token?: string; // JWT token for future authentication
}

/**
 * Subject types for teachers
 */
export type Subject =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'computer-science'
  | 'history'
  | 'geography'
  | 'social-studies'
  | 'economics'
  | 'philosophy'
  | 'psychology'
  | 'literature'
  | 'english'
  | 'foreign-languages'
  | 'arts'
  | 'music'
  | 'drama'
  | 'physical-education'
  | 'religious-studies'
  | 'health-education';
