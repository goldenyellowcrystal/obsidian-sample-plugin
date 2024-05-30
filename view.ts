import { Editor, ItemView, WorkspaceLeaf, ViewStateResult, FileSystemAdapter } from "obsidian";
import { JotobaApi } from "jotoba-api";
import { DICTIONARY_MODE, DictionaryPluginSettings } from "main";

export const DICTIONARY_VIEW_TYPE = "dictionary-view";

interface DefinitionItem {
  wordType: Array<string>,
  meaning: string,
  misc: string
}

interface DictionaryItem {
  title: string,
  kanji: string,
  kana: string,
  audioLink: string,
  definition: Array<DefinitionItem>
}

export class DictionaryView extends ItemView {
  searchText: string;
  settings: DictionaryPluginSettings;

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
    if (state.settings) {
      this.settings = state.settings;
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
    return result.charAt(0) + result.slice(1).toLowerCase();
  }

  transformwordDictionaryItemIntoMarkdown(wordDictionaryItem: DictionaryItem) {
    var mdOutput = '';
    mdOutput += ("## Definitions\n\n");
    for (var idx in wordDictionaryItem.definition) {
      const definitionItem = wordDictionaryItem.definition[idx];
      mdOutput += ((Number(idx)+1) + '. **' + definitionItem.meaning + "**\n\n");
      mdOutput += ("\t- <sub><sup>" + definitionItem.wordType.join(', ') + "</sub></sup>\n\n");
    }

    mdOutput += ("## Kanji\n");
    mdOutput += ("(to be followed)\n\n");

    if (wordDictionaryItem.audioLink) {
      mdOutput += ("## Reading\n");
      mdOutput += ("- https://jotoba.de" + wordDictionaryItem.audioLink);
    }

    return mdOutput;
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

    // List out the definitions on-screen
    definition.words.forEach((word: any) => {
      const wordDiv = container.createEl('div');
      var wordDictionaryItem = {} as DictionaryItem;

      if (word.reading.kanji) {
        wordDictionaryItem.title = word.reading.kanji + " (" + word.reading.kana + ")";
        wordDictionaryItem.kanji = word.reading.kanji;
      } else {
        wordDictionaryItem.title = word.reading.kana;
      }
      wordDictionaryItem.kana = word.reading.kana;
      wordDictionaryItem.audioLink = word.audio;
      wordDiv.createEl("h5", { text: wordDictionaryItem.title });

      const meaningsList = wordDiv.createEl('ol');
      wordDictionaryItem.definition = [];
      word.senses.forEach((sense: any) => {
        var definitionObj = {} as DefinitionItem;
        definitionObj.wordType = this.parseSensePos(sense.pos);
        meaningsList.createEl('small', { text: definitionObj.wordType.join(', ') });

        const meaningsListItem = meaningsList.createEl('li');
        definitionObj.meaning = sense.glosses.join('; ')
        meaningsListItem.createEl('strong', { text: definitionObj.meaning });
        if (sense.field) {
          meaningsListItem.createEl('small', { text: " (" + this.transformCamelCase(sense.field) + ")" });
          definitionObj.misc = this.transformCamelCase(sense.field);
        }
        if (sense.misc) {
          meaningsListItem.createEl('small', { text: " (" + this.transformCamelCase(sense.misc) + ")" });
          definitionObj.misc = this.transformCamelCase(sense.misc);
        }
        meaningsList.createEl('br');
        wordDictionaryItem.definition.push(definitionObj);
      })

      // Add Note button functionality
      const addNoteButton = wordDiv.createEl('button', { text: "Create note" });
      addNoteButton.addEventListener('click', () => {
        try {
          // Create note with the info retrieved from dictionary
          const vault = this.app.vault;
          const mdOutput = this.transformwordDictionaryItemIntoMarkdown(wordDictionaryItem);
          vault.create(this.formatFilePath(wordDictionaryItem.title), mdOutput);

          // Replace highlighted text with link to new note + add furigana
          const view = this.app.workspace.getMostRecentLeaf()?.view;
          if (view) {
            const editor = (view.editor as Editor);
            editor.replaceSelection(this.formatLinkText(wordDictionaryItem));
          }
        } catch (err) {
          console.log("Error:", err)
        }
      });
    })
  }

  formatFilePath(fileName: string) {
    const formattedFolderPath = this.settings.folderPath.endsWith('/') ? this.settings.folderPath
      : this.settings.folderPath + '/';
    // Create if folder does not exist, otherwise nothing
    try {
      this.app.vault.createFolder(formattedFolderPath)
    } catch (e) {
      ; // NOOP
    }

    return formattedFolderPath + fileName + '.md';
  }

  formatLinkText(wordDictionaryItem: DictionaryItem) {
    console.log("Settings:", this.settings);

    var textItem = '';
    switch (this.settings.mode) {
      case DICTIONARY_MODE.DO_NOT_REPLACE:
        console.log("Mode: 1");
        textItem = this.searchText;
        break;
      case DICTIONARY_MODE.ADD_FURIGANA:
        console.log("Mode: 2");
        textItem = "{" + this.searchText + "\\|" + wordDictionaryItem.kana + "}";
        break;
      case DICTIONARY_MODE.REPLACE_KANJI_NO_FURIGANA:
        console.log("Mode: 3");
        textItem = wordDictionaryItem.kanji;
        break;
      case DICTIONARY_MODE.REPLACE_KANJI_WITH_FURIGANA:
        console.log("Mode: 4");
        textItem = "{" +  wordDictionaryItem.kanji + "\\|" + wordDictionaryItem.kana + "}";
        break;
      default:
        console.log("Mode: 5");
        textItem = this.searchText;
        break;
    }

    return "[[" + wordDictionaryItem.title + "|" + textItem + "]]";
  }


}