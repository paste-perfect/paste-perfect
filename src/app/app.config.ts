import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { providePrimeNG } from "primeng/config";
import { MessageService } from "primeng/api";
import { MyPreset } from "../styles/primeng-theme";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          cssLayer: {
            name: "primeng",
            order: "vendor-prism, primeng",
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
