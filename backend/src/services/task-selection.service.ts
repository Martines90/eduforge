import { TextGeneratorService } from "./text-generator.service";

export interface TaskVariation {
  title: string;
  story_text: string;
  questions: string[];
  metadata: any;
}

export interface TaskSelectionCriteria {
  curriculum_path: string;
  difficulty_level: string;
  educational_model: string;
  target_group: string;
}

export interface TaskSelectionResult {
  selected_index: number;
  selected_task: TaskVariation;
  reasoning: string;
  scores: {
    task_1: number;
    task_2: number;
    task_3: number;
  };
  image_visual_description: string; // Visual scene description for image generation (no text, no formulas, no task details)
}

export class TaskSelectionService {
  private textGenerator: TextGeneratorService;

  constructor() {
    this.textGenerator = new TextGeneratorService();
  }

  /**
   * AI selects the best task from 3 variations based on quality criteria
   */
  async selectBestTask(
    variations: TaskVariation[],
    criteria: TaskSelectionCriteria
  ): Promise<TaskSelectionResult> {
    if (variations.length !== 3) {
      throw new Error("Expected exactly 3 task variations");
    }

    console.log("🤖 AI evaluating 3 task variations...");

    const prompt = this.buildSelectionPrompt(variations, criteria);

    const result = await this.textGenerator.generate(prompt, {
      temperature: 0.3, // Lower temperature for more consistent evaluation
      maxTokens: 1500,
    });

    const selection = this.parseSelectionResponse(result.text, variations);

    console.log(
      `✅ AI selected task ${selection.selected_index + 1} with score ${selection.scores[`task_${selection.selected_index + 1}` as keyof typeof selection.scores]}`
    );
    console.log(`   Reasoning: ${selection.reasoning.substring(0, 100)}...`);

    return selection;
  }

  /**
   * Builds the AI prompt for task selection
   */
  private buildSelectionPrompt(
    variations: TaskVariation[],
    criteria: TaskSelectionCriteria
  ): string {
    const topicName =
      criteria.curriculum_path.split(":").pop() || "mathematics";

    return `You are an expert educational task evaluator with deep knowledge of pedagogy and curriculum design.

TASK: Evaluate 3 task variations and select the BEST one based on the criteria below.

TASK VARIATIONS:
---
**Task 1:**
Title: ${variations[0].title}
Story: ${variations[0].story_text}
Questions: ${variations[0].questions.join(" | ")}

**Task 2:**
Title: ${variations[1].title}
Story: ${variations[1].story_text}
Questions: ${variations[1].questions.join(" | ")}

**Task 3:**
Title: ${variations[2].title}
Story: ${variations[2].story_text}
Questions: ${variations[2].questions.join(" | ")}
---

EVALUATION CRITERIA:
- Curriculum Path: ${criteria.curriculum_path}
- Expected Topic: ${topicName}
- Difficulty Level: ${criteria.difficulty_level}
- Educational Model: ${criteria.educational_model}
- Target Group: ${criteria.target_group}

SCORING DIMENSIONS (each 0-10):
1. **Curriculum Alignment** (30% weight): Does the task perfectly address the required curriculum topic?
2. **Difficulty Appropriateness** (25% weight): Is the difficulty level exactly right for ${criteria.difficulty_level}?
3. **Educational Model Fit** (20% weight): Does it support ${criteria.educational_model} learning approach?
4. **Engagement & Context** (15% weight): Is the real-world context realistic, interesting, and culturally appropriate?
5. **Clarity & Solvability** (10% weight): Are the problem and questions clear, unambiguous, and solvable?

INSTRUCTIONS:
1. Evaluate each task on all 5 dimensions
2. Calculate weighted total scores for each task
3. Select the task with the highest score
4. Provide clear reasoning explaining why this task is best
5. Include the scores for all 3 tasks

OUTPUT FORMAT (JSON only, no other text):
{
  "selected_index": <0, 1, or 2 (zero-indexed)>,
  "reasoning": "2-3 sentences explaining why this task was selected and noting key strengths/weaknesses of each",
  "scores": {
    "task_1": <total score 0-10>,
    "task_2": <total score 0-10>,
    "task_3": <total score 0-10>
  },
  "image_visual_description": "Related to the selected task a 2-3 sentence description of the VISUAL SCENE to be illustrated (objects, characters, setting, action). EXCLUDE all task text, questions, formulas, numbers, and educational content. Focus ONLY on what should be visible in the illustration."
}

IMPORTANT:
- Be objective and analytical
- Small differences in scores are acceptable - select based on overall quality
- All tasks should be reasonably good (7+ scores) - you're picking the BEST
- Consider the target audience when evaluating engagement
- The image_visual_description should describe ONLY the visual scene (what objects/characters/setting to draw), NOT the task, story text, or mathematical content
- Output ONLY valid JSON, nothing else`;
  }

  /**
   * Parses the AI selection response
   */
  private parseSelectionResponse(
    responseText: string,
    variations: TaskVariation[]
  ): TaskSelectionResult {
    try {
      // Remove markdown code blocks if present
      let cleanedText = responseText.trim();
      cleanedText = cleanedText.replace(/^```json\s*/i, "");
      cleanedText = cleanedText.replace(/^```\s*/i, "");
      cleanedText = cleanedText.replace(/\s*```$/i, "");
      cleanedText = cleanedText.trim();

      // Try to extract JSON from the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const selectionData = JSON.parse(jsonMatch[0]);

        // Validate selected_index
        const selectedIndex =
          typeof selectionData.selected_index === "number"
            ? selectionData.selected_index
            : 0;

        // Ensure index is valid (0, 1, or 2)
        const validIndex = Math.max(0, Math.min(2, selectedIndex));

        return {
          selected_index: validIndex,
          selected_task: variations[validIndex],
          reasoning:
            selectionData.reasoning ||
            "Selected based on overall quality and curriculum alignment.",
          scores: {
            task_1: selectionData.scores?.task_1 || 7.5,
            task_2: selectionData.scores?.task_2 || 7.5,
            task_3: selectionData.scores?.task_3 || 7.5,
          },
          image_visual_description:
            selectionData.image_visual_description ||
            "A scene depicting the context and setting of the educational task.",
        };
      }
    } catch (error) {
      console.warn("⚠️  Failed to parse selection JSON:", error);
      console.warn("⚠️  Raw response:", responseText.substring(0, 200));
    }

    // Fallback: select the first variation
    console.warn("⚠️  Using fallback selection (task 1)");
    return {
      selected_index: 0,
      selected_task: variations[0],
      reasoning:
        "Selected first variation due to parsing error. All variations appear to meet curriculum requirements.",
      scores: {
        task_1: 8.0,
        task_2: 7.5,
        task_3: 7.5,
      },
      image_visual_description:
        "A scene depicting the context and setting of the educational task.",
    };
  }
}
