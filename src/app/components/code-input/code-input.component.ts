import { Component, inject } from "@angular/core";
import { Textarea } from "primeng/textarea";
import { FormsModule } from "@angular/forms";
import { CodeService } from "@services/code.service";
import { Message } from "primeng/message";
import { SettingsService } from "@services/settings.service";
import { LanguageService } from "@services/language.service";

/**
 * This component provides a textarea input for users to enter or paste their code.
 * The input is bound to the CodeService for managing the data.
 */
@Component({
  selector: "app-code-input",
  imports: [Textarea, FormsModule, Message],
  templateUrl: "./code-input.component.html",
  styleUrl: "./code-input.component.scss",
})
export class CodeInputComponent {
  /**
   * Service for managing code content and highlighted output.
   */
  protected readonly codeService: CodeService = inject(CodeService);

  /**
   * Service for managing the highlighting settings.
   */
  protected settingsService: SettingsService = inject(SettingsService);

  /**
   * Service for managing the currently selected programming language.
   */
  protected readonly languageService: LanguageService = inject(LanguageService);

  /**
   * Determines the CSS class for the textarea based on formatting status.
   */
  get textareaClass(): string | undefined {
    if (
      !this.settingsService.editorSettings.enableFormatting ||
      !this.codeService.hasCode() ||
      !this.languageService.isPrettierSupportedByLanguage()
    ) {
      return undefined;
    }
    return this.codeService.formattingSuccessful ? "formatting-valid" : "formatting-invalid";
  }

  /**
   * Determines whether to show the formatting error message.
   */
  get showFormattingError(): boolean {
    return this.settingsService.editorSettings.enableFormatting && !this.codeService.formattingSuccessful;
  }
}
