import { Editor, ItemView, WorkspaceLeaf, ViewStateResult, FileSystemAdapter } from "obsidian";
import { JotobaApi } from "jotoba-api";

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

  parseSensePos(sensePosArr: Array<any>) {
    var parsedSensePos: string[] = [];
    sensePosArr.forEach(sensePosItem => {
      // Noun
      if (sensePosItem['Noun']) {
        if (sensePosItem['Noun'] == 'Normal') {
          parsedSensePos.push('Noun');
        } else if (sensePosItem['Noun'] == 'Suffix') {
          parsedSensePos.push('Noun - used as a suffix');
        } else if (sensePosItem['Noun'] == 'Prefix') {
          parsedSensePos.push('Noun - used as a prefix');
        } else {
          var stringItem = (typeof sensePosItem === 'object') ? JSON.stringify(sensePosItem)
            : sensePosItem.toString();
          parsedSensePos.push(stringItem);
        }
      // Verb
      } else if (sensePosItem['Verb']) {
        if (sensePosItem['Verb'] == "Intransitive") {
          parsedSensePos.push('Intransitive verb');
        } else if (sensePosItem['Verb']['Irregular']
            && sensePosItem['Verb']['Irregular'] == "NounOrAuxSuru") {
          parsedSensePos.push('Suru verb');
        } else if (sensePosItem['Verb']['Godan']) {
          if (sensePosItem['Verb']['Godan'] == 'Ru') {
            parsedSensePos.push('Godan verb with \'ru\' ending');
          } else if (sensePosItem['Verb']['Godan'] == 'U') {
            parsedSensePos.push('Godan verb with \'u\' ending');
          } else if (sensePosItem['Verb']['Godan'] == 'Rulrreg') {
            parsedSensePos.push('Godan verb with \'ru\' ending (irregular verb)');
          }
        } else if (sensePosItem['Verb'] == 'Transitive') {
          parsedSensePos.push('Transitive verb');
        } else if (sensePosItem['Verb'] == 'Ichidan') {
          parsedSensePos.push('Ichidan verb');
        } else {
          var stringItem = (typeof sensePosItem === 'object') ? JSON.stringify(sensePosItem)
            : sensePosItem.toString();
          parsedSensePos.push(stringItem);
        }
      // Adjective
      } else if (sensePosItem['Adjective']) {
        if (sensePosItem['Adjective'] == "Keiyoushi") {
          parsedSensePos.push('i-adjective');
        } else if (sensePosItem['Adjective'] == "Na") {
          parsedSensePos.push('na-adjective');
        } else if (sensePosItem['Adjective'] == "PreNoun") {
          parsedSensePos.push('Pre-noun adjectival');
        } else if (sensePosItem['Adjective'] == 'Taru') {
          parsedSensePos.push('\'taru\' adjective');
        } else if (sensePosItem['Adjective'] == 'Nari') {
          parsedSensePos.push('formal form of na-adjective');
        } else if (sensePosItem['Adjective'] == 'No') {
          parsedSensePos.push('Noun which may take the genitive case particle \'no\'');
        } else {
          var stringItem = (typeof sensePosItem === 'object') ? JSON.stringify(sensePosItem)
            : sensePosItem.toString();
          parsedSensePos.push(stringItem);
        }
      // Others
      } else if (sensePosItem == "Expr") {
        parsedSensePos.push('Expressions (phrases, clauses, etc.)');
      } else if (sensePosItem == "AdverbTo") {
        parsedSensePos.push('Adverb taking the \'to\' particle');
      } else if (sensePosItem == 'Adverb') {
        parsedSensePos.push('Adverb (fukushi)');
      } else if (sensePosItem == 'AuxilaryVerb') {
        parsedSensePos.push('Auxiliary verb');
      // Default types
      } else if (typeof sensePosItem === "string") {
        parsedSensePos.push(sensePosItem);
      } else {
        var stringItem = (typeof sensePosItem === 'object') ? JSON.stringify(sensePosItem)
          : sensePosItem.toString();
        parsedSensePos.push('' + stringItem);
      }
    })

    return parsedSensePos;
  }

  transformCamelCase(text: string) {
    const result = text.replace(/([a-z])([A-Z])/g, `$1 $2`);
    console.log("Result:", result)
    return result.charAt(0) + result.slice(1).toLowerCase();
  }

  async searchHighlightedText() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h3", { text: "Dictionary View" });
    container.createEl("span", { text: "Searching for " + this.searchText + "..." });
    let definition = await JotobaApi.getWordDefinition(this.searchText);

    container.empty();
    container.createEl("h3", { text: "Dictionary View" });
    container.createEl("h4", { text: "Results for " + this.searchText + ":" });

    definition.words.forEach((word: any) => {
      const wordDiv = container.createEl('div');
      if (word.reading.kanji) {
        wordDiv.createEl("h5", { text: word.reading.kanji + " (" + word.reading.kana + ")" });
      } else {
        wordDiv.createEl("h5", { text: word.reading.kana });
      }

      const meaningsList = wordDiv.createEl('ol');
      word.senses.forEach((sense: any) => {
        console.log("Sense:", sense);
        var parsedPos = this.parseSensePos(sense.pos);
        meaningsList.createEl('small', { text: parsedPos.join(', ') });
        const meaningsListItem = meaningsList.createEl('li');
        meaningsListItem.createEl('strong', { text: sense.glosses.join('; ') });
        if (sense.field) {
          meaningsListItem.createEl('small', { text: " (" + this.transformCamelCase(sense.field) + ")" });
        }
        if (sense.misc) {
          meaningsListItem.createEl('small', { text: " (" + this.transformCamelCase(sense.misc) + ")" });
        }
        meaningsList.createEl('br');
      })

      console.log("---");
    })
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

    const getButton = container.createEl('button', { text: "Test GET" });
    getButton.addEventListener('click', () => {
      JotobaApi.getWordDefinition(this.searchText);
    });
  }


}