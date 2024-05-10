import { ApiUtils } from "api-utils";

export class JotobaApi {
  static async getWordDefinition(searchTerm: string) {
    var requestBody = {
      "query": searchTerm,
      "language": "English"
    }
    let definition = await ApiUtils.post("https://jotoba.de/api/search/words", requestBody)
      .then(resp => resp.json());
    console.log("Definition:", definition);
  }
}