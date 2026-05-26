import { Component, inject, ViewChild } from "@angular/core";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { Chip } from "primeng/chip";
import { Dialog } from "primeng/dialog";
import { TooltipOptions } from "primeng/api";
import { CodeService } from "@services/code.service";
import { LanguageService } from "@services/language.service";
import { PrismHighlightService } from "@services/prism/prism-highlight.service";
import { CopySettingsService } from "@services/copy-settings.service";
import { CopySettingsComponent } from "@components/copy-settings/copy-settings.component";
import { DEFAULT_TOOLTIP_OPTIONS } from "@constants/const";
import { CopySettingChip } from "@types";

/**
 * Component responsible for displaying and managing highlighted code output.
 * Provides functionality to copy the highlighted code to the clipboard and to
 * configure copy behaviour via the Copy Settings dialog.
 */
@Component({
  selector: "app-code-output",
  imports: [Button, Tooltip, Chip, Dialog, CopySettingsComponent],
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
   * Reference to the CopySettingsComponent rendered inside the dialog,
   * used to reset its pending state when the dialog opens.
   */
  @ViewChild(CopySettingsComponent)
  private copySettingsForm!: CopySettingsComponent;

  /** Controls the visibility of the Copy Settings dialog. */
  protected copySettingsDialogVisible = false;

  /**
   * Chips representing non-default copy settings, displayed in the result toolbar.
   * Recomputed on each change-detection cycle from the service.
   */
  protected get copySettingChips(): CopySettingChip[] {
    return this.copySettingsService.getActiveChips();
  }

  /**
   * Font size from copy settings, applied to the display of the highlighted code.
   */
  protected get displayFontSize(): number {
    return this.copySettingsService.copySettings.fontSize;
  }

  /**
   * Copies the highlighted code snippet, including styling, to the clipboard.
   * Uses the SyntaxHighlightService for execution.
   */
  copyToClipboard(): void {
    this.syntaxHighlightService.copyToClipboard();
  }

  /**
   * Opens the Copy Settings dialog and resets the form to the currently committed settings.
   */
  openCopySettings(): void {
    this.copySettingsForm.onDialogOpened();
    this.copySettingsDialogVisible = true;
  }

  /**
   * Handles the "saved" event from the CopySettingsComponent.
   * The service has already been updated by the child; just close the dialog.
   */
  protected onCopySettingsSaved(): void {
    this.copySettingsDialogVisible = false;
  }

  /**
   * Handles the "cancelled" event from the CopySettingsComponent.
   */
  protected onCopySettingsCancelled(): void {
    this.copySettingsDialogVisible = false;
  }
}
