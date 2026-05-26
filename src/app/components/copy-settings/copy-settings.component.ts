import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { SelectButton } from "primeng/selectbutton";
import { Select } from "primeng/select";
import { Checkbox } from "primeng/checkbox";
import { CopyMode, CopySettings, DEFAULT_COPY_SETTINGS } from "@types";
import { CopySettingsService } from "@services/copy-settings.service";

interface SelectOption<T> {
  label: string;
  value: T;
}

/**
 * Component for configuring copy-to-clipboard behaviour.
 *
 * The component owns its own `p-dialog` so it can be placed directly in any
 * parent template without going through a portal boundary.  Call the public
 * {@link openDialog} method (e.g. via `@ViewChild`) to open it; the pending
 * state is reset to the currently committed settings at that point.
 */
@Component({
  selector: "app-copy-settings",
  imports: [FormsModule, Button, Dialog, SelectButton, Select, Checkbox],
  templateUrl: "./copy-settings.component.html",
  styleUrl: "./copy-settings.component.scss",
})
export class CopySettingsComponent {
  protected readonly copySettingsService: CopySettingsService = inject(CopySettingsService);

  /** Controls the PrimeNG dialog visibility. */
  protected dialogVisible = false;

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

  // ── Office Tab Size ──────────────────────────────────────────────────────
  protected readonly officeTabSizeOptions: SelectOption<number>[] = [0.5, 1, 1.5, 2].map((cm) => ({
    label: `${cm}cm`,
    value: cm,
  }));

  // ── Pending (uncommitted) settings ───────────────────────────────────────
  /** Local working copy that the user edits before confirming. */
  protected pendingSettings: CopySettings = { ...DEFAULT_COPY_SETTINGS };

  // ── Computed helpers ─────────────────────────────────────────────────────
  protected get isHtmlMode(): boolean {
    return this.pendingSettings.copyMode === CopyMode.HTML;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Opens the settings dialog and resets the form to the currently committed settings.
   * Call this from the parent via `@ViewChild`.
   */
  openDialog(): void {
    this.pendingSettings = { ...this.copySettingsService.copySettings };
    this.dialogVisible = true;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  protected save(): void {
    this.copySettingsService.updateSettings(this.pendingSettings);
    this.dialogVisible = false;
  }

  protected cancel(): void {
    this.dialogVisible = false;
  }
}
