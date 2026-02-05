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

### 프로젝트
- `get-project-list` - 프로젝트 목록
- `get-project` - 프로젝트 상세정보
- `get-project-workflow-list` - 업무 상태 목록
- `get-task-list` - 업무 검색/필터링
- `get-task` - 업무 상세정보
- `create-task` - 업무 생성
- `update-task` - 업무 수정
- `create-task-comment` - 댓글 작성
- `get-task-comment-list` - 댓글 목록
- `update-task-comment` - 댓글 수정 (이메일 댓글 수정 불가)
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
- `download-attachment` - 파일 다운로드
- `delete-attachment` - 첨부파일 삭제

### 위키
- `get-wiki-list` - 위키 목록
- `get-wiki-page-list` - 위키 페이지 목록
- `get-wiki-page` - 위키 페이지 상세정보
- `create-wiki-page` - 위키 페이지 생성
- `update-wiki-page` - 위키 페이지 수정
- `get-wiki-page-comment-list` - 위키 페이지 댓글 목록
- `get-wiki-page-comment` - 위키 페이지 댓글 상세정보
- `create-wiki-page-comment` - 위키 페이지 댓글 작성
- `update-wiki-page-comment` - 위키 페이지 댓글 수정
- `delete-wiki-page-comment` - 위키 페이지 댓글 삭제

## 개발

```bash
npm run build   # 빌드
npm run dev     # 개발 모드
npm run watch   # Watch 모드
```

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
