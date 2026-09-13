import { Component } from "@angular/core";
import { TooltipOptions } from "@openng/optimus-ui/api";
import { Button } from "@openng/optimus-ui/button";
import { Tooltip } from "@openng/optimus-ui/tooltip";
import { SettingsComponent } from "@components/settings/settings.component";
import { Dialog } from "@openng/optimus-ui/dialog";
import { environment } from "@environments/environment";
import { DEFAULT_TOOLTIP_OPTIONS } from "@constants/const";

@Component({
  selector: "app-header",
  imports: [Button, Tooltip, SettingsComponent, Dialog],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {
  protected tooltipOptions: TooltipOptions = DEFAULT_TOOLTIP_OPTIONS;
  protected settingsDialogVisible = false;
  protected version: string = environment.version;
  protected versionUrl = /^[a-f0-9]{7}$/.test(this.version)
    ? `https://github.com/paste-perfect/paste-perfect/commit/${this.version}`
    : "https://github.com/paste-perfect/paste-perfect/releases";

  protected showDialog(): void {
    this.settingsDialogVisible = true;
  }
}
