# Contributing

## 개발

```bash
npm run build   # 빌드
npm run dev     # 개발 모드
npm run watch   # Watch 모드
npm test        # 테스트
```

새 tool 은 `src/tools/<도메인>/` 에 파일을 만들고 `src/tool-registry.ts` 의 `toolDefinitions` 에 한 줄 추가합니다.
tool annotation(`readOnlyHint`, `destructiveHint`)은 tool 이름 접두어(`get-`, `delete-`, `update-` 등)로 정해집니다.

## 테스트 규칙

새 tool 을 추가하거나 기존 tool 의 요청 형상을 바꾸면 `test/` 에 테스트를 함께 추가합니다.

- **요청 형상**: tool handler 를 호출해 API 로 나가는 method, path, query, body 를 확인합니다. `test/helpers/capture-client.ts` 는 요청을 실제로 보내지 않고 기록하며, 요청별 응답 지정도 가능합니다
- **입력 변환**: 멤버, 본문, 부분 변경처럼 입력을 API 형식으로 바꾸는 로직이 있으면 그 변환을 테스트합니다
- **실패 분기**: 쓰기 전에 중단하는 분기(대상 없음, 옵션 충돌 등)가 있으면 그 분기에서 쓰기 요청이 나가지 않는지 확인합니다
- PR 전에 `npm run build` 와 `npm test` 를 모두 통과시킵니다. `npm publish` 는 `prepublishOnly` 로 두 명령이 통과해야 진행됩니다

`test/tool-test-coverage.test.ts` 가 등록된 모든 tool 의 handler 가 테스트에서 쓰이는지 검사합니다.
테스트가 없는 새 tool 이 있으면 `npm test` 가 실패합니다. 규칙 이전부터 있던 tool 은 `LEGACY_TOOLS_WITHOUT_TESTS` 로 제외되어 있고, 새 tool 은 이 목록에 넣지 말고 테스트를 추가합니다.
