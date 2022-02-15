'use strict';

import { DodoCoError } from '../common/error';
import { APIResult } from './api_response';

const HTTP_METHOD = {
  // We will support these methods only for now
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

function role2Object(roleStr) {
  var result = {};

  roleStr.split("&").forEach(function (part) {
    var item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
    if (result[item[0]] === 'true' || result[item[0]] === 'false')
      result[item[0]] = (result[item[0]] === 'true') ? true : false;
  });

  return result;
}

// From https://stackoverflow.com/a/40031979
function buf2hex(buffer) { // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

// Generate random safe string
function generateRandomSecureToken(bytes) {
  var randArray = new Uint32Array(bytes);
  window.crypto.getRandomValues(randArray);
  return buf2hex(randArray);
}

let dodocoApiInstance;
class DodoCoAPI {
  #API_USED_METHOD = [
    HTTP_METHOD.GET,
    HTTP_METHOD.POST,
    HTTP_METHOD.PUT,
    HTTP_METHOD.PATCH,
    HTTP_METHOD.DELETE,
  ]

  // Refresh Token will be saved on cookie storage,
  // And all of these attributes must be private.
  #baseUrl = 'https://dodoco.mudev.cc/api/dev/';
  #csrfToken = '';
  #accessToken = '';
  #fetchOption = {
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    redirect: 'follow',
    referrerPolicy: 'strict-origin-when-cross-origin',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  #refreshResult = null;

  constructor() {
    if (dodocoApiInstance) return dodocoApiInstance;

    this.#csrfToken = generateRandomSecureToken(32);
    dodocoApiInstance = this;
  }

  /** @type {Promise<any>} */ // hate this typehint
  apiRequest(method = HTTP_METHOD.GET, url = '', accessTokenRequired = false, data = {}) {
    // check if requested method is allowed
    if (this.#API_USED_METHOD.indexOf(method) == -1) { throw 'NOT_ALLOWED_METHOD'; }

    // deep copy fetch option object
    var reqFetchOption = JSON.parse(JSON.stringify(this.#fetchOption));
    reqFetchOption.method = method;

    // only add body on POST/PATCH/PUT methods
    if ([HTTP_METHOD.POST, HTTP_METHOD.PATCH, HTTP_METHOD.PUT].indexOf(method) > -1)
      reqFetchOption.body = JSON.stringify(data);

    // Always send X-Csrf-Token. This won't be a security hole.
    reqFetchOption.headers['X-Csrf-Token'] = this.#csrfToken;
    // add access token on header if accessTokenRequired is true
    if (accessTokenRequired) {
      reqFetchOption.headers['Authorization'] = 'Bearer ' + this.#accessToken;
    }

    if (url.includes('account') || url.includes('admin')) {
      reqFetchOption.credentials = 'include';
    }

    return fetch(this.#baseUrl + url, reqFetchOption).then((response) => {
      if (response === undefined || response === null) {
        // How is this possible???
        throw new DodoCoError(
          '서버가 응답이 없어요,\n잠시 후에 다시 시도해주세요.',
          { debugMessage: 'fetchResult 객체가 undefined 또는 null입니다.', });
      } else if (200 <= response.status && response.status <= 399) {  // this returns response.json()
        // SUCCESS!!!
        return response.json();
      } else if (400 <= response.status && response.status <= 499) {
        if (response.status === 401) {  // this "possibly" returns response.json()
          // token not given / token expired / token invalid
          // wrong password / account locked / account deactivated
          // We need to try refreshing access token and retry this.
          // If access token refresh fails, then raise errors.
          if (url !== 'account/refresh')
            return this.refreshAuthentications().then((_) => {
              return this.apiRequest(method, url, accessTokenRequired, data);
            });
          else
            throw new DodoCoError(
              '인증 정보 갱신에 실패했어요,\n다시 로그인해주세요.',
              { debugMessage: `account/refresh 재시도`, });
        } else if (response.status === 403) {
          // Requested action was forbidden
          throw new DodoCoError(
            '해당 동작에 대한 권한이 없습니다.\n만약 권한을 가지고 계셔야 한다면 관리자에게 연락 부탁드립니다.',
            { debugMessage: `${url} | ${method} | response.status === ${response.status}`, });
        } else if (response.status === 404) {  // this "possibly" returns response.json()
          // TODO : we need to filter http.not_found out,
          // and any other responses must be returned...
          // but we can get subcode after response.json()... shit...
          return response.json();
        } else if (response.status === 405) {
          // Method not permitted
          throw new DodoCoError(
            '잘못된 요청입니다.\n사이트 관리자에게 어떻게 이 메시지를 보게 됐는지 알려주시면 감사하겠습니다ㅠㅜ',
            { debugMessage: `${url} | ${method} | response.status === ${response.status}`, });
        } else if (response.status === 409 || response.status === 410) {  // this "possibly" returns response.json()
          // already used / information mismatch, conflict (=== 409)
          // resource gone (=== 410)
          return response.json();
        } else if (response.status === 412) {  // this "possibly" returns response.json()
          // resource prediction failed
          return response.json();
        } else if (response.status === 415) {
          // requested response content-type not supported
          throw new DodoCoError(
            '잘못된 요청입니다.\n사이트 관리자에게 어떻게 이 메시지를 보게 됐는지 알려주시면 감사하겠습니다ㅠㅜ',
            { debugMessage: `${url} | ${method} | response.status === ${response.status}`, });
        } else if (response.status === 422) {  // this "possibly" returns response.json()
          // request.body.bad_semantics - email address validation failure, etc.
          return response.json();
        } else {
          throw new DodoCoError(
            '알 수 없는 문제가 발생하였습니다,\n10분 후 다시 시도해주세요.',
            { debugMessage: `${url} | ${method} | response.status === ${response.status}`, });
        }
      } else {  // HTTP status code is more than 500(server error)
        throw new DodoCoError(
          '서버가 잠시 문제가 생겼어요,\n10분 후에 다시 시도해주세요.',
          { debugMessage: `statusCode가 ${response.status}입니다.`, });
      }
      // This is just for type-checking.
      // response.status won't be less than 200, right?
      // ...right? please... no......
      return response.json();
    }).catch((reason) => {
      if (typeof(reason) === 'object' && reason.constructor.name === 'DodoCoError') {
        throw reason;
      } else {
        throw new DodoCoError(
          '알 수 없는 문제가 생겼어요,\n10분 후에 다시 시도해주세요.',
          { debugMessage: `on DodoCoAPI.apiRequest -> reason = ${reason}`, });
      }
    });
  }

  refreshAuthentications() {
    return this.apiRequest(
      HTTP_METHOD.POST,
      'account/refresh',
      false
    ).then((responseBody) => {
      var result = new APIResult(responseBody);
      if (result.success) {
        this.#accessToken = result.data.user.access_token.token;
        this.#refreshResult = result.data;
        return this;
      }
      throw new DodoCoError(
        '인증 정보 갱신에 실패했어요,\n다시 로그인해주세요.',
        { debugMessage: `account/refresh=>response.success = false입니다. code = ${result.code}`, });
    }).catch((reason) => {
      this.#accessToken = '';
      this.#csrfToken = generateRandomSecureToken(32);
      this.#refreshResult = null;

      if (typeof(reason) === 'object' && reason.constructor.name === 'DodoCoError')
        alert(reason.message);
      else
        alert('인증 정보 갱신에 실패했어요,\n다시 로그인해주세요.');

      window.location.href = 'http://' + window.location.host + '/signin.html';
    });
  }

  signout() {
    try {
      this.apiRequest(HTTP_METHOD.POST, 'account/signout', false, { signout: true }).then(
        (responseBody) => {
          this.#csrfToken = generateRandomSecureToken(32);
          this.#accessToken = '';
          this.#refreshResult = null;

          window.location.href = 'http://' + window.location.host + '/signin.html';
        }
      );
    } catch (e) {
      // Actually, this action won't be failed, except when the server is dead.
      // Just reset the csrf token and access token
      this.#csrfToken = generateRandomSecureToken(32);
      this.#accessToken = '';
      this.#refreshResult = null;

      window.location.href = 'http://' + window.location.host + '/signin.html';
    }
  }

  get userID() {
    if (this.#refreshResult === undefined || this.#refreshResult === null) {
      this.refreshAuthentications();
    }

    return this.#refreshResult.user.id;
  }

  get roles() {
    if (this.#accessToken === undefined || this.#accessToken === null) {
      this.refreshAuthentications();
    }

    var result = [];
    try {
      var token = JSON.parse(atob(this.#accessToken.split('.')[1]));
      JSON.parse(token.role).forEach(function (rolePart) {
        if (rolePart === 'admin') { return; }
        result.push(role2Object(rolePart));
      });
    } catch (e) { }

    return result;
  }

  get(url, accessTokenRequired = False) { return this.apiRequest(HTTP_METHOD.GET, url, accessTokenRequired); }
  post(url, data = {}, accessTokenRequired = False) { return this.apiRequest(HTTP_METHOD.POST, url, accessTokenRequired, data); }
  put(url, data = {}, accessTokenRequired = False) { return this.apiRequest(HTTP_METHOD.PUT, url, accessTokenRequired, data); }
  patch(url, data = {}, accessTokenRequired = False) { return this.apiRequest(HTTP_METHOD.PATCH, url, accessTokenRequired, data); }
  delete(url, accessTokenRequired = False) { return this.apiRequest(HTTP_METHOD.DELETE, url, accessTokenRequired); }
}

export default DodoCoAPI;
