# Dooray MCP Server

[![MCP Badge](https://lobehub.com/badge/mcp-full/jhl8041-dooray-mcp?theme=light)](https://lobehub.com/mcp/jhl8041-dooray-mcp)

MCP server for [Dooray!](https://dooray.com) - enabling AI assistants to interact with Dooray projects, tasks, wikis, and more.

## 설치

### NPM (권장)
```bash
npm install -g @jhl8041/dooray-mcp
```

### Smithery
[![smithery badge](https://smithery.ai/badge/@jhl8041/dooray-mcp)](https://smithery.ai/server/@jhl8041/dooray-mcp)

```bash
npx -y @smithery/cli install @jhl8041/dooray-mcp --client claude
```

## 설정

### 1. API 토큰 발급 (필수)
두레이 개인설정 > API > 개인 인증 토큰 메뉴에서 생성할 수 있습니다. [가이드](https://helpdesk.dooray.com/share/pages/9wWo-xwiR66BO5LGshgVTg/2939987647631384419#%EA%B0%9C%EC%9D%B8-API-%EC%9D%B8%EC%A6%9D-%ED%86%A0%ED%81%B0-%EB%B0%9C%EA%B8%89-%EA%B3%BC%EC%A0%95)

### 2. 환경변수 등록 (필수)
```bash
export DOORAY_API_TOKEN=<발급 받은 API 토큰>
```

## MCP 등록

### 1. Claude Code 등록
```bash
claude mcp add -s user dooray-mcp npx @jhl8041/dooray-mcp@latest
```

### 2. Claude Desktop 설정

설정 파일 위치: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "dooray": {
      "command": "npx @jhl8041/dooray-mcp@latest",
      "env": { "DOORAY_API_TOKEN": "발급받은_토큰" }
    }
  }
}
```

## Tool 목록

### 공통
- `get-my-member-info` - 사용자 정보 조회
- `get-member-list` - 조직 전체 멤버 검색 (이름, 사용자 ID, 이메일, SSO ID)
- `get-member` - 멤버 상세정보

### 캘린더
- `get-calendar-list` - 캘린더 목록
- `get-calendar-event-list` - 기간 일정 목록 (최대 1년)
- `get-calendar-event` - 일정 상세정보 (본문, 참석자)
- `create-calendar-event` - 일정 생성 (종일, 반복 일정 지원)
- `update-calendar-event` - 일정 수정 (준 항목만 변경)
- `delete-calendar-event` - 일정 삭제 (반복 일정 범위 지정)

### 프로젝트
- `get-project-list` - 프로젝트 목록
- `get-project` - 프로젝트 상세정보
- `get-project-workflow-list` - 업무 상태 목록
- `get-task-list` - 업무 검색/필터링
- `get-task` - 업무 상세정보
- `create-task` - 업무 생성
- `update-task` - 업무 수정 (담당자, 참조자, 태그 추가, 제거 옵션 포함)
- `update-task-body` - 업무 본문 일부 치환
- `create-task-comment` - 댓글 작성
- `get-task-comment-list` - 댓글 목록
- `get-task-comment` - 댓글 단건 조회
- `update-task-comment` - 댓글 수정 (이메일 댓글 수정 불가)
- `delete-task-comment` - 댓글 삭제
- `get-milestone-list` - 마일스톤 목록
- `get-tag-list` - 태그 목록
- `get-tag` - 태그 상세정보
- `create-tag` - 태그 생성 (개별/그룹 태그)
- `update-tag-group` - 태그 그룹 설정 수정
- `get-project-template-list` - 템플릿 목록
- `get-project-template` - 템플릿 상세정보
- `create-project-template` - 템플릿 생성
- `update-project-template` - 템플릿 수정
- `delete-project-template` - 템플릿 삭제
- `get-project-member-list` - 프로젝트 멤버 목록
- `get-project-member-group-list` - 멤버 그룹 목록

### 첨부파일
- `upload-attachment` - 파일 업로드
- `get-attachment-list` - 첨부파일 목록
- `get-attachment-metadata` - 첨부파일 메타데이터
- `download-attachment` - 파일 다운로드 (savePath 옵션으로 로컬 저장 지원)
- `delete-attachment` - 첨부파일 삭제
- `download-all-attachments` - 첨부파일 일괄 다운로드 (디렉토리 저장)

### 드라이브
- `get-drive-list` - 드라이브 목록 (개인/프로젝트)
- `get-drive-file-list` - 파일/폴더 목록 조회
- `get-drive-file-meta` - 파일 메타정보 조회 (file ID만으로)
- `create-drive-folder` - 폴더 생성
- `rename-drive-file` - 파일/폴더 이름 변경
- `move-drive-file` - 파일/폴더 이동 (휴지통 이동 포함)
- `copy-drive-file` - 파일 복사
- `delete-drive-file` - 휴지통 파일 영구삭제
- `upload-drive-file` - 파일 업로드
- `download-drive-file` - 파일 다운로드 (savePath 옵션으로 로컬 저장 지원)
- `update-drive-file` - 파일 새버전 업로드

### 위키
- `get-wiki-list` - 위키 목록
- `get-wiki-page-list` - 위키 페이지 목록
- `get-wiki-page-tree` - 위키 페이지 트리 (깊이 지정)
- `get-wiki-page` - 위키 페이지 상세정보
- `create-wiki-page` - 위키 페이지 생성
- `update-wiki-page` - 위키 페이지 수정
- `update-wiki-page-body` - 위키 본문 일부 치환
- `move-wiki-page` - 위키 페이지 이동 (부모, 순서, 다른 위키)
- `delete-wiki-page` - 위키 페이지 삭제
- `get-wiki-page-comment-list` - 위키 페이지 댓글 목록
- `get-wiki-page-comment` - 위키 페이지 댓글 상세정보
- `create-wiki-page-comment` - 위키 페이지 댓글 작성
- `update-wiki-page-comment` - 위키 페이지 댓글 수정
- `delete-wiki-page-comment` - 위키 페이지 댓글 삭제

### 위키 파일
- `upload-wiki-file` - 위키에 파일 업로드 (페이지 생성 전 pre-upload용, attachFileId 반환)
- `upload-wiki-page-file` - 기존 위키 페이지에 파일 업로드
- `download-wiki-page-file` - 위키 페이지 첨부파일 다운로드 (fileId 사용, savePath 옵션으로 로컬 저장 지원)
- `download-wiki-attach-file` - 위키 첨부파일 다운로드 (attachFileId 사용, savePath 옵션으로 로컬 저장 지원)
- `delete-wiki-page-file` - 위키 페이지 첨부파일 삭제

## 개발

```bash
npm run build   # 빌드
npm run dev     # 개발 모드
npm run watch   # Watch 모드
npm test        # 테스트 (tool schema 정합성, 재시도 정책)
```

새 tool 은 `src/tools/<도메인>/` 에 파일을 만들고 `src/tool-registry.ts` 의 `toolDefinitions` 에 한 줄 추가합니다.
tool annotation(`readOnlyHint`, `destructiveHint`)은 tool 이름 접두어(`get-`, `delete-`, `update-` 등)로 정해집니다.

### 테스트 규칙

새 tool 을 추가하거나 기존 tool 의 요청 형상을 바꾸면 `test/` 에 테스트를 함께 추가합니다.

- **요청 형상**: tool handler 를 호출해 API 로 나가는 method, path, query, body 를 확인합니다. `test/helpers/capture-client.ts` 는 요청을 실제로 보내지 않고 기록하며, 요청별 응답 지정도 가능합니다
- **입력 변환**: 멤버, 본문, 부분 변경처럼 입력을 API 형식으로 바꾸는 로직이 있으면 그 변환을 테스트합니다
- **실패 분기**: 쓰기 전에 중단하는 분기(대상 없음, 옵션 충돌 등)가 있으면 그 분기에서 쓰기 요청이 나가지 않는지 확인합니다
- PR 전에 `npm run build` 와 `npm test` 를 모두 통과시킵니다. `npm publish` 는 `prepublishOnly` 로 두 명령이 통과해야 진행됩니다

`test/tool-test-coverage.test.ts` 가 등록된 모든 tool 의 handler 가 테스트에서 쓰이는지 검사합니다.
테스트가 없는 새 tool 이 있으면 `npm test` 가 실패합니다. 규칙 이전부터 있던 tool 은 `LEGACY_TOOLS_WITHOUT_TESTS` 로 제외되어 있고, 새 tool 은 이 목록에 넣지 말고 테스트를 추가합니다.

## Prompts (프롬프트)

사전 정의된 프롬프트 템플릿을 제공합니다:

| Prompt | 설명 |
|--------|------|
| `create-task-with-template` | 구조화된 템플릿으로 새 업무 생성 (bug, feature, improvement, general) |
| `weekly-task-summary` | 주간 업무 요약 생성 |
| `project-status-report` | 프로젝트 상태 리포트 생성 |
| `task-review-checklist` | 업무 검토 체크리스트 생성 |

## Resources (리소스)

컨텍스트 데이터를 제공하는 리소스:

| URI | 설명 |
|-----|------|
| `dooray://api/info` | Dooray API 정보 및 사용 가능한 도구 목록 |
| `dooray://workflows/reference` | 워크플로우 상태 참조 가이드 (backlog, registered, working, closed) |
| `dooray://priority/reference` | 업무 우선순위 참조 가이드 |

## 라이선스

MIT

## 참고

- [Dooray](https://dooray.com)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Dooray API 문서](https://dooray.com/docs/api)
