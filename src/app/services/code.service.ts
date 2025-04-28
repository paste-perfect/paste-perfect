import { effect, inject, Injectable, signal, WritableSignal } from "@angular/core";
import { SyntaxHighlightService } from "./syntax.highlight.service";
import { LanguageService } from "./language.service";
import { PrettierService } from "@services/prettier.service";

/**
 * CodeService is responsible for managing and processing source code,
 * including storing raw code and its highlighted version.
 */
@Injectable({
  providedIn: "root",
})
export class CodeService {
  /** Injected service for syntax highlighting */
  private readonly syntaxHighlightService: SyntaxHighlightService = inject(SyntaxHighlightService);

  /** Injected service for managing the selected programming language */
  private readonly languageService: LanguageService = inject(LanguageService);

  /** Injected service for code formatting */
  private readonly prettierService: PrettierService = inject(PrettierService);

  /** Default message when no code is provided */
  private readonly noCode: string = "<span>The highlighted code will appear here after pasting some code!</span>";

  /** Writable signal to store raw source code */
  private _rawCode: WritableSignal<string> = signal("");

  /** Writable signal to store highlighted code */
  private _highlightedCode: WritableSignal<string> = signal("");

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
      if (!this.hasCode()) {
        this.highlightedCode = this.noCode;
        return;
      }

      const selectedLanguage = this.languageService.selectedLanguage;

      // Format the code using the PrettierService
      const formattedCode = await this.prettierService.formatCode(this.rawCode, selectedLanguage);

      // Update the highlighted code
      this.syntaxHighlightService.highlightCode(formattedCode, selectedLanguage).then((result) => {
        this.highlightedCode = result;
      });
    });
  }
}
