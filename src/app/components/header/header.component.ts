import { Component, inject } from "@angular/core";
import { TooltipOptions } from "@openng/optimus-ui/api";
import { Button } from "@openng/optimus-ui/button";
import { Tooltip } from "@openng/optimus-ui/tooltip";
import { SettingsComponent } from "@components/settings/settings.component";
import { Dialog } from "@openng/optimus-ui/dialog";
import { VersionService } from "@services/version.service";
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
  private readonly versionService = inject(VersionService);
  protected readonly version = this.versionService.version;
  protected readonly versionUrl = this.versionService.releaseUrl;

  protected showDialog(): void {
    this.settingsDialogVisible = true;
  }
}
