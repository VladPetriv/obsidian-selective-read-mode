import { App, PluginSettingTab, Setting } from "obsidian";
import SelectiveReadModePlugin from "./main";

export interface SelectiveReadModeSettings {
  readModeFiles: string[];
}

export const DEFAULT_SETTINGS: SelectiveReadModeSettings = {
  readModeFiles: [],
};

export class SelectiveReadModeSettingTab extends PluginSettingTab {
  plugin: SelectiveReadModePlugin;

  constructor(app: App, plugin: SelectiveReadModePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl("h2", { text: "Selective Read Mode Settings" });

    this.plugin.settings.readModeFiles.forEach((path, index) => {
      new Setting(containerEl)
        .setName(`Note ${index + 1}`)
        .addText((text) =>
          text
            .setPlaceholder("e.g. folder/note.md")
            .setValue(path)
            .onChange(async (value) => {
              this.plugin.settings.readModeFiles[index] = value;
              await this.plugin.saveSettings();
            }),
        )
        .addExtraButton((button) => {
          button
            .setIcon("trash")
            .setTooltip("Remove")
            .onClick(async () => {
              this.plugin.settings.readModeFiles.splice(index, 1);
              await this.plugin.saveSettings();
              this.display();
            });
        });
    });

    new Setting(containerEl).addButton((button) => {
      button
        .setButtonText("Add Note Path")
        .setCta()
        .onClick(async () => {
          this.plugin.settings.readModeFiles.push("");
          await this.plugin.saveSettings();
          this.display();
        });
    });
  }
}
