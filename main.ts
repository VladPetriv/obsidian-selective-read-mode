import { Plugin, MarkdownView, TFile, normalizePath } from "obsidian";
import {
  SelectiveReadModeSettingTab,
  SelectiveReadModeSettings,
  DEFAULT_SETTINGS,
  ReadModeRule,
} from "./settings";

export default class SelectiveReadModePlugin extends Plugin {
  settings: SelectiveReadModeSettings;

  async onload() {
    await this.loadSettings();

    // Migrate old settings if they exist
    await this.migrateSettings();

    this.addSettingTab(new SelectiveReadModeSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("file-open", (file: TFile | null) => {
        if (!file) return;

        setTimeout(() => {
          const view = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (!view) return;

          if (this.shouldOpenInReadMode(file.path)) {
            view.setState({ mode: "preview" }, { history: false });
          }
        }, 100);
      }),
    );
  }

  private shouldOpenInReadMode(filePath: string): boolean {
    const normalized = normalizePath(filePath);

    return this.settings.rules.some((rule) => {
      const rulePath = normalizePath(rule.path);

      if (rule.type === "file") {
        // Exact match for files
        return rulePath === normalized;
      } else {
        // For folders, check if file is within that folder
        if (!rulePath) return true; // Root folder
        return normalized.startsWith(rulePath + "/") || normalized === rulePath;
      }
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async migrateSettings() {
    const data = await this.loadData();
    if (data?.readModeFiles && !data?.rules) {
      // Migrate from old format
      this.settings = {
        rules: data.readModeFiles.map((path: string) => ({
          path,
          type: "file" as const,
        })),
      };
      await this.saveSettings();
    }
  }
}
