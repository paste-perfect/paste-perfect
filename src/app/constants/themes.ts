/** Light Themes */
export enum LightTheme {
  A11yLight = "a11y-light.min",
  PrismColdarkLight = "prism-coldark-cold.min",
  OneLight = "prism-one-light.min",
  VsCodeLight = "prism-vsc-light.min",
  MaterialLight = "prism-material-light.min",
}

export const LIGHT_THEME_MAP: Record<LightTheme, string> = {
  [LightTheme.A11yLight]: "a11y Light",
  [LightTheme.PrismColdarkLight]: "Prism Coldark Light",
  [LightTheme.OneLight]: "One Light",
  [LightTheme.VsCodeLight]: "VS Code Light",
  [LightTheme.MaterialLight]: "Material Light",
} as const;

/** Dark Themes */
export enum DarkTheme {
  A11yDark = "a11y-dark.min",
  PrismColdarkDark = "prism-coldark-dark.min",
  OneDark = "prism-one-dark.min",
  VsCodeDark = "prism-vsc-dark.min",
  MaterialDark = "prism-material-dark.min",
}

export const DARK_THEME_MAP: Record<DarkTheme, string> = {
  [DarkTheme.A11yDark]: "a11y Dark",
  [DarkTheme.PrismColdarkDark]: "Prism Coldark Dark",
  [DarkTheme.OneDark]: "One Dark",
  [DarkTheme.VsCodeDark]: "VS Code Dark",
  [DarkTheme.MaterialDark]: "Material Dark",
} as const;
