import * as fs from "fs";
import * as path from "path";

/**
 * Reference task structure from inspirational_reference_tasks.json
 */
export interface ReferenceTask {
  tags: string;
  title: string;
  description: string;
}

/**
 * Randomly selects N reference tasks from the inspirational reference tasks JSON
 * @param count Number of tasks to select (default: 6)
 * @returns Array of randomly selected reference tasks
 */
export function selectRandomReferenceTasks(count: number = 6): ReferenceTask[] {
  const tasksPath = path.join(
    __dirname,
    "../genai/prompts/inspirational_reference_tasks.json"
  );

  try {
    const tasksData = fs.readFileSync(tasksPath, "utf-8");
    const allTasks: ReferenceTask[] = JSON.parse(tasksData);

    if (!Array.isArray(allTasks) || allTasks.length === 0) {
      console.warn("⚠️  No reference tasks found in JSON");
      return [];
    }

    // Shuffle and select random tasks
    const shuffled = [...allTasks].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, allTasks.length));

    console.log(`✅ Selected ${selected.length} random reference tasks`);
    return selected;
  } catch (error) {
    console.error("❌ Error loading reference tasks:", error);
    return [];
  }
}

/**
 * Formats reference tasks for inclusion in the system prompt
 * @param tasks Array of reference tasks
 * @returns Formatted string for prompt inclusion
 */
export function formatReferenceTasksForPrompt(tasks: ReferenceTask[]): string {
  if (tasks.length === 0) {
    return "";
  }

  let formatted = "\n## REFERENCE STYLE TASKS\n\n";
  formatted += "Use these tasks as **style reference only**. Study their:\n";
  formatted += "- Narrative structure and tone\n";
  formatted += "- How they contextualize math problems in real-world scenarios\n";
  formatted += "- Level of detail and engagement\n";
  formatted += "- Question formulation approach\n\n";
  formatted += "**DO NOT copy their specific content, stories, numbers, or context. Create original content.**\n\n";

  tasks.forEach((task, index) => {
    formatted += `### Reference Task ${index + 1}: ${task.title}\n\n`;
    formatted += `**Tags:** ${task.tags}\n\n`;
    formatted += `**Description:**\n${task.description}\n\n`;
    formatted += "---\n\n";
  });

  return formatted;
}
