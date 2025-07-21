import { Plugin, MarkdownView, TFile } from "obsidian";
import {
  SelectiveReadModeSettingTab,
  SelectiveReadModeSettings,
  DEFAULT_SETTINGS,
} from "./settings";

export default class SelectiveReadModePlugin extends Plugin {
  settings: SelectiveReadModeSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new SelectiveReadModeSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("file-open", (file: TFile | null) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!file || !view) return;

        const path = file.path;

        const setMode = (
          view as MarkdownView & {
            setMode: (mode: "preview" | "source") => void;
          }
        ).setMode;

        if (this.settings.readModeFiles.includes(path)) {
          setMode.call(view, "preview");
        } else {
          setMode.call(view, "source");
        }
      }),
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
