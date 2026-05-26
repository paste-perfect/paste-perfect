import { Component, inject, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { SelectButton } from "primeng/selectbutton";
import { InputNumber } from "primeng/inputnumber";
import { Select } from "primeng/select";
import { Checkbox } from "primeng/checkbox";
import { Divider } from "primeng/divider";
import { CopyMode, CopySettings, DEFAULT_COPY_SETTINGS } from "@types";
import { CopySettingsService } from "@services/copy-settings.service";

interface SelectOption<T> {
  label: string;
  value: T;
}

/**
 * Component for configuring copy-to-clipboard behaviour.
 *
 * Shows a settings form with a "pending" local copy of the settings.
 * Changes are only committed to {@link CopySettingsService} when the user
 * clicks "Save"; clicking "Cancel" discards all edits.
 */
@Component({
  selector: "app-copy-settings",
  imports: [FormsModule, Button, SelectButton, InputNumber, Select, Checkbox, Divider],
  templateUrl: "./copy-settings.component.html",
  styleUrl: "./copy-settings.component.scss",
})
export class CopySettingsComponent {
  /** Emitted after a successful save so the parent can close the dialog. */
  readonly saved = output<void>();

  /** Emitted when the user cancels so the parent can close the dialog. */
  readonly cancelled = output<void>();

  protected readonly copySettingsService: CopySettingsService = inject(CopySettingsService);

  // ── Copy Mode ────────────────────────────────────────────────────────────
  protected readonly copyModeOptions: SelectOption<CopyMode>[] = [
    { label: "HTML (Formatted)", value: CopyMode.HTML },
    { label: "Native Text (Plain)", value: CopyMode.PlainText },
  ];

  // ── Font Size ────────────────────────────────────────────────────────────
  protected readonly fontSizeOptions: SelectOption<number>[] = [10, 11, 12, 13, 14, 16, 18, 20, 24].map((px) => ({
    label: `${px}px`,
    value: px,
  }));

  protected readonly MIN_FONT_SIZE = 8;
  protected readonly MAX_FONT_SIZE = 48;

  // ── Tab Size ─────────────────────────────────────────────────────────────
  protected readonly tabSizeOptions: SelectOption<number>[] = [2, 4, 8].map((n) => ({
    label: String(n),
    value: n,
  }));

  // ── Pending (uncommitted) settings ───────────────────────────────────────
  /** Local working copy that the user edits before confirming. */
  protected pendingSettings: CopySettings = { ...DEFAULT_COPY_SETTINGS };

  // ── Computed helpers ─────────────────────────────────────────────────────
  protected get isHtmlMode(): boolean {
    return this.pendingSettings.copyMode === CopyMode.HTML;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Called by the parent (via `@ViewChild`) just before the dialog becomes visible.
   * Resets the form to the current committed settings.
   */
  onDialogOpened(): void {
    this.pendingSettings = { ...this.copySettingsService.copySettings };
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  protected save(): void {
    this.copySettingsService.updateSettings(this.pendingSettings);
    this.saved.emit();
  }

  protected cancel(): void {
    this.cancelled.emit();
  }
}
