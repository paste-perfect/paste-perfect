import { Component } from "@angular/core";

import { Card } from "primeng/card";
import { Toast } from "primeng/toast";
import { SettingsComponent } from "@components/settings/settings.component";
import { CodeInputComponent } from "@components/code-input/code-input.component";
import { CodeOutputComponent } from "@components/code-output/code-output.component";
import { HeaderComponent } from "@components/header/header.component";

/**
 * Standalone Angular component for demonstrating code syntax highlighting
 * with Prism.js, plus “copy to clipboard” functionality.
 */
@Component({
  selector: "app-root",
  standalone: true,
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  imports: [Toast, HeaderComponent, Card, CodeInputComponent, SettingsComponent, CodeOutputComponent],
})
export class AppComponent {}
