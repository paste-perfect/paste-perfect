import { Component, inject } from "@angular/core";
import { DropdownModule } from "primeng/dropdown";
import { FormsModule } from "@angular/forms";
import { InputNumber } from "primeng/inputnumber";
import { Select } from "primeng/select";
import { Popover } from "primeng/popover";
import { ThemeService } from "@services/theme.service";
import { LanguageService } from "@services/language.service";
import { SettingsService } from "@services/settings.service";
import { AvailableIndentationMode, IndentationModeValue, LanguageDefinition } from "@types";
import { SelectItemGroup } from "primeng/api";
import { ToggleSwitch } from "primeng/toggleswitch";

@Component({
  selector: "app-settings",
  imports: [DropdownModule, FormsModule, InputNumber, Select, Popover, ToggleSwitch],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.scss",
})
export class SettingsComponent {
  /** Minimum indentation size input number */
  protected readonly MIN_INDENTATION: number = 1;

  /** Maximum indentation size for the input number */
  protected readonly MAX_INDENTATION: number = 4;

  /**
   * Service for managing the currently selected theme.
   */
  protected themeService: ThemeService = inject(ThemeService);

  /**
   * Service for managing the currently selected programming language.
   */
  protected readonly languageService: LanguageService = inject(LanguageService);

  /**
   * Service for managing the highlighting settings.
   */
  private settingsService: SettingsService = inject(SettingsService);

  /**
   * List of available programming languages that the user can select,
   * grouped into popular languages and other languages.
   */
  protected groupedAvailableLanguages: SelectItemGroup[] = [
    {
      label: "Popular Languages",
      value: "common",
      items: this.mapWithPrettier(this.languageService.getCommonLanguages()),
    },
    {
      label: "Other Languages",
      value: "others",
      items: this.mapWithPrettier(this.languageService.getOtherLanguages()),
    },
  ];

  private mapWithPrettier(languages: LanguageDefinition[]): LanguageDefinition[] {
    return languages.map((language) => ({
      ...language,
      title: language.title + (language.prettier ? "*" : ""),
    }));
  }

  /**
   * List of available themes that the user can choose from,
   * grouped into light themes and dark themes.
   */
  protected groupedAvailableThemes: SelectItemGroup[] = [
    {
      label: "Light Themes",
      value: "light",
      items: this.themeService.getLightThemes(),
    },
    {
      label: "Dark Themes",
      value: "dark",
      items: this.themeService.getDarkThemes(),
    },
  ];

  /**
   * List of available indentation modes (e.g., spaces or tabs) for the editor.
   */
  protected availableIndentationModes: AvailableIndentationMode[] = this.settingsService.getAvailableIndentationModes();

  /**
   * Gets the current indentation size setting from the editor settings.
   */
  get indentationSize(): number {
    return this.settingsService.editorSettings.indentationSize;
  }

  /**
   * Updates the indentation size setting in the editor settings.
   * @param size - The new indentation size value.
   */
  set indentationSize(size: number) {
    this.settingsService.updateSettings({ indentationSize: size });
  }

  /**
   * Gets the currently selected indentation mode (e.g., spaces or tabs).
   */
  get selectedIndentationMode(): IndentationModeValue {
    return this.settingsService.editorSettings.indentationMode;
  }

  /**
   * Updates the selected indentation mode setting in the editor settings.
   * @param mode - The new indentation mode value.
   */
  set selectedIndentationMode(mode: IndentationModeValue) {
    this.settingsService.updateSettings({ indentationMode: mode });
  }

  /**
   * Gets the current formatting enabled setting.
   */
  get formattingEnabled(): boolean {
    return this.settingsService.editorSettings.enableFormatting;
  }

  /**
   * Updates the formatting enabled setting.
   * @param enabled - Whether formatting should be enabled.
   */
  set formattingEnabled(enabled: boolean) {
    this.settingsService.updateSettings({ enableFormatting: enabled });
  }
}
