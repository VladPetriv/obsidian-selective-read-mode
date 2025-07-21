import {
  App,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  TAbstractFile,
  normalizePath,
  FuzzySuggestModal,
} from "obsidian";
import SelectiveReadModePlugin from "./main";

export interface ReadModeRule {
  path: string;
  type: "file" | "folder";
}

export interface SelectiveReadModeSettings {
  rules: ReadModeRule[];
}

export const DEFAULT_SETTINGS: SelectiveReadModeSettings = {
  rules: [],
};

class FileFolderSuggestModal extends FuzzySuggestModal<TAbstractFile> {
  constructor(
    app: App,
    private onChoose: (item: TAbstractFile) => void,
    private showFolders: boolean = true,
  ) {
    super(app);
  }

  getItems(): TAbstractFile[] {
    const items: TAbstractFile[] = [];

    const addItems = (folder: TFolder) => {
      if (this.showFolders && folder.path) {
        items.push(folder);
      }

      for (const child of folder.children) {
        if (child instanceof TFile && child.extension === "md") {
          items.push(child);
        } else if (child instanceof TFolder) {
          addItems(child);
        }
      }
    };

    addItems(this.app.vault.getRoot());
    return items;
  }

  getItemText(item: TAbstractFile): string {
    return item.path || "/";
  }

  onChooseItem(item: TAbstractFile): void {
    this.onChoose(item);
  }
}

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

    new Setting(containerEl)
      .setName("Read Mode Rules")
      .setDesc("Configure which files or folders should open in read mode")
      .addButton((button) => {
        button
          .setButtonText("Add Rule")
          .setCta()
          .onClick(() => {
            new FileFolderSuggestModal(this.app, (item) => {
              const rule: ReadModeRule = {
                path: item.path,
                type: item instanceof TFolder ? "folder" : "file",
              };
              this.plugin.settings.rules.push(rule);
              this.plugin.saveSettings();
              this.display();
            }).open();
          });
      });

    this.plugin.settings.rules.forEach((rule, index) => {
      const setting = new Setting(containerEl)
        .setName(rule.path || "/")
        .setDesc(`Type: ${rule.type}`)
        .addDropdown((dropdown) => {
          dropdown
            .addOption("file", "File")
            .addOption("folder", "Folder")
            .setValue(rule.type)
            .onChange(async (value: "file" | "folder") => {
              rule.type = value;
              await this.plugin.saveSettings();
              this.display();
            });
        })
        .addExtraButton((button) => {
          button
            .setIcon("pencil")
            .setTooltip("Change path")
            .onClick(() => {
              new FileFolderSuggestModal(
                this.app,
                (item) => {
                  rule.path = item.path;
                  rule.type = item instanceof TFolder ? "folder" : "file";
                  this.plugin.saveSettings();
                  this.display();
                },
                rule.type === "folder",
              ).open();
            });
        })
        .addExtraButton((button) => {
          button
            .setIcon("trash")
            .setTooltip("Remove")
            .onClick(async () => {
              this.plugin.settings.rules.splice(index, 1);
              await this.plugin.saveSettings();
              this.display();
            });
        });

      // Add icon based on type
      setting.nameEl.prepend(
        createSpan({
          text: rule.type === "folder" ? "📁 " : "📄 ",
          cls: "read-mode-icon",
        }),
      );
    });

    // Quick actions
    containerEl.createEl("h3", { text: "Quick Actions" });

    new Setting(containerEl)
      .setName("Add current location")
      .setDesc("Add the current file or its parent folder")
      .addButton((button) => {
        button.setButtonText("Add Current File").onClick(async () => {
          const file = this.app.workspace.getActiveFile();
          if (file) {
            this.plugin.settings.rules.push({
              path: file.path,
              type: "file",
            });
            await this.plugin.saveSettings();
            this.display();
          }
        });
      })
      .addButton((button) => {
        button.setButtonText("Add Current Folder").onClick(async () => {
          const file = this.app.workspace.getActiveFile();
          if (file) {
            const folder = file.parent;
            if (folder) {
              this.plugin.settings.rules.push({
                path: folder.path,
                type: "folder",
              });
              await this.plugin.saveSettings();
              this.display();
            }
          }
        });
      });
  }
}
