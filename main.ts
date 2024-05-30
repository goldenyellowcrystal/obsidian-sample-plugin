import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ViewStateResult } from 'obsidian';
import { DictionaryView, DICTIONARY_VIEW_TYPE } from "./view";

export interface DictionaryPluginSettings {
	mode: string;
	folderPath: string;
}

const DEFAULT_SETTINGS: DictionaryPluginSettings = {
	folderPath: '/',
	mode: '1'
}

// dictionary modes
export const DICTIONARY_MODE: any = {
	'DO_NOT_REPLACE': '1',
	'ADD_FURIGANA': '2',
	'REPLACE_KANJI_NO_FURIGANA': '3',
	'REPLACE_KANJI_WITH_FURIGANA': '4'
}

export default class DictionaryPlugin extends Plugin {
	settings: DictionaryPluginSettings;
	highlightedText: string;

	async onload() {
		await this.loadSettings();

		// COMMAND: Get highlighted text and does stuff
		this.addCommand({
			id: 'modify-highlighted-text',
			name: 'Modify Highlighted Text',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.highlightedText = editor.getSelection();
				this.activateView();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new DictionarySettingTab(this.app, this));

		// Register the view for the dictionary
    this.registerView(
      DICTIONARY_VIEW_TYPE,
      (leaf) => new DictionaryView(leaf)
    );
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(DICTIONARY_VIEW_TYPE);

    if (leaves.length > 0) {
      // A leaf with our view already exists, use that
      leaf = leaves[0];
    } else {
      // Our view could not be found in the workspace, create a new leaf
      // in the right sidebar for it
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: DICTIONARY_VIEW_TYPE, active: true });
    }

		// Get the highlighted text and search for it in the dictionary API
		await leaf?.view.setState({searchText: this.highlightedText, settings: this.settings}, {history: false});
		// await (leaf?.view as DictionaryView).appendSearchText();
		await (leaf?.view as DictionaryView).searchHighlightedText();

    // "Reveal" the leaf in case it is in a collapsed sidebar
    workspace.revealLeaf(leaf);
  }
}

class DictionarySettingTab extends PluginSettingTab {
	plugin: DictionaryPlugin;

	constructor(app: App, plugin: DictionaryPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Replace highlighted text Mode')
			.setDesc('Behaviour whether to replace the highlighted text when linking to the created note')
			.addDropdown(dropdown => dropdown
				.addOption(DICTIONARY_MODE.DO_NOT_REPLACE, 'Do not replace text')
				.addOption(DICTIONARY_MODE.ADD_FURIGANA, 'Add furigana to current selection')
				.addOption(DICTIONARY_MODE.REPLACE_KANJI_NO_FURIGANA, 'Replace text with kanji only')
				.addOption(DICTIONARY_MODE.REPLACE_KANJI_WITH_FURIGANA, 'Replace text with kanji and furigana')
				.setValue(this.plugin.settings.mode)
				.onChange(async (value) => {
					this.plugin.settings.mode = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Dictionary Folder Path')
			.setDesc('The folder where the newly created dictionary notes will be saved in')
			.addText(text => text
				.setValue(this.plugin.settings.folderPath)
				.onChange(async (value) => {
					this.plugin.settings.folderPath = value;
					await this.plugin.saveSettings();
				})
			)
			.addButton(button => button
				.setButtonText('Create folder')
				.onClick(evt => {
					// create folder
					this.app.vault.createFolder(this.plugin.settings.folderPath);
				})
			);
	}
}
