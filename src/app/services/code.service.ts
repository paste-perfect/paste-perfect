import { computed, effect, inject, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { PrismHighlightService } from "@services/prism/prism-highlight.service";
import { LanguageService } from "@services/language.service";
import { PrettierFormattingService } from "@services/prettier/prettier-formatting.service";
import { SanitizerWrapper } from "@utils/sanitizer";
import { LineNumberingService } from "@services/line-numbering/line-numbering.service";
import { SettingsService } from "@services/settings.service";
import { RegexPatterns } from "../regex/regex-patterns";
import { LARGE_INPUT_DEBOUNCE_MS, LARGE_INPUT_LENGTH } from "@constants/const";

/**
 * CodeService is responsible for managing and processing source code,
 * including storing raw code and its highlighted version.
 */
@Injectable({
  providedIn: "root",
})
export class CodeService {
  /** Injected service for syntax highlighting */
  private readonly syntaxHighlightService: PrismHighlightService = inject(PrismHighlightService);

  /** Injected service for managing the selected programming language */
  private readonly languageService: LanguageService = inject(LanguageService);

  /** Injected service for code formatting */
  private readonly prettierService: PrettierFormattingService = inject(PrettierFormattingService);

  /** Injected service for prepending line numbers */
  private readonly lineNumberingService: LineNumberingService = inject(LineNumberingService);

  /** Injected service for the editor settings that affect processing */
  private readonly settingsService: SettingsService = inject(SettingsService);

  /** Default message when no code is provided */
  private readonly noCode: string = "<span>The highlighted code will appear here after pasting some code!</span>";

  /** Writable signal to store raw source code */
  private _rawCode: WritableSignal<string> = signal("");

  /** Writable signal to store highlighted code */
  private _highlightedCode: WritableSignal<string> = signal(this.noCode);

  /** Writable signal to store highlighted code */
  private _formattingSuccessful: WritableSignal<boolean> = signal(true);

  /**
   * Setter for raw code.
   * @param code - The new raw code to be stored.
   */
  public set rawCode(code: string) {
    this._rawCode.set(code);
  }

  /**
   * Getter for raw code.
   * @returns The current raw source code.
   */
  public get rawCode(): string {
    return this._rawCode();
  }

  /**
   * Setter for highlighted code.
   * @param code - The new highlighted code.
   */
  public set highlightedCode(code: string) {
    this._highlightedCode.set(code);
  }

  /**
   * Getter for highlighted code.
   * @returns The current highlighted source code.
   */
  public get highlightedCode(): string {
    return this._highlightedCode();
  }

  /**
   * Setter for raw code.
   * @param successful - The new raw code to be stored.
   */
  public set formattingSuccessful(successful: boolean) {
    this._formattingSuccessful.set(successful);
  }

  /**
   * Getter for raw code.
   * @returns The current raw source code.
   */
  public get formattingSuccessful(): boolean {
    return this._formattingSuccessful();
  }

  /**
   * Determines whether meaningful highlighted code is present.
   * Computed once per input change instead of on every change detection pass.
   */
  public readonly hasCode: Signal<boolean> = computed(() => RegexPatterns.NON_WHITESPACE_REGEX.test(this._rawCode()));

  /**
   * Constructor initializes an effect that automatically updates highlighted code
   * when raw code, the selected language or the editor settings change.
   * Large inputs wait until typing pauses, so each keystroke does not re-render the whole output.
   */
  constructor() {
    effect((onCleanup) => {
      let cancelled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      onCleanup(() => {
        cancelled = true;
        clearTimeout(timer);
      });
      const selectedLanguage = this.languageService.selectedLanguage;
      const rawCode = this.rawCode;
      // Track the settings explicitly; processing of large inputs runs outside this reactive context.
      void this.settingsService.editorSettings;

      const process = (): void => {
        // Sanitize input
        const escapedInput = SanitizerWrapper.escapeUmlauts(rawCode);

        void this.prettierService
          .formatCode(escapedInput, selectedLanguage)
          .then(async ({ code: formattedCode, formattingSuccessful }) => {
            if (cancelled) return;
            const highlightedCode = await this.syntaxHighlightService.highlightCode(formattedCode, selectedLanguage);
            if (cancelled) return;

            const codeWithLineNumbers = this.lineNumberingService.prependLineNumbers(highlightedCode);
            this.formattingSuccessful = formattingSuccessful;
            this.highlightedCode = this.hasCode() ? SanitizerWrapper.sanitizeOutput(codeWithLineNumbers) : this.noCode;
          })
          .catch((error: unknown) => {
            if (cancelled) return;
            this.formattingSuccessful = false;
            console.error("Code processing failed", error);
          });
      };

      if (rawCode.length < LARGE_INPUT_LENGTH) {
        process();
      } else {
        timer = setTimeout(process, LARGE_INPUT_DEBOUNCE_MS);
      }
    });
  }
}
