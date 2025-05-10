import { Component } from "@angular/core";
import { DEFAULT_TOOLTIP_OPTIONS } from "../../constants";
import { TooltipOptions } from "primeng/api";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { SettingsComponent } from "@components/settings/settings.component";
import { Dialog } from "primeng/dialog";

@Component({
  selector: "app-header",
  imports: [Button, Tooltip, SettingsComponent, Dialog],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {
  protected tooltipOptions: TooltipOptions = DEFAULT_TOOLTIP_OPTIONS;
  protected settingsDialogVisible = false;

  protected showDialog(): void {
    this.settingsDialogVisible = true;
  }
}
