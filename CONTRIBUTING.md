# 기여 안내

설치 문제, 교정 사례와 문서 개선 제안을 환영합니다. 작은 수정은 바로 Pull Request로 보내도 됩니다. 기능 범위나 편집 원칙을 크게 바꾸려면 먼저 [Issue](https://github.com/dev-jaehoonlee/natural-korean/issues)에서 제안의 목적을 설명해 주세요.

## 문제 제보

설치 문제에는 운영체제, 도구 버전, 실행한 명령과 오류 메시지를 적어 주세요. 교정 문제에는 원문, 실제 결과, 기대한 결과와 글의 용도를 함께 적으면 판단에 도움이 됩니다. 공개해도 되는 예시를 사용하고, 개인정보와 비밀 값은 제거해 주세요.

## 수정과 확인

1. 저장소를 Fork하고 작업 브랜치를 만듭니다.
2. 수정 목적에 필요한 파일만 바꿉니다. 교정 규칙을 바꿀 때는 의미가 유지되는 예시를 준비합니다.
3. Node.js 22 이상을 사용해 저장소 루트에서 정합성 검사와 회귀 테스트를 실행하고, Claude Code 설정을 검사합니다.

   ```bash
   node scripts/check-package.mjs
   node --test scripts/check-package.test.mjs
   claude plugin validate plugins/natural-korean/.claude-plugin/plugin.json
   claude plugin validate .claude-plugin/marketplace.json
   git diff --check
   ```

4. [README의 로컬 개발 방법](README.md#로컬-개발)으로 두 도구에서 설치하고 새 세션을 시작합니다. 교정 스킬을 호출하고, Claude Code에서는 두 출력 스타일도 확인합니다. 문구를 바꿨다면 [수정 범위 확인 사례](docs/writing-examples.md#수정-범위를-확인하는-사례)를 참고해 원문의 뜻과 어체가 유지되는지 검토합니다.
5. Pull Request에 해결하려는 문제, 바뀐 동작과 확인한 범위를 적습니다. 실행하지 못한 검증은 그 사실을 적습니다.

GitHub Actions는 Linux와 Windows에서 같은 검사를 실행하고, Claude Code CLI 2.1.63과 Codex CLI 0.153.4로 마켓플레이스 등록·설치·활성화 상태와 설치된 모든 배포 파일을 확인합니다. 이 버전은 검증에 사용한 버전이며 최소 지원 버전을 뜻하지 않습니다. 도구 버전과 Actions 참조는 재현성을 위해 고정했습니다. 버전을 바꿀 때는 두 도구의 설치 흐름을 다시 확인해 주세요.

설치 검증은 로컬에서도 실행할 수 있습니다. Node.js 22 이상, npm의 `npx`, Git과 네트워크 연결이 필요합니다. 스크립트가 고정된 CLI 버전을 받아 임시 사용자 설정에 설치하므로 기존 플러그인 설정을 바꾸지 않습니다. 모델을 호출하거나 교정 품질을 평가하지는 않습니다.

```bash
node scripts/smoke-install.mjs
```

`check-package.mjs`는 두 도구의 공통 메타데이터와 배포 경로, 최신 변경 이력의 버전, 출력 스타일 본문, 라이선스, 로컬 문서 링크와 텍스트 형식을 확인합니다. 회귀 테스트는 잘못된 버전·경로·스타일·링크 등을 넣은 임시 저장소에서 검사가 오류를 잡는지 확인합니다. 이 검증은 플랫폼의 전체 스키마 검증이나 모델의 실제 교정 품질 평가를 대신하지 않습니다.

## 파일 관리 원칙

- 공통 작업 지침은 `AGENTS.md`에서 관리하고 `CLAUDE.md`는 이를 불러오게 유지합니다. 자세한 예시는 `docs/writing-examples.md`에 둡니다.
- 한국어 설명은 정확성, 명료성, 자연스러움과 간결성을 기준으로 작성합니다. 교정 예시에 원문에 없는 원인·수치·결과를 추가하거나 가능성을 사실로 바꾸지 않습니다.
- 공통 스킬과 참고 자료는 `plugins/natural-korean/skills/natural-korean/`에 함께 둡니다. 참조 경로는 플러그인 안에서 해결되어야 합니다.
- 출력 스타일의 공통 한국어 기준을 수정하면 두 스타일에 같은 내용을 반영합니다. 코딩 지침을 유지하는 차이는 보존합니다.
- 두 도구의 플러그인 이름과 버전은 일치시킵니다.
- 텍스트는 UTF-8과 LF 줄바꿈을 사용합니다. JSON은 공백 2칸으로 들여씁니다.
- 루트와 배포 폴더의 `LICENSE`는 같은 내용을 유지합니다.
- 인증 정보, 개인 설정과 세션 기록은 커밋하지 않습니다.

## 배포

유지보수자는 배포할 때 두 `plugin.json`의 버전을 함께 올리고 `CHANGELOG.md`에 변경 사항을 기록합니다. 버전은 [Semantic Versioning](https://semver.org/)을 따릅니다. 마켓플레이스 항목에는 버전을 중복으로 적지 않습니다.

플러그인 이름, 마켓플레이스 이름이나 저장소 주소를 바꾸면 README의 설치·업데이트·제거 명령도 함께 고칩니다. GitHub Actions 검증과 실제 사용 확인을 마친 뒤 배포합니다. 명시한 버전이 같으면 기존 사용자가 새 파일을 받지 못할 수 있으므로, 배포할 변경마다 버전을 갱신합니다.

공개 저장소에 변경 사항을 푸시한 뒤에는 GitHub 인증을 사용하지 않는 원격 설치 검증도 실행합니다. 원격 `main`에서 설치한 파일을 현재 로컬 배포 폴더와 비교하므로 두 내용이 같아야 통과합니다. Git 인증 설정과 GitHub 토큰은 검증용 자식 프로세스에서만 제외합니다.

```bash
node scripts/smoke-install.mjs --remote
```

배포 규격은 [Claude Code 마켓플레이스 안내](https://code.claude.com/docs/en/plugin-marketplaces)와 [OpenAI 플러그인 제작 안내](https://developers.openai.com/plugins/build/plugins)를 참고하세요. 이 저장소는 자체 마켓플레이스로 배포하며, 공식 플러그인 디렉터리에 등록하려면 각 서비스의 별도 제출 절차를 따라야 합니다.

기여한 내용은 이 저장소의 [MIT License](LICENSE)로 배포됩니다.
