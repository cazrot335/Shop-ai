import { GeminiService } from "./gemini.service";
import { Logger } from "../utils/logger.util";

// Supported by your app logic
export type IndianLanguage =
  | "hindi"
  | "tamil"
  | "telugu"
  | "kannada"
  | "marathi"
  | "gujarati";
export type ExtendedIndianLanguage = IndianLanguage | "bengali" | "punjabi";

export interface LanguageConfig {
  code: ExtendedIndianLanguage;
  name: string;
  nativeName: string;
  speakers: number;
}

export interface LocalizedContent {
  language: ExtendedIndianLanguage;
  originalText: string;
  translatedText: string;
  translatedAt: Date;
}

export class MultilingualGeminiService {
  private geminiService: GeminiService;
  private logger: Logger;

  private supportedLanguages: Map<ExtendedIndianLanguage, LanguageConfig> = new Map([
    [
      "hindi",
      {
        code: "hindi",
        name: "Hindi",
        nativeName: "हिंदी",
        speakers: 345000000
      }
    ],
    [
      "tamil",
      {
        code: "tamil",
        name: "Tamil",
        nativeName: "தமிழ்",
        speakers: 78000000
      }
    ],
    [
      "telugu",
      {
        code: "telugu",
        name: "Telugu",
        nativeName: "తెలుగు",
        speakers: 84000000
      }
    ],
    [
      "kannada",
      {
        code: "kannada",
        name: "Kannada",
        nativeName: "ಕನ್ನಡ",
        speakers: 44000000
      }
    ],
    [
      "marathi",
      {
        code: "marathi",
        name: "Marathi",
        nativeName: "मराठी",
        speakers: 84000000
      }
    ],
    [
      "gujarati",
      {
        code: "gujarati",
        name: "Gujarati",
        nativeName: "ગુજરાતી",
        speakers: 54000000
      }
    ],
    [
      "bengali",
      {
        code: "bengali",
        name: "Bengali",
        nativeName: "বাংলা",
        speakers: 265000000
      }
    ],
    [
      "punjabi",
      {
        code: "punjabi",
        name: "Punjabi",
        nativeName: "ਪੰਜਾਬੀ",
        speakers: 125000000
      }
    ]
  ]);

  private translationCache: Map<string, LocalizedContent> = new Map();

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
    this.logger = new Logger("MultilingualGeminiService");
  }

  async translateToIndianLanguage(
    text: string,
    language: ExtendedIndianLanguage,
    useCache: boolean = true
  ): Promise<string> {
    try {
      const cacheKey = `${text}:${language}`;
      if (useCache && this.translationCache.has(cacheKey)) {
        this.logger.info(`Cache hit for translation: ${language}`);
        return this.translationCache.get(cacheKey)!.translatedText;
      }
      let translatedText: string;
      if (
        language === "bengali" ||
        language === "punjabi"
      ) {
        this.logger.warn(
          `Language ${language} not yet supported, using Hindi as fallback`
        );
        const fallbackLanguage: IndianLanguage = "hindi";
        translatedText = await this.geminiService.translateForIndianLanguage(
          text,
          fallbackLanguage
        );
        translatedText = `[Fallback via Hindi] ${translatedText}`;
      } else {
        translatedText = await this.geminiService.translateForIndianLanguage(
          text,
          language as IndianLanguage
        );
      }
      const localizedContent: LocalizedContent = {
        language,
        originalText: text,
        translatedText,
        translatedAt: new Date()
      };
      this.translationCache.set(cacheKey, localizedContent);
      this.logger.info(`Translation completed for: ${language}`);
      return translatedText;
    } catch (error) {
      this.logger.error(`Failed to translate to ${language}`, error);
      throw error;
    }
  }
}

export default MultilingualGeminiService;
