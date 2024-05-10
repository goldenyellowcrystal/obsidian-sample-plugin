import { Editor, ItemView, WorkspaceLeaf, ViewStateResult, FileSystemAdapter } from "obsidian";

export const DICTIONARY_VIEW_TYPE = "dictionary-view";

export class DictionaryView extends ItemView {
  searchText: string;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
    this.searchText = "";
  }

  getViewType() {
    return DICTIONARY_VIEW_TYPE;
  }

  getDisplayText() {
    return "Dictionary View";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "Dictionary View" });
  }

  async onClose() {
    // Nothing to clean up.
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    // The `state` coming in 
    if (state.searchText) {
      this.searchText = state.searchText;
    }

    return super.setState(state, result);
  }

  async appendSearchText() {
    const container = this.containerEl.children[1];
    container.createEl("h4", { text: this.searchText });
    
    const submitButton = container.createEl('button', { text: "Create note" });
    submitButton.addEventListener('click', () => {
      // Create note with the info retrieved from dictionary
      const vault = this.app.vault;
      vault.create("test.md", "");

      // Replace highlighted text with link to new note + add furigana
      const view = this.app.workspace.getMostRecentLeaf()?.view;
      if (view) {
        const editor = (view.editor as Editor);
        editor.replaceSelection("potato");
      }
		});
  }
}