# firebaseShortenUrl

### 해당 프로젝트는...

1. 파이어베이스 데이터베이스가 필요합니다.

2.  [Google API Console](https://console.developers.google.com/)에서 shortner api 생성 및 활성화가 필요합니다.

   - 참조: https://developers.google.com/url-shortener/v1/getting_started
   - 하루 100만개까지 요청이 가능합니다.

3. API

   1. `/addLink`
      - request body
        - `{ "url" : "http://www.naver.com" }`
      - response
        - `{ "key": "-L5Ib4h_sHnRI4JPKetO" }`
   2. `/app/shorten/:key`
      - `addLink`에서 얻은 key 값을 params에 요청합니다.
      - 여기는 html로 렌더링을 해줍니다. 테스트 용도로 만든거니 참조하길 바랍니다.