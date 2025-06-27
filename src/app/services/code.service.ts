import { effect, inject, Injectable, signal, WritableSignal } from "@angular/core";
import { PrismHighlightService } from "@services/prism/prism-highlight.service";
import { LanguageService } from "@services/language.service";
import { PrettierFormattingService } from "@services/prettier/prettier-formatting.service";
import { SanitizerWrapper } from "@utils/sanitizer";

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
   * @returns True if highlighted code exists and is not the default placeholder.
   */
  public hasCode(): boolean {
    return this.rawCode.trim() !== "";
  }

  /**
   * Constructor initializes an effect that automatically updates highlighted code
   * when raw code or the selected language changes.
   */
  constructor() {
    effect(async () => {
      const selectedLanguage = this.languageService.selectedLanguage;

      // Sanitize input
      const escapedInput = SanitizerWrapper.escapeUmlauts(this.rawCode);

      // Format the code using the PrettierService
      const { code: formattedCode, formattingSuccessful } = await this.prettierService.formatCode(escapedInput, selectedLanguage);
      this.formattingSuccessful = formattingSuccessful;

      // Update the highlighted code
      const highlightedCode = await this.syntaxHighlightService.highlightCode(formattedCode, selectedLanguage);

      const sanitizedOuput = SanitizerWrapper.sanitizeOutput(highlightedCode);

      this.highlightedCode = this.hasCode() ? sanitizedOuput : this.noCode;
    });
  }
}
