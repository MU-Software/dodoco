import { DodoCoError } from "../common/error.js";

class APIResult {
  success = false;
  code = -1;
  subCode = '';
  message = '';
  data = {};

  constructor(responseBody) {
    if (responseBody === undefined || responseBody === null)
      throw new DodoCoError(
        '서버에서 받은 응답을 이해하지 못했어요,\n잠시 후에 다시 시도해주세요.',
        {debugMessage: '서버에서 받은 데이터를 파싱하지 못했습니다.', }, );

    this.success = responseBody.success ?? false;
    this.code = parseInt((responseBody.code ?? -1), 10);
    this.subCode = responseBody.sub_code ?? '';
    this.message = responseBody.message ?? '';
    this.data = responseBody.data ?? {};

    if (!this.success) {
      if (this.subCode.startsWith('request.body')) {
        throw new DodoCoError(
          '알 수 없는 문제가 발생했어요,\n잠시 후에 다시 시도해주세요.',
          {debugMessage: '클라이언트가 요청할 데이터를 제대로 보내지 않았어요.', },
        );
      } else if (this.subCode.startsWith('request.header')) {
        throw new DodoCoError(
          '알 수 없는 문제가 발생했어요,\n잠시 후에 다시 시도해주세요.',
          {debugMessage: '클라이언트가 요청의 말머리를 제대로 보내지 않았어요.', },
        );
      } else if (this.subCode.startsWith('backend')) {
        throw new DodoCoError(
          '서버에 알 수 없는 문제가 발생했어요,\n잠시 후에 다시 시도해주세요.',
          {debugMessage: '서버가 영 좋지 않은 상황이에요.', },
        );
      } else if (this.subCode.startsWith('http')) {
        throw new DodoCoError('서버에서 무엇을 할지 모르는 요청이에요...');
      } else if (this.subCode.startsWith('refresh_token')) {
        throw new DodoCoError(
          '로그인 정보가 올바르지 않아요,\n죄송하지만 다시 로그인 해주세요.',
          {debugMessage: `서버가 ${this.subCode}를 반환했습니다.`, },
        );
      } else if (this.subCode.startsWith('access_token')) {
        // Maybe access token's time is not expired, but it's revoked?
        // We need to retry this request after force token refresh.
        throw new DodoCoError(
          '로그인 정보가 올바르지 않아요,\n죄송하지만 다시 로그인 해주세요.',
          {debugMessage: `AccessToken이 올바르지 않고, 서버가 ${this.subCode}를 반환했습니다.`, },
          accessTokenInvalidation = true);
      } else if (this.subCode === 'user.not_signed_in') {
        throw new DodoCoError(
          '로그인이 되어 있지 않아요,\n로그인 해주세요.',
          {debugMessage: '서버가 "user.not_signed_in"를 반환했습니다.', }, );
      } else {
        throw new DodoCoError(
          '서버와의 통신에서 문제가 발생했어요,\n잠시 후 다시 시도해주세요.',
          {debugMessage: `서버가 "${this.subCode === '' ? "sub_code 없음" : this.subCode}"를 반환했습니다.`, }, );
      }
    }
  }
}

export { APIResult };
