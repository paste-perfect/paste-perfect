import { ApplicationConfig, provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { provideOptimus } from "@openng/optimus-ui/config";
import { MessageService } from "@openng/optimus-ui/api";
import { MyPreset } from "../styles/optimus-theme";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideOptimus({
      theme: {
        preset: MyPreset,
        options: {
          cssLayer: {
            name: "optimus",
            order: "vendor-prism, optimus",
          },
        },
      },
      pt: {
        dialog: {
          root: {
            style: {
              width: "fit-content",
              maxWidth: "95vw",
            },
          },
          content: {
            style: {
              overflow: "visible",
            },
          },
        },
      },
    }),
    MessageService,
  ],
};
