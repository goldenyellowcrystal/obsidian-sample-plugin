export class ApiUtils {

  static async get(url: string) {
    let resp = await fetch(url, {
      method: "GET",
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    });
    return resp;
  }

  static async post(url: string, body: Object) {
    let resp = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    });
    return resp;
  }

}