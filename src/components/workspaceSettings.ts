export type WorkspaceTheme = "light" | "dark";
export type WorkspaceDensity = "comfortable" | "compact";

export interface WorkspaceSettings {
  theme: WorkspaceTheme;
  density: WorkspaceDensity;
  autoScroll: boolean;
  lineNumbers: boolean;
  fontSize: number;
}

export type WorkspaceSettingKey = keyof WorkspaceSettings;

export type WorkspaceSettingUpdater = <K extends WorkspaceSettingKey>(
  key: K,
  value: WorkspaceSettings[K],
) => void;

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  theme: "light",
  density: "comfortable",
  autoScroll: true,
  lineNumbers: true,
  fontSize: 13,
};
