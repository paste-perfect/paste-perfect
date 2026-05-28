import { Component, inject, Signal, viewChild } from "@angular/core";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { Chip, ChipPassThroughOptions } from "primeng/chip";
import { TooltipOptions } from "primeng/api";
import { CodeService } from "@services/code.service";
import { LanguageService } from "@services/language.service";
import { PrismHighlightService } from "@services/prism/prism-highlight.service";
import { CopySettingsService } from "@services/copy-settings.service";
import { CopySettingsComponent } from "@components/copy-settings/copy-settings.component";
import { DEFAULT_TOOLTIP_OPTIONS } from "@constants/const";
import { CopySettingChip, CopySettings } from "@types";

/**
 * Component responsible for displaying and managing highlighted code output.
 * Provides functionality to copy the highlighted code to the clipboard and to
 * configure copy behaviour via the Copy Settings dialog.
 */
@Component({
  selector: "app-code-output",
  imports: [Button, Tooltip, Chip, CopySettingsComponent],
  templateUrl: "./code-output.component.html",
  styleUrl: "./code-output.component.scss",
})
export class CodeOutputComponent {
  protected readonly copySettingChipStyles: ChipPassThroughOptions = {
    root: {
      style: {
        fontSize: "0.7rem",
        padding: "0.15rem 0.5rem",
        borderRadius: "999px",
        background: "var(--p-highlight-focus-background)",
        color: "var(--p-highlight-color)",
        border: "1px solid var(--p-form-field-focus-border-color)",
      },
    },
    label: {
      style: {
        lineHeight: "1.4",
      },
    },
  };

  /**
   * Default tooltip options used for the copy button.
   */
  protected readonly tooltipOptions: TooltipOptions = DEFAULT_TOOLTIP_OPTIONS;

  /**
   * Service for handling syntax highlighting and clipboard copy functionality.
   */
  private readonly syntaxHighlightService: PrismHighlightService = inject(PrismHighlightService);

  /**
   * Service for managing code content and highlighted output.
   */
  protected readonly codeService: CodeService = inject(CodeService);

  /**
   * Service for managing the currently selected programming language.
   */
  protected readonly languageService: LanguageService = inject(LanguageService);

  /**
   * Service for managing copy-to-clipboard settings.
   */
  protected readonly copySettingsService: CopySettingsService = inject(CopySettingsService);

  /**
   * Reference to the CopySettingsComponent placed directly in this template.
   */
  private copySettingsForm: Signal<CopySettingsComponent | undefined> = viewChild(CopySettingsComponent);

  /**
   * Chips representing non-default copy settings, displayed in the result toolbar.
   */
  protected get copySettingChips(): CopySettingChip[] {
    return this.copySettingsService.getActiveChips();
  }

  /**
   * Copies the highlighted code snippet, including styling, to the clipboard.
   */
  copyToClipboard(): void {
    this.syntaxHighlightService.copyToClipboard();
  }

  /**
   * Opens the Copy Settings dialog. The component resets its pending state internally.
   */
  openCopySettings(): void {
    this.copySettingsForm()?.openDialog();
  }

  /**
   * Resets a single copy setting back to its factory default. Triggered when the
   * user removes the chip representing an active customisation.
   */
  resetCopySetting(key: keyof CopySettings): void {
    this.copySettingsService.resetSetting(key);
  }
}
