/**
 * Unit tests for Measurement System Helper
 * Tests measurement system detection and language mapping
 */

import {
  getMeasurementSystem,
  getLanguageForCountry,
  MeasurementSystem,
} from "../measurement-system.helper";

describe("Measurement System Helper", () => {
  describe("getMeasurementSystem", () => {
    describe("Imperial System Countries", () => {
      test.each([
        { country: "US", name: "United States" },
        { country: "MM", name: "Myanmar" },
        { country: "LR", name: "Liberia" },
      ])("should return imperial for $name ($country)", ({ country }) => {
        const result = getMeasurementSystem(country);
        expect(result).toBe("imperial");
      });

      it("should handle lowercase country codes for imperial countries", () => {
        expect(getMeasurementSystem("us")).toBe("imperial");
        expect(getMeasurementSystem("mm")).toBe("imperial");
        expect(getMeasurementSystem("lr")).toBe("imperial");
      });

      it("should handle mixed case country codes for imperial countries", () => {
        expect(getMeasurementSystem("Us")).toBe("imperial");
        expect(getMeasurementSystem("Mm")).toBe("imperial");
        expect(getMeasurementSystem("Lr")).toBe("imperial");
      });
    });

    describe("Metric System Countries", () => {
      test.each([
        { country: "HU", name: "Hungary" },
        { country: "DE", name: "Germany" },
        { country: "FR", name: "France" },
        { country: "ES", name: "Spain" },
        { country: "IT", name: "Italy" },
        { country: "GB", name: "United Kingdom" },
        { country: "CA", name: "Canada" },
        { country: "AU", name: "Australia" },
        { country: "NZ", name: "New Zealand" },
        { country: "JP", name: "Japan" },
        { country: "CN", name: "China" },
        { country: "KR", name: "South Korea" },
        { country: "IN", name: "India" },
        { country: "BR", name: "Brazil" },
        { country: "MX", name: "Mexico" },
        { country: "AR", name: "Argentina" },
      ])("should return metric for $name ($country)", ({ country }) => {
        const result = getMeasurementSystem(country);
        expect(result).toBe("metric");
      });

      it("should handle lowercase country codes for metric countries", () => {
        expect(getMeasurementSystem("hu")).toBe("metric");
        expect(getMeasurementSystem("de")).toBe("metric");
        expect(getMeasurementSystem("gb")).toBe("metric");
      });

      it("should handle mixed case country codes for metric countries", () => {
        expect(getMeasurementSystem("Hu")).toBe("metric");
        expect(getMeasurementSystem("De")).toBe("metric");
        expect(getMeasurementSystem("Gb")).toBe("metric");
      });
    });

    describe("Unknown Countries", () => {
      it("should default to metric for unknown country codes", () => {
        expect(getMeasurementSystem("XX")).toBe("metric");
        expect(getMeasurementSystem("ZZ")).toBe("metric");
        expect(getMeasurementSystem("UNKNOWN")).toBe("metric");
      });

      it("should default to metric for empty string", () => {
        expect(getMeasurementSystem("")).toBe("metric");
      });

      it("should default to metric for invalid codes", () => {
        expect(getMeasurementSystem("123")).toBe("metric");
        expect(getMeasurementSystem("!@#")).toBe("metric");
      });
    });

    describe("Return Type", () => {
      it("should return MeasurementSystem type", () => {
        const result = getMeasurementSystem("US");
        const validValues: MeasurementSystem[] = ["metric", "imperial"];

        expect(validValues).toContain(result);
      });
    });
  });

  describe("getLanguageForCountry", () => {
    describe("English-Speaking Countries", () => {
      test.each([
        { country: "US", language: "English" },
        { country: "GB", language: "English" },
        { country: "CA", language: "English" },
        { country: "AU", language: "English" },
        { country: "NZ", language: "English" },
        { country: "IE", language: "English" },
        { country: "IN", language: "English" },
      ])("should return English for $country", ({ country, language }) => {
        expect(getLanguageForCountry(country)).toBe(language);
      });
    });

    describe("European Languages", () => {
      test.each([
        { country: "HU", language: "Hungarian" },
        { country: "DE", language: "German" },
        { country: "AT", language: "German" },
        { country: "CH", language: "German" },
        { country: "FR", language: "French" },
        { country: "BE", language: "French" },
        { country: "ES", language: "Spanish" },
        { country: "IT", language: "Italian" },
        { country: "PT", language: "Portuguese" },
        { country: "NL", language: "Dutch" },
        { country: "PL", language: "Polish" },
        { country: "RO", language: "Romanian" },
        { country: "CZ", language: "Czech" },
        { country: "SK", language: "Slovak" },
        { country: "SE", language: "Swedish" },
        { country: "NO", language: "Norwegian" },
        { country: "DK", language: "Danish" },
        { country: "FI", language: "Finnish" },
        { country: "GR", language: "Greek" },
      ])("should return $language for $country", ({ country, language }) => {
        expect(getLanguageForCountry(country)).toBe(language);
      });
    });

    describe("Americas Languages", () => {
      test.each([
        { country: "MX", language: "Spanish" },
        { country: "AR", language: "Spanish" },
        { country: "BR", language: "Portuguese" },
      ])("should return $language for $country", ({ country, language }) => {
        expect(getLanguageForCountry(country)).toBe(language);
      });
    });

    describe("Other Regions", () => {
      test.each([
        { country: "TR", language: "Turkish" },
        { country: "RU", language: "Russian" },
        { country: "UA", language: "Ukrainian" },
        { country: "JP", language: "Japanese" },
        { country: "CN", language: "Chinese" },
        { country: "KR", language: "Korean" },
      ])("should return $language for $country", ({ country, language }) => {
        expect(getLanguageForCountry(country)).toBe(language);
      });
    });

    describe("Case Insensitivity", () => {
      it("should handle lowercase country codes", () => {
        expect(getLanguageForCountry("hu")).toBe("Hungarian");
        expect(getLanguageForCountry("de")).toBe("German");
        expect(getLanguageForCountry("fr")).toBe("French");
      });

      it("should handle mixed case country codes", () => {
        expect(getLanguageForCountry("Hu")).toBe("Hungarian");
        expect(getLanguageForCountry("De")).toBe("German");
        expect(getLanguageForCountry("Fr")).toBe("French");
      });

      it("should handle uppercase country codes", () => {
        expect(getLanguageForCountry("HU")).toBe("Hungarian");
        expect(getLanguageForCountry("DE")).toBe("German");
        expect(getLanguageForCountry("FR")).toBe("French");
      });
    });

    describe("Default Behavior", () => {
      it("should default to English for unknown country codes", () => {
        expect(getLanguageForCountry("XX")).toBe("English");
        expect(getLanguageForCountry("ZZ")).toBe("English");
        expect(getLanguageForCountry("UNKNOWN")).toBe("English");
      });

      it("should default to English for empty string", () => {
        expect(getLanguageForCountry("")).toBe("English");
      });

      it("should default to English for invalid codes", () => {
        expect(getLanguageForCountry("123")).toBe("English");
        expect(getLanguageForCountry("!@#")).toBe("English");
      });
    });

    describe("Return Type", () => {
      it("should always return a string", () => {
        const result = getLanguageForCountry("HU");
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      });

      it("should return capitalized language names", () => {
        const languages = [
          getLanguageForCountry("HU"),
          getLanguageForCountry("DE"),
          getLanguageForCountry("FR"),
        ];

        languages.forEach((lang) => {
          // First character should be uppercase
          expect(lang[0]).toBe(lang[0].toUpperCase());
        });
      });
    });
  });

  describe("Integration: Combined Usage", () => {
    it("should work together for US (imperial, English)", () => {
      const system = getMeasurementSystem("US");
      const language = getLanguageForCountry("US");

      expect(system).toBe("imperial");
      expect(language).toBe("English");
    });

    it("should work together for HU (metric, Hungarian)", () => {
      const system = getMeasurementSystem("HU");
      const language = getLanguageForCountry("HU");

      expect(system).toBe("metric");
      expect(language).toBe("Hungarian");
    });

    it("should work together for DE (metric, German)", () => {
      const system = getMeasurementSystem("DE");
      const language = getLanguageForCountry("DE");

      expect(system).toBe("metric");
      expect(language).toBe("German");
    });

    test.each([
      { country: "US", system: "imperial", language: "English" },
      { country: "GB", system: "metric", language: "English" },
      { country: "CA", system: "metric", language: "English" },
      { country: "HU", system: "metric", language: "Hungarian" },
      { country: "DE", system: "metric", language: "German" },
      { country: "FR", system: "metric", language: "French" },
      { country: "ES", system: "metric", language: "Spanish" },
      { country: "MM", system: "imperial", language: "English" }, // Myanmar defaults to English
      { country: "LR", system: "imperial", language: "English" }, // Liberia defaults to English
    ])(
      "should return $system and $language for $country",
      ({ country, system, language }) => {
        expect(getMeasurementSystem(country)).toBe(system);
        expect(getLanguageForCountry(country)).toBe(language);
      }
    );
  });

  describe("Consistency Tests", () => {
    it("should return same result for same country code called multiple times", () => {
      const results = Array(10)
        .fill(null)
        .map(() => getMeasurementSystem("HU"));

      expect(new Set(results).size).toBe(1);
      expect(results[0]).toBe("metric");
    });

    it("should return same language for same country code called multiple times", () => {
      const results = Array(10)
        .fill(null)
        .map(() => getLanguageForCountry("HU"));

      expect(new Set(results).size).toBe(1);
      expect(results[0]).toBe("Hungarian");
    });

    it("should handle rapid successive calls", () => {
      const countries = ["US", "HU", "DE", "FR", "ES", "IT", "GB"];

      countries.forEach((country) => {
        const system1 = getMeasurementSystem(country);
        const system2 = getMeasurementSystem(country);
        expect(system1).toBe(system2);

        const lang1 = getLanguageForCountry(country);
        const lang2 = getLanguageForCountry(country);
        expect(lang1).toBe(lang2);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle all three imperial countries correctly", () => {
      const imperialCountries = ["US", "MM", "LR"];
      const results = imperialCountries.map((c) => getMeasurementSystem(c));

      expect(results).toEqual(["imperial", "imperial", "imperial"]);
      expect(results.every((r) => r === "imperial")).toBe(true);
    });

    it("should handle countries with multiple language possibilities (using primary)", () => {
      // Switzerland could be German, French, or Italian - we use German
      expect(getLanguageForCountry("CH")).toBe("German");

      // Belgium could be French or Dutch - we use French
      expect(getLanguageForCountry("BE")).toBe("French");

      // Canada could be English or French - we use English
      expect(getLanguageForCountry("CA")).toBe("English");
    });

    it("should not throw errors for any input", () => {
      const testInputs = [
        "US",
        "us",
        "XX",
        "",
        "123",
        "!@#",
        "TOOLONG",
        "a",
        "AB",
        "ABC",
      ];

      testInputs.forEach((input) => {
        expect(() => getMeasurementSystem(input)).not.toThrow();
        expect(() => getLanguageForCountry(input)).not.toThrow();
      });
    });
  });
});
