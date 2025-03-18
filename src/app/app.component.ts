import { Component } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { DropdownModule } from "primeng/dropdown";
import { Card } from "primeng/card";
import { Toast } from "primeng/toast";
import { SettingsComponent } from "@components/settings/settings.component";
import { CodeInputComponent } from "@components/code-input/code-input.component";
import { CodeOutputComponent } from "@components/code-output/code-output.component";
import { Tooltip } from "primeng/tooltip";
import { TooltipOptions } from "primeng/api";
import { DEFAULT_TOOLTIP_OPTIONS } from "./constants";

/**
 * Standalone Angular component for demonstrating code syntax highlighting
 * with Prism.js, plus “copy to clipboard” functionality.
 */
@Component({
  selector: "app-root",
  standalone: true,
  imports: [FormsModule, DropdownModule, SettingsComponent, CodeInputComponent, CodeOutputComponent, Card, Toast, Tooltip],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  protected tooltipOptions: TooltipOptions = DEFAULT_TOOLTIP_OPTIONS;
}
