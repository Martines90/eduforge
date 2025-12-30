/**
 * Supported countries and their language codes
 */
export type CountryCode = "US" | "HU" | "MX";

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
  Home: string;
  "Task Creator": string;
  "Open navigation menu": string;
  "Close menu": string;

  // Home page
  "Educational Task Platform": string;
  "Create educational tasks based on curriculum topics for grades 9-12": string;
  "Go to Task Creator": string;
  "Search Tasks": string;
  "Browse and discover educational tasks created by teachers": string;
  "Browse Tasks": string;

  // Task Creator page
  "Select a curriculum topic to create an educational task": string;
  "Select Topic": string;
  "Grade 9-10": string;
  "Grade 11-12": string;
  Reset: string;
  "Selection complete": string;
  "Please select a topic to begin": string;
  "Confirm Selection": string;
  Topic: string;
  Path: string;
  "Grade Level": string;
  "Selected Topic": string;
  "Create Task": string;
  "Clear Selection": string;

  // Select component
  "Select an option": string;
  "Select main topic": string;
  "Select sub-topic": string;
  Level: string;

  // General
  Close: string;
  Open: string;
  Menu: string;
  Language: string;
  Country: string;

  // Tasks page
  Tasks: string;
  "Educational Tasks": string;
  "Browse and explore educational tasks for grades 9-12": string;
  "Search tasks...": string;
  Subject: string;
  Grade: string;
  "All Subjects": string;
  "All Grades": string;
  "No Tasks Available Yet": string;
  "Educational tasks will appear here once teachers start creating them. Check back soon!": string;
  "Back to Home": string;
  "Start Task": string;
  Difficulty: string;
  Medium: string;
  "Tree View": string;
  "Grid View": string;
  "Category / Task Title": string;
  "School System": string;
  Rating: string;
  Views: string;
  "Loading tasks...": string;
  "No tasks available for this topic yet": string;
  "No teacher added any tasks yet.": string;
  "Be the first one who creates a new task": string;

  // Subjects
  Mathematics: string;
  Physics: string;
  Chemistry: string;
  Biology: string;
  Informatics: string;
  History: string;
  Geography: string;
  Literature: string;

  // Profile page
  "My Profile": string;
  "View and manage your account information": string;
  "Personal Information": string;
  Name: string;
  Email: string;
  Role: string;
  Teacher: string;
  "Student / General User": string;
  "Password & Security": string;
  "Keep your account secure by changing your password regularly.": string;
  "Change Password": string;
  "Current Password": string;
  "New Password": string;
  "Confirm New Password": string;
  "Must be at least 8 characters long": string;
  Cancel: string;
  "Changing Password...": string;
  "Password changed successfully!": string;
  "View My Tasks": string;
  "Not provided": string;
  "Loading...": string;
  "Loading profile...": string;
  "Redirecting...": string;
  "All password fields are required": string;
  "New password must be at least 8 characters long": string;
  "New password must be different from old password": string;
  "New passwords do not match": string;
  "Failed to change password. Please check your old password and try again.": string;
  "Password change functionality will be implemented with backend API": string;

  // My Tasks page
  "My Tasks": string;
  "View and manage all tasks you've created": string;
  "This page will display all educational tasks you have created. You'll be able to view, edit, and manage your tasks from here.": string;
  "No Tasks Yet": string;
  "You haven't created any tasks yet. Start by creating your first educational task!": string;
  "Create Your First Task": string;
  "Create New Task": string;
  "View Profile": string;
  Created: string;

  // User Menu
  Profile: string;
  "My Subscription": string;
  Logout: string;

  // Educational Models
  "Educational Model": string;
  "Select educational model": string;
  Secular: string;
  Conservative: string;
  Traditional: string;
  Liberal: string;
  Progressive: string;
  "Religious - Christian": string;
  "Religious - Islamic": string;
  "Religious - Jewish": string;
  Montessori: string;
  Waldorf: string;

  // Registration Modal
  "Create Your Account": string;
  "Country & Subject": string;
  "Location and expertise": string;
  "Personal Info": string;
  "Name and Email": string;
  "Verify Email": string;
  "Enter verification code": string;
  "Select your location": string;
  "Select Your Country & Subject": string;
  "Select Your Country": string;
  "Choose your location and primary teaching subject": string;
  "Choose your country to personalize your experience": string;
  "Your Work Information": string;
  "Your Information": string;
  "Full Name": string;
  "Enter your full name": string;
  "Work Email Address": string;
  "Email Address": string;
  Password: string;
  "At least 6 characters": string;
  "Confirm Password": string;
  "Re-enter your password": string;
  Back: string;
  "Sending Code...": string;
  "Create Account": string;
  "Verify Your Email": string;
  "We've sent a 6-digit verification code to": string;
  "Please enter a valid 6-digit code": string;
  "Check the console for your verification code (email sending not yet implemented)": string;
  "Verifying...": string;
  "Verify & Create Account": string;
  "Back to Login": string;
  Next: string;
  "Failed to register user. Please try again.": string;
  "Failed to verify code. Please try again.": string;
  "Registration successful! Welcome to EduForge.": string;
  "Please complete the reCAPTCHA verification": string;
  "reCAPTCHA verification failed. Please try again.": string;

  // Action Selection Modal
  "What would you like to do?": string;
  "Choose your next step for": string;
  Continue: string;

  // Target Group
  "Target Group": string;
  "Mixed (Boys and Girls)": string;
  "Boys Only": string;
  "Girls Only": string;

  // Image Number
  "Number of Images": string;
  "No images (text only)": string;
  "1 image": string;
  "2 images": string;

  // Task Settings
  "Task Settings": string;
  "Difficulty Level": string;
  "Generate Task": string;

  // Task Generation Progress Messages
  "Generating task...": string;
  "Generating 3 task variations in parallel...": string;
  "3 task variations successfully generated!": string;
  "AI is selecting the best variation...": string;
  "Best variation selected (variation": string;
  "Generating images...": string;
  "Generating images and solution...": string;
  "Generating solution...": string;
  "Task successfully completed!": string;
  "Please wait...": string;

  // Task Result Component
  "Generated Task": string;
  "Edit task": string;
  "Edit solution": string;
  Save: string;
  characters: string;
  "{{count}} more characters needed": string;
  "{{count}} characters over limit": string;
  "Task description is too short! At least {{min}} characters required. Current: {{count}} characters.": string;
  "Task description is too long! Maximum {{max}} characters allowed. Current: {{count}} characters.": string;
  "An error occurred while generating the PDF. Please try again.": string;
  "An error occurred while generating the PDF.": string;
  "Image loading failed due to CORS restrictions. The images may not be accessible from this domain.": string;
  "Network error while loading images. Please check your internet connection.": string;
  "Image loading timed out. Please try again or check image URLs.": string;
  "Please try again or contact support if the problem persists.": string;
  "PDF is not ready yet. Please try again in a moment.": string;
  "An error occurred": string;
  "Save Task": string;
  "Saving...": string;
  Questions: string;
  "Solution Steps": string;
  Formula: string;
  Calculation: string;
  Result: string;
  "Final Answer": string;
  Verification: string;
  "Common Mistakes": string;

  // Task Saved Modal
  "Task Saved Successfully!": string;
  "Your task has been saved to the database and is now available publicly.": string;
  "Public Share Link:": string;
  "Link copied to clipboard!": string;
  "Task ID": string;
  "Task ID:": string;
  "Copy Public Share Link": string;
  "Download as PDF": string;
  "PDF download will be implemented soon": string;

  // Task Detail Page
  "Back to Tasks": string;
  Task: string;
  Solution: string;
  Images: string;
  "Created by": string;
  "Copy Share Link": string;
  "Download PDF": string;
  "Share link copied to clipboard!": string;
  review: string;
  reviews: string;

  // Subscription Page
  "Manage Your Subscription": string;
  "View and manage your subscription plan and credits": string;
  "Current Plan": string;
  "Trial Plan": string;
  "Annual Plan": string;
  "No Active Plan": string;
  Status: string;
  Active: string;
  Expired: string;
  Cancelled: string;
  "Trial Period": string;
  Started: string;
  Expires: string;
  "Subscription Period": string;
  "Task Generation Credits": string;
  "Remaining Credits": string;
  credits: string;
  "You have {{count}} task generation credits remaining.": string;
  "Annual Subscription": string;
  "Subscribe to our annual plan for unlimited access to all features.": string;
  "Unlimited task generation": string;
  "Priority support": string;
  "Early access to new features": string;
  "Subscribe Now": string;
  "Coming Soon": string;
  "Annual subscription will be available soon. Stay tuned!": string;

  // Registration Success Message
  "Registration successful, your 3-month free trial subscription just started!": string;

  // Home Page - Guest Users
  "Welcome to EduForge": string;
  "EduForge is a subject and curriculum-specific real-world inspired engaging story/scenario-driven task generator and task library platform for teachers (creators), schools, and for parents/students.": string;
  "As a teacher you can generate any curriculum-specific EduForge task within 10-20 seconds. The tasks will be based on fun/exciting/adventurous/high-stake situations that your class will love for sure!": string;
  "Try It as a Teacher": string;
  "Generate engaging, curriculum-aligned tasks in seconds!": string;
  "Start Generating": string;
  "Discover Our Task Library": string;
  "Browse tasks that fit your curriculum section and pick what you like!": string;
  "Browse Task Library": string;

  // My Plan Page
  "My Plan": string;
  "Manage your subscription and credits": string;
  "Subscription will be cancelled at the end of the current period": string;
  "You started with 100 free task generation credits.": string;
  "Running low on credits? Subscribe to Basic plan for unlimited browsing!": string;
  "Upgrade to Basic Plan": string;
  Recommended: string;
  year: string;
  "Unlimited task browsing": string;
  "Download tasks as PDF": string;
  "Access to all subjects": string;
  "All difficulty levels": string;
  "Email support": string;
  Note: string;
  "This plan is for browsing and downloading tasks only. Task generation credits are not included.": string;
  "Subscribe to Basic Plan": string;
  "Basic plan is currently unavailable. Please try again later.": string;

  // My Subscription Page
  "Running low on credits? Upgrade your plan to get more!": string;
  "Upgrade Your Plan": string;
  "Most Popular": string;
  "View/download task library": string;
  Unlimited: string;
  "Creator contests access": string;
  "Private Discord channel": string;
  "Best School of the Year contest": string;

  // School Teachers Page
  "School Teachers Management": string;
  "Manage teachers from your school (Pro Plan)": string;
  Teachers: string;
  "Invite Teacher": string;
  "School Name": string;
  "No teachers added yet": string;
  "Click \"Invite Teacher\" to add teachers from your school": string;
  "Pro Plan Benefits": string;
  "10,000 Task Generation Credits": string;
  "Shared across all teachers in your school": string;
  "Add Up to 10 Teachers": string;
  "Each teacher gets their own account": string;
  "School Contest Participation": string;
  "Compete for \"Best School of the Year\"": string;

  // Task Detail Page - Guest View Limit
  "Registration Required": string;
  "To have access to the tasks you need to register!": string;
  "Try our FREE 3-month trial mode and unlock unlimited access to thousands of educational tasks.": string;
  "You've used your 3 free task views.": string;
  "Register now to get:": string;
  "Unlimited task viewing": string;
  "100 free task generation credits": string;
  "3 months free trial subscription": string;
  "Login / Register": string;

  // School Teachers Page - Additional
  "Priority 24-hour Support": string;
  "Fast response times for your school": string;
  "Back to Subscription": string;

  // Subscription Cancel Page
  "Payment Cancelled": string;
  "Payment Failed": string;
  "You cancelled the payment process": string;
  "There was a problem processing your payment": string;
  "Error Details": string;
  "What happened?": string;
  "What went wrong?": string;
  "You chose to cancel the subscription checkout process. No charges were made to your account.": string;
  "The payment could not be completed. This might be due to:": string;
  "Insufficient funds in your account": string;
  "Card details were entered incorrectly": string;
  "Your bank declined the transaction": string;
  "Technical issue with the payment provider": string;
  "Try Again": string;
  "Go to Home": string;
  "Need help? Contact our support team at": string;

  // Subscription Success Page
  "Explore EduForge": string;
  "Browse and download tasks from our extensive library": string;
  "Get Started": string;
  "Use your 1,000 credits to start generating custom tasks": string;
  "Add Teachers to Your School": string;
  "Invite up to 10 teachers from your school to join": string;
  "Add Teachers": string;
  "Explore EduForge features": string;
  "Go to Dashboard": string;
  "Processing Your Subscription...": string;
  "Please wait while we activate your subscription": string;
  "Welcome to EduForge!": string;
  "Subscription Activated Successfully": string;
  Basic: string;
  Normal: string;
  Pro: string;
  "Your Credits": string;
  "Task Generation Credits Available": string;
  "View Subscription": string;
  "Thank you for choosing EduForge. We sent a confirmation email to your inbox.": string;

  // Task Generator Page
  "Task Generator": string;
  "Try 3 FREE task generations - No account required!": string;

  // Header
  "Try Free": string;
  "Generate Tasks": string;
}

export type TranslationKey = keyof Translations;

/**
 * User identity types
 */
export type UserIdentity = "teacher" | "non-teacher";
export type UserRole = "guest" | "registered" | "admin";

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
  | "mathematics"
  | "physics"
  | "chemistry"
  | "biology"
  | "information_technology"
  | "history"
  | "geography"
  | "literature";
