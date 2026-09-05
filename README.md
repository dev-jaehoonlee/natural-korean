# Natural Korean

쉽고 정확한 어휘로 명료하고 자연스러운 한국어를 쓰도록 돕는 **Claude Code·Codex 플러그인**입니다. 두 도구에서 같은 교정 스킬을 사용하며, Claude Code에서는 평소 답변에 적용할 출력 스타일도 제공합니다.

원문의 뜻과 어체를 지키고, 요청한 수정 범위에서 번역투·불분명한 문장·불필요한 반복을 줄이는 데 중점을 둡니다.

## 지원 기능

| 기능 | Claude Code | Codex |
| --- | --- | --- |
| 한국어 문장·문서 교정 스킬 | 지원 | 지원 |
| 코딩용 한국어 출력 스타일 | 지원 | Claude Code 전용 형식 |
| 글쓰기용 한국어 출력 스타일 | 지원 | Claude Code 전용 형식 |

Codex에서도 한국어 문체 지침을 적용할 수 있지만, Claude Code의 출력 스타일 선택 기능과 코딩 지침 전환 설정을 그대로 사용하지는 못합니다. 아래 [Codex의 평소 답변에 적용하기](#codex의-평소-답변에-적용하기)를 참고하세요.

플러그인을 지원하는 최신 Claude Code 또는 Codex CLI와 Git이 필요합니다. 플러그인 자체에는 별도의 실행 프로그램이나 API 키가 필요하지 않으며, 사용하는 도구의 로그인·이용 조건은 그대로 적용됩니다. 조직에서 외부 플러그인 설치를 제한한 경우에는 관리자 정책을 따릅니다.

이 저장소를 마켓플레이스로 직접 등록해 설치합니다. 저장소 공개와 각 서비스의 공식 플러그인 목록 등록은 별개입니다.

## 빠른 시작

### Claude Code

터미널에서 실행한 Claude Code의 대화창에 다음 명령을 차례로 입력합니다.

```text
/plugin marketplace add dev-jaehoonlee/natural-korean
/plugin install natural-korean@natural-korean-marketplace
```

설치는 기본적으로 사용자 범위에 적용됩니다. `/plugin`의 **Installed** 탭에서 `natural-korean`이 활성화되어 있는지 확인하고 새 세션을 시작합니다. 꺼져 있다면 `/plugin enable natural-korean@natural-korean-marketplace`로 활성화합니다.

교정할 글을 입력합니다.

```text
/natural-korean:natural-korean 다음 문장을 자연스럽게 다듬어 줘: 검토를 수행한 후 결과에 대한 공유를 진행하겠습니다.
```

교정 결과의 예:

> 검토한 뒤 결과를 공유하겠습니다.

### Codex

터미널에서 마켓플레이스를 등록하고 플러그인을 설치합니다.

```bash
codex plugin marketplace add dev-jaehoonlee/natural-korean
codex plugin add natural-korean@natural-korean-marketplace
```

설치한 뒤 새 Codex 작업이나 CLI 세션을 열고 다음처럼 요청합니다.

```text
natural-korean 스킬로 이 문단의 번역투를 다듬고, 중요한 수정 이유만 알려 줘: …
```

설치 상태는 터미널에서 확인할 수 있습니다.

```bash
codex plugin list --json
```

`installed` 목록의 `natural-korean@natural-korean-marketplace` 항목에 `enabled: true`가 표시되면 활성화된 상태입니다. Codex CLI의 `/plugins`에서도 확인할 수 있으며, 꺼져 있으면 해당 항목에서 **Space**를 눌러 켭니다. 자세한 내용은 [공식 플러그인 안내](https://learn.chatgpt.com/docs/plugins)를 참고하세요.

Codex 앱에서도 사용하려면 CLI와 앱이 같은 사용자 설정 경로(`CODEX_HOME`)를 사용해야 합니다. 설치 후 새 작업을 시작하세요.

### 설치가 잘되지 않을 때

- **플러그인 명령이 없음:** Claude Code 또는 Codex CLI를 플러그인을 지원하는 최신 버전으로 업데이트합니다.
- **저장소 접근 실패:** Git 설치와 GitHub 연결을 확인합니다. 공개 저장소 다운로드에는 GitHub 계정이나 저장소 초대가 필요하지 않습니다. 비공개 Fork를 사용한다면 별도의 접근 권한과 Git 인증이 필요합니다.
- **같은 이름의 마켓플레이스가 이미 있음:** 이전에 로컬 개발용으로 등록했는지 확인합니다. 필요하면 [제거 명령](#업데이트와-제거)으로 기존 항목을 제거하고 이 저장소를 다시 등록합니다.
- **설치했지만 스킬이 보이지 않음:** 위 방법으로 활성화 상태를 확인한 뒤 새 세션을 시작합니다. Codex 앱에서만 보이지 않으면 CLI와 앱의 사용자 설정 경로도 확인합니다.
- **Claude Code 출력 스타일이 적용되지 않음:** 플러그인 활성화와 별개로 아래에서 출력 스타일을 선택해야 합니다.

## 교정 스킬 사용하기

스킬은 맞춤법, 띄어쓰기, 조사와 어미, 번역투, 불분명한 문장과 장황한 표현을 다듬습니다. 글의 용도, 원하는 문체와 결과 형식을 함께 적으면 도움이 됩니다.

맞춤법만 요청하면 문체와 문단 구조는 유지합니다. 문체 예시를 지정하면 어조와 호흡을 참고하며, 별도 요청이 없으면 교정문을 일괄적으로 `-합니다`체로 바꾸지 않습니다.

Claude Code에서 파일 교정을 요청하는 예:

```text
/natural-korean:natural-korean docs/guide.md를 처음 사용하는 사람도 이해하기 쉽게 다듬어 줘. 명령어와 코드는 유지해 줘.
```

Codex에서는 같은 요청에 `natural-korean 스킬을 사용해 줘`라고 덧붙이면 됩니다. 두 도구 모두 문맥에 따라 스킬을 선택할 수도 있습니다.

### 교정 원칙

- 사실, 수치, 인용, 조건과 확신의 정도를 지킵니다.
- 조사·어미와 문장 성분의 관계를 바로잡고, 영어식 어순을 한국어답게 다듬습니다.
- 익숙하면서도 뜻이 정확한 어휘를 우선합니다.
- 교정만 요청했을 때는 원문에 없는 사실이나 근거를 덧붙이지 않습니다.
- 이미 정확하고 자연스러운 문장은 불필요하게 바꾸지 않습니다.

AI 작성 여부 판정과 통계에 근거한 점수 산정은 다루지 않습니다. 교정 결과와 사실 검증은 별개이며, 중요한 문서는 원문과 결과를 함께 검토하세요.

## Claude Code 출력 스타일

교정 스킬만 사용할 때는 출력 스타일을 바꿀 필요가 없습니다. 평소 답변에도 한국어 품질 기준을 적용하고 싶다면 아래 스타일 중 하나를 선택합니다.

| 스타일 | 용도 | Claude Code 코딩 지침 |
| --- | --- | --- |
| `natural-korean` | 코드 설명, 작업 보고, 기술 문서 등 코딩 중 한국어 답변 | 유지 |
| `natural-korean-writing` | 글쓰기와 일반 대화 | 제외 |

두 스타일은 같은 한국어 품질 기준을 사용합니다. **코딩 작업에는 `natural-korean`을 선택하세요.**

Claude Code 터미널에서 `/config`를 실행하고 **Output style** 메뉴에서 스타일을 선택합니다. 플러그인을 설치하는 것만으로 출력 스타일이 바뀌지는 않습니다.

설정 파일에서 직접 지정하려면 사용 중인 프로젝트의 `.claude/settings.local.json`에 다음 값을 추가합니다. 파일이 이미 있으면 기존 설정을 유지한 채 병합합니다.

```json
{
  "outputStyle": "natural-korean:natural-korean"
}
```

글쓰기용 설정값은 `natural-korean:natural-korean-writing`입니다. 변경한 스타일은 새 세션을 시작하거나 `/clear`로 현재 대화를 비운 뒤 적용됩니다. 자세한 내용은 [출력 스타일 안내](https://code.claude.com/docs/en/output-styles)를 참고하세요.

## Codex의 평소 답변에 적용하기

이 플러그인의 Codex 구성은 교정 스킬을 제공합니다. 평소 답변에도 한국어 원칙을 적용하려면 [AGENTS.md의 한국어 커뮤니케이션 원칙](AGENTS.md#한국어-커뮤니케이션)을 참고해 사용하는 프로젝트의 `AGENTS.md`에 필요한 내용을 반영하세요. 모든 프로젝트에 적용하려면 Codex 사용자 설정 경로의 `AGENTS.md`에 반영할 수 있습니다. 기존 지침은 유지한 채 필요한 내용만 병합합니다.

플러그인을 설치하는 것만으로 이 저장소의 작업 지침이 다른 프로젝트에 적용되지는 않습니다. 또한 `AGENTS.md`는 Claude Code의 `keep-coding-instructions`처럼 기본 코딩 지침을 제외하는 설정이 아닙니다. 자세한 적용 범위는 [Codex AGENTS.md 안내](https://learn.chatgpt.com/docs/agent-configuration/agents-md)를 참고하세요.

## 업데이트와 제거

버전별 변경 사항은 [CHANGELOG.md](CHANGELOG.md)에서 확인할 수 있습니다. 업데이트 후에는 새 작업이나 세션을 시작합니다.

### Claude Code

대화창에서 최신 마켓플레이스 정보를 받은 뒤 플러그인을 업데이트합니다.

```text
/plugin marketplace update natural-korean-marketplace
/plugin update natural-korean@natural-korean-marketplace
```

제거하려면 출력 스타일을 **Default**로 되돌린 뒤 다음 명령을 실행합니다.

```text
/plugin uninstall natural-korean@natural-korean-marketplace
/plugin marketplace remove natural-korean-marketplace
```

### Codex

터미널에서 마켓플레이스를 갱신하고 플러그인을 다시 설치합니다.

```bash
codex plugin marketplace upgrade natural-korean-marketplace
codex plugin add natural-korean@natural-korean-marketplace
```

제거할 때는 다음 명령을 실행합니다.

```bash
codex plugin remove natural-korean@natural-korean-marketplace
codex plugin marketplace remove natural-korean-marketplace
```

## 로컬 개발

저장소를 복제합니다. 아래 정합성 검사와 테스트에는 Node.js 22 이상이 필요하며, 별도의 npm 패키지는 설치하지 않아도 됩니다.

```bash
git clone https://github.com/dev-jaehoonlee/natural-korean.git
cd natural-korean
node scripts/check-package.mjs
node --test scripts/check-package.test.mjs
```

Claude Code에서는 플러그인 디렉터리를 직접 불러옵니다.

```bash
claude --plugin-dir ./plugins/natural-korean
```

Codex에서는 복제한 저장소를 로컬 마켓플레이스로 등록합니다. 이미 같은 이름의 Git 마켓플레이스를 등록했다면 기존 항목을 제거한 뒤 등록합니다.

```bash
codex plugin marketplace add .
codex plugin add natural-korean@natural-korean-marketplace
```

Codex는 설치한 복사본을 사용합니다. 로컬 파일을 수정한 뒤에는 `codex plugin add natural-korean@natural-korean-marketplace`를 다시 실행하고 새 세션을 시작합니다. Git 마켓플레이스에 배포할 때는 두 플러그인의 버전을 함께 올립니다.

배포에 쓰이는 주요 파일은 다음과 같습니다.

```text
natural-korean/
├── .agents/plugins/marketplace.json       # Codex 마켓플레이스
├── .claude-plugin/marketplace.json        # Claude Code 마켓플레이스
├── .github/workflows/validate.yml
├── docs/writing-examples.md
├── scripts/
│   ├── check-package.mjs
│   ├── check-package.test.mjs
│   └── smoke-install.mjs
├── plugins/natural-korean/
│   ├── .claude-plugin/plugin.json
│   ├── .codex-plugin/plugin.json
│   ├── output-styles/
│   │   ├── natural-korean.md
│   │   └── natural-korean-writing.md
│   ├── skills/natural-korean/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── sentence-craft.md
│   │       └── voice.md
│   └── LICENSE
├── AGENTS.md
├── CLAUDE.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

두 마켓플레이스는 같은 `plugins/natural-korean/`을 가리킵니다. 스킬과 참고 자료를 함께 배포해 설치 후에도 참조 경로가 유지됩니다. 저장소 작업 지침은 `AGENTS.md`에서 관리하며 `CLAUDE.md`도 이를 불러옵니다. 자세한 문장 교정 사례는 [교정 예시](docs/writing-examples.md)에 정리했습니다.

검증 방법과 배포 절차는 [기여 안내](CONTRIBUTING.md)에 정리했습니다. GitHub Actions는 Linux와 Windows에서 정합성 검사, 회귀 테스트, Claude Code 설정 검사와 두 도구의 설치·활성화·배포 파일 일치 검사를 실행합니다. 모델을 호출하는 한국어 교정 품질 평가는 포함하지 않습니다.

## 기여와 문의

오류나 개선 제안은 [Issues](https://github.com/dev-jaehoonlee/natural-korean/issues)에 남겨 주세요. 문구나 설정을 수정해 기여하려면 [기여 안내](CONTRIBUTING.md)를 확인하세요.

## 라이선스

[MIT License](LICENSE). Copyright (c) 2026 Jaehoon Lee.
