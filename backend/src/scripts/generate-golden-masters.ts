/**
 * GOLDEN MASTER GENERATOR
 *
 * Generates reference prompt files for all subject × grade combinations.
 * These golden masters serve as regression tests to ensure prompts remain consistent.
 *
 * Usage:
 *   npx ts-node src/scripts/generate-golden-masters.ts
 *
 * Updates:
 *   npx ts-node src/scripts/generate-golden-masters.ts --update
 */

import * as fs from "fs";
import * as path from "path";
import type { Subject } from "@eduforger/shared";
import type { TaskGeneratorRequest } from "../types/task-generator.types";
import { TaskGeneratorService } from "../services/task-generator.service";
import { TextGeneratorService } from "../services/text-generator.service";

// Real curriculum paths for all 8 subjects × 3 grades = 24 combinations
const CURRICULUM_PATHS = [
  // BIOLOGY
  {
    subject: "biology" as Subject,
    grade: "grade_10_12",
    path: "MX:biology:grade_10_12:acidos_nucleicos:estructura_adn:modelo_watson_crick",
    topicName: "Modelo Watson-Crick",
  },
  {
    subject: "biology" as Subject,
    grade: "grade_7_9",
    path: "MX:biology:grade_7_9:biodiversidad_conservacion_mexico:amenazas_biodiversidad:cambio_climatico_biodiversidad",
    topicName: "Cambio Climático y Biodiversidad",
  },
  {
    subject: "biology" as Subject,
    grade: "grade_3_6",
    path: "MX:biology:grade_3_6:adaptaciones_seres_vivos:adaptaciones_proteccion:mimetismo_aposematismo",
    topicName: "Mimetismo y Aposematismo",
  },

  // CHEMISTRY
  {
    subject: "chemistry" as Subject,
    grade: "grade_10_12",
    path: "MX:chemistry:grade_10_12:equilibrio_quimico:concepto_equilibrio:caracteristicas_equilibrio",
    topicName: "Características del Equilibrio",
  },
  {
    subject: "chemistry" as Subject,
    grade: "grade_7_9",
    path: "MX:chemistry:grade_7_9:enlaces_quimicos:enlace_ionico:compuestos_ionicos",
    topicName: "Compuestos Iónicos",
  },
  {
    subject: "chemistry" as Subject,
    grade: "grade_3_6",
    path: "MX:chemistry:grade_3_6:energia_transformaciones:formas_energia:energia_termica",
    topicName: "Energía Térmica",
  },

  // GEOGRAPHY
  {
    subject: "geography" as Subject,
    grade: "grade_10_12",
    path: "MX:geography:grade_10_12:desigualdad_desarrollo:desarrollo_humano:igualdad_genero",
    topicName: "Igualdad de Género",
  },
  {
    subject: "geography" as Subject,
    grade: "grade_7_9",
    path: "MX:geography:grade_7_9:concentracion_urbana_rural:conceptos_urbano_rural:definicion_espacio_urbano",
    topicName: "Definición de Espacio Urbano",
  },
  {
    subject: "geography" as Subject,
    grade: "grade_3_6",
    path: "MX:geography:grade_3_6:clima_elementos:climas_mexico:importancia_clima",
    topicName: "Importancia del Clima",
  },

  // HISTORY
  {
    subject: "history" as Subject,
    grade: "grade_10_12",
    path: "MX:history:grade_10_12:independencia_mexico:causas_independencia:crisis_1808",
    topicName: "Crisis de 1808",
  },
  {
    subject: "history" as Subject,
    grade: "grade_7_9",
    path: "MX:history:grade_7_9:guerra_fria:conflictos_guerra_fria:guerra_vietnam",
    topicName: "Guerra de Vietnam",
  },
  {
    subject: "history" as Subject,
    grade: "grade_3_6",
    path: "MX:history:grade_3_6:mesoamerica_concepto_caracteristicas:definicion_mesoamerica:diversidad_geografica",
    topicName: "Diversidad Geográfica de Mesoamérica",
  },

  // INFORMATICS
  {
    subject: "informatics" as Subject,
    grade: "grade_10_12",
    path: "MX:informatics:grade_10_12:desarrollo_movil:responsive_mobile:rendimiento_movil",
    topicName: "Rendimiento Móvil",
  },
  {
    subject: "informatics" as Subject,
    grade: "grade_7_9",
    path: "MX:informatics:grade_7_9:diseño_estilo_web:diseño_responsive:media_queries",
    topicName: "Media Queries",
  },
  {
    subject: "informatics" as Subject,
    grade: "grade_3_6",
    path: "MX:informatics:grade_3_6:contenido_multimedia:imagenes_digitales",
    topicName: "Imágenes Digitales",
  },

  // LITERATURE
  {
    subject: "literature" as Subject,
    grade: "grade_10_12",
    path: "MX:literature:grade_10_12:literatura_colonial_independencia_latinoamericana:cronicas_america",
    topicName: "Crónicas de América",
  },
  {
    subject: "literature" as Subject,
    grade: "grade_7_9",
    path: "MX:literature:grade_7_9:escritura_creativa:escritura_narrativa:describir_ambientes",
    topicName: "Describir Ambientes",
  },
  {
    subject: "literature" as Subject,
    grade: "grade_3_6",
    path: "MX:literature:grade_3_6:composicion_poetica:tipos_poemas",
    topicName: "Tipos de Poemas",
  },

  // MATHEMATICS
  {
    subject: "mathematics" as Subject,
    grade: "grade_10_12",
    path: "MX:mathematics:grade_10_12:estadistica_descriptiva:medidas_tendencia_central:media_aritmetica",
    topicName: "Media Aritmética",
  },
  {
    subject: "mathematics" as Subject,
    grade: "grade_7_9",
    path: "MX:mathematics:grade_7_9:funciones:funcion_lineal:graficacion_funciones_lineales",
    topicName: "Graficación de Funciones Lineales",
  },
  {
    subject: "mathematics" as Subject,
    grade: "grade_3_6",
    path: "MX:mathematics:grade_3_6:medidas_tendencia_central:mediana:concepto_mediana",
    topicName: "Concepto de Mediana",
  },

  // PHYSICS
  {
    subject: "physics" as Subject,
    grade: "grade_10_12",
    path: "MX:physics:grade_10_12:fisica_contemporanea:laseres:aplicaciones_laser",
    topicName: "Aplicaciones del Láser",
  },
  {
    subject: "physics" as Subject,
    grade: "grade_7_9",
    path: "MX:physics:grade_7_9:electrostatica:metodos_electrizacion:electrizacion_frotamiento",
    topicName: "Electrización por Frotamiento",
  },
  {
    subject: "physics" as Subject,
    grade: "grade_3_6",
    path: "MX:physics:grade_3_6:fases_luna_mareas:luna_satelite:caracteristicas_luna",
    topicName: "Características de la Luna",
  },
];

/**
 * Fixed random sequence for deterministic hint selection
 * This ensures the same hints are picked every time
 */
const FIXED_RANDOM_SEQUENCE = [
  0.42, 0.17, 0.89, 0.33, 0.76, 0.51, 0.94, 0.22, 0.68, 0.11, 0.85, 0.39, 0.72,
  0.56, 0.98, 0.27, 0.63, 0.14, 0.81, 0.44, 0.77, 0.29, 0.92, 0.35, 0.69, 0.18,
  0.83, 0.46, 0.74, 0.21, 0.95, 0.38, 0.66, 0.13, 0.87, 0.41, 0.79, 0.31, 0.96,
  0.24, 0.61, 0.15, 0.88, 0.43, 0.71, 0.26, 0.93, 0.36, 0.64, 0.19,
];

interface CapturedPrompt {
  systemPrompt: string;
  userMessage: string;
}

/**
 * Generate golden master files for all subject × grade combinations
 */
async function generateGoldenMasters(updateExisting: boolean = false) {
  console.log("\n" + "=".repeat(100));
  console.log("🎯 GOLDEN MASTER GENERATOR");
  console.log("=".repeat(100));
  console.log(
    `Mode: ${updateExisting ? "UPDATE existing golden masters" : "Generate NEW golden masters"}\n`
  );

  // Save original Math.random
  const originalRandom = Math.random;

  // Fix Math.random for deterministic results
  let randomCallCount = 0;
  Math.random = () => {
    const value =
      FIXED_RANDOM_SEQUENCE[randomCallCount % FIXED_RANDOM_SEQUENCE.length];
    randomCallCount++;
    return value;
  };

  const taskGeneratorService = new TaskGeneratorService();
  let capturedPrompts: CapturedPrompt | null = null;

  // Mock TextGeneratorService to capture prompts
  const originalGenerate = TextGeneratorService.prototype.generateWithSystemPrompt;
  TextGeneratorService.prototype.generateWithSystemPrompt = async function (
    systemPrompt: string,
    userMessage: string
  ) {
    capturedPrompts = { systemPrompt, userMessage };

    // Return mock response
    return {
      text: JSON.stringify({
        title: "Mock Task",
        description: "Mock description",
        questions: ["Mock question?"],
      }),
      tokens: 1500,
      cost: 0.02,
    };
  };

  const goldenMastersDir = path.join(
    __dirname,
    "../services/__tests__/golden-masters"
  );

  let successCount = 0;
  let errorCount = 0;

  // Generate golden masters for all 24 combinations
  for (const combo of CURRICULUM_PATHS) {
    console.log("\n" + "-".repeat(100));
    console.log(
      `📋 Generating: ${combo.subject.toUpperCase()} - ${combo.grade} - ${combo.topicName}`
    );
    console.log("-".repeat(100));

    try {
      // Reset random counter for each combination (for consistency)
      randomCallCount = 0;
      capturedPrompts = null;

      const request: TaskGeneratorRequest & {
        variation_index?: number;
        assigned_location?: string;
      } = {
        curriculum_path: combo.path,
        country_code: "MX",
        target_group: "mixed",
        difficulty_level: "medium",
        educational_model: "liberal",
        display_template: "modern",
        precision_settings: {
          constant_precision: 2,
          intermediate_precision: 4,
          final_answer_precision: 2,
          use_exact_values: false,
        },
        custom_keywords: [],
        template_id: "",
        variation_index: 1, // Always use variation 1 for golden masters
        assigned_location: "North America", // Fixed location for determinism
      };

      // Generate task (this captures the prompts)
      await taskGeneratorService.generateTaskTextOnly(request);

      if (!capturedPrompts) {
        throw new Error("Failed to capture prompts");
      }

      // TypeScript needs explicit assertion after null check
      const prompts: CapturedPrompt = capturedPrompts;
      const systemPrompt = prompts.systemPrompt;
      const userMessage = prompts.userMessage;

      // Create directory
      const outputDir = path.join(
        goldenMastersDir,
        "mx",
        combo.grade,
        combo.subject
      );
      fs.mkdirSync(outputDir, { recursive: true });

      // Write system prompt
      const systemPromptPath = path.join(outputDir, "system_message.md");
      fs.writeFileSync(systemPromptPath, systemPrompt, "utf-8");

      // Write user message (formatted JSON)
      const userMessagePath = path.join(outputDir, "user_message.json");
      const userMessageObj = JSON.parse(userMessage);
      fs.writeFileSync(
        userMessagePath,
        JSON.stringify(userMessageObj, null, 2),
        "utf-8"
      );

      console.log(`   ✅ System prompt: ${systemPrompt.length.toLocaleString()} chars`);
      console.log(`   ✅ User message: ${userMessage.length.toLocaleString()} chars`);
      console.log(`   ✅ Saved to: ${outputDir}`);

      successCount++;
    } catch (error) {
      console.error(`   ❌ ERROR: ${error}`);
      errorCount++;
    }
  }

  // Restore original Math.random
  Math.random = originalRandom;

  // Restore original TextGeneratorService
  TextGeneratorService.prototype.generateWithSystemPrompt = originalGenerate;

  // Summary
  console.log("\n" + "=".repeat(100));
  console.log("📊 GOLDEN MASTER GENERATION COMPLETE");
  console.log("=".repeat(100));
  console.log(`✅ Successful: ${successCount}/${CURRICULUM_PATHS.length}`);
  console.log(`❌ Errors: ${errorCount}/${CURRICULUM_PATHS.length}`);
  console.log(`📁 Location: ${goldenMastersDir}`);
  console.log("\n📝 Next steps:");
  console.log("   1. Review the generated golden masters");
  console.log(
    "   2. Run tests: npm test -- golden-master.test.ts"
  );
  console.log(
    "   3. Commit golden masters to git for regression protection"
  );
  console.log("=".repeat(100) + "\n");

  process.exit(errorCount > 0 ? 1 : 0);
}

// Run generator
const args = process.argv.slice(2);
const updateMode = args.includes("--update") || args.includes("-u");

generateGoldenMasters(updateMode).catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
