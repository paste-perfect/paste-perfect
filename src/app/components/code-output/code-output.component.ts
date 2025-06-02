import { Component, inject } from "@angular/core";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { TooltipOptions } from "primeng/api";
import { DEFAULT_TOOLTIP_OPTIONS } from "@constants";
import { SyntaxHighlightService } from "@services/syntax.highlight.service";
import { CodeService } from "@services/code.service";
import { LanguageService } from "@services/language.service";

/**
 * Component responsible for displaying and managing highlighted code output.
 * Provides functionality to copy the highlighted code to the clipboard.
 */
@Component({
  selector: "app-code-output",
  imports: [Button, Tooltip],
  templateUrl: "./code-output.component.html",
  styleUrl: "./code-output.component.scss",
})
export class CodeOutputComponent {
  /**
   * Default tooltip options used for the copy button.
   */
  protected readonly tooltipOptions: TooltipOptions = DEFAULT_TOOLTIP_OPTIONS;

  /**
   * Service for handling syntax highlighting and clipboard copy functionality.
   */
  private readonly syntaxHighlightService: SyntaxHighlightService = inject(SyntaxHighlightService);

  /**
   * Service for managing code content and highlighted output.
   */
  protected readonly codeService: CodeService = inject(CodeService);

  /**
   * Service for managing the currently selected programming language.
   */
  protected readonly languageService: LanguageService = inject(LanguageService);

  /**
   * Copies the highlighted code snippet, including styling, to the clipboard.
   * Uses the SyntaxHighlightService for execution.
   */
  copyToClipboard(): void {
    this.syntaxHighlightService.copyToClipboard();
  }
}
