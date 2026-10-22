# Dooray MCP Server

[Dooray!](https://dooray.com) 의 프로젝트, 업무, 위키, 드라이브, 캘린더를 AI assistant 에서 다루게 하는 MCP 서버.

## 설치

Node.js 18 이상이 필요합니다. MCP 등록 시 `npx` 로 실행되므로 별도 설치 없이 사용 가능합니다.

전역 설치가 필요하면:

```bash
npm install -g @jhl8041/dooray-mcp
```

## 설정

### 1. API 토큰 발급

두레이 개인설정 > API > 개인 인증 토큰 메뉴에서 생성합니다. [가이드](https://helpdesk.dooray.com/share/pages/9wWo-xwiR66BO5LGshgVTg/2939987647631384419#%EA%B0%9C%EC%9D%B8-API-%EC%9D%B8%EC%A6%9D-%ED%86%A0%ED%81%B0-%EB%B0%9C%EA%B8%89-%EA%B3%BC%EC%A0%95)

### 2. 환경변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `DOORAY_API_TOKEN` | O | 발급받은 API 토큰 |
| `DOORAY_API_BASE_URL` | | API 주소 (기본값 `https://api.dooray.com`) |
| `LOG_LEVEL` | | `ERROR`, `WARN`, `INFO`, `DEBUG` (기본값 `INFO`). 로그는 stderr 로 출력됩니다 |

실행 위치에 `.env` 파일이 있으면 그 값도 적용됩니다.

## MCP 등록

### Claude Code

```bash
claude mcp add -s user dooray-mcp -e DOORAY_API_TOKEN=<발급받은 토큰> -- npx -y @jhl8041/dooray-mcp@latest
```

### Claude Desktop

설정 파일 위치: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "dooray": {
      "command": "npx",
      "args": ["-y", "@jhl8041/dooray-mcp@latest"],
      "env": { "DOORAY_API_TOKEN": "<발급받은 토큰>" }
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
