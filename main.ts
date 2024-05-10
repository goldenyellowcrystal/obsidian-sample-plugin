import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ViewStateResult } from 'obsidian';
import { DictionaryView, DICTIONARY_VIEW_TYPE } from "./view";

interface DictionaryPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: DictionaryPluginSettings = {
	mySetting: 'default'
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
		this.addSettingTab(new SampleSettingTab(this.app, this));

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
		await leaf?.view.setState({searchText: this.highlightedText}, {history: false});
		await (leaf?.view as DictionaryView).appendSearchText();

    // "Reveal" the leaf in case it is in a collapsed sidebar
    workspace.revealLeaf(leaf);
  }
}

class SampleSettingTab extends PluginSettingTab {
	plugin: HelloWorldPlugin;

	constructor(app: App, plugin: HelloWorldPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
