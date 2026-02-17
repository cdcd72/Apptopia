# GitHub Actions 整合範例

本文件說明如何在 GitHub Actions 中使用 `mdlinkcheck` 來自動檢查 Markdown 連結。

## 基本範例

在專案根目錄建立 `.github/workflows/check-links.yml`：

```yaml
name: Check Markdown Links

on:
  push:
    paths:
      - '**.md'
  pull_request:
    paths:
      - '**.md'
  schedule:
    # 每週一凌晨 2:00 執行（可選）
    - cron: '0 2 * * 1'

jobs:
  check-links:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      
      - name: Install mdlinkcheck
        run: |
          python -m pip install --upgrade pip
          pip install mdlinkcheck
      
      - name: Check links
        run: mdlinkcheck .
```

## 進階範例：使用設定檔

如果需要排除某些 URL（例如本地開發伺服器），可以建立設定檔：

**`.mdlinkcheckrc`**:
```json
{
  "exclude_urls": [
    "^https?://localhost",
    "^https?://127\\.0\\.0\\.1",
    "^https?://.*\\.local"
  ]
}
```

**Workflow**:
```yaml
name: Check Markdown Links

on:
  push:
    paths:
      - '**.md'
      - '.mdlinkcheckrc'
  pull_request:
    paths:
      - '**.md'
      - '.mdlinkcheckrc'

jobs:
  check-links:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      
      - name: Install mdlinkcheck
        run: |
          python -m pip install --upgrade pip
          pip install mdlinkcheck
      
      - name: Check links with config
        run: mdlinkcheck . --config .mdlinkcheckrc
```

## 進階範例：僅檢查變更的檔案

只檢查 PR 中修改的 Markdown 檔案：

```yaml
name: Check Modified Links

on:
  pull_request:
    paths:
      - '**.md'

jobs:
  check-links:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      
      - name: Install mdlinkcheck
        run: |
          python -m pip install --upgrade pip
          pip install mdlinkcheck
      
      - name: Get changed markdown files
        id: changed-files
        run: |
          echo "files=$(git diff --name-only ${{ github.event.pull_request.base.sha }} ${{ github.sha }} | grep '\.md$' | xargs -r dirname | sort -u | head -1)" >> $GITHUB_OUTPUT
      
      - name: Check links in changed files
        if: steps.changed-files.outputs.files != ''
        run: mdlinkcheck ${{ steps.changed-files.outputs.files }}
```

## 進階範例：產生報告並上傳

將檢查結果以 JSON 格式保存為 artifact：

```yaml
name: Check Links with Report

on:
  push:
    paths:
      - '**.md'
  pull_request:
    paths:
      - '**.md'

jobs:
  check-links:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      
      - name: Install mdlinkcheck
        run: |
          python -m pip install --upgrade pip
          pip install mdlinkcheck
      
      - name: Check links and generate report
        run: |
          mdlinkcheck . --format json > link-check-report.json || true
          mdlinkcheck .
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: link-check-report
          path: link-check-report.json
```

## 範例：定期檢查

設定每週自動檢查一次，及早發現失效連結：

```yaml
name: Weekly Link Check

on:
  schedule:
    # 每週一 UTC 02:00 執行
    - cron: '0 2 * * 1'
  workflow_dispatch:  # 允許手動觸發

jobs:
  check-links:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      
      - name: Install mdlinkcheck
        run: |
          python -m pip install --upgrade pip
          pip install mdlinkcheck
      
      - name: Check links
        run: mdlinkcheck .
      
      - name: Create issue if links are broken
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Broken links detected in Markdown files',
              body: 'The weekly link check found broken links. Please check the workflow run for details.',
              labels: ['documentation', 'bug']
            })
```

## 最佳實踐

1. **定期檢查**: 使用 `schedule` 定期執行，及早發現外部連結失效
2. **使用設定檔**: 排除已知會變動的 URL（如本地開發伺服器）
3. **僅檢查變更**: 在 PR 中只檢查修改的檔案，加快回饋速度
4. **保存報告**: 使用 JSON 格式輸出並上傳為 artifact，方便追蹤歷史
5. **自動通知**: 檢查失敗時自動建立 Issue 通知維護者

## 注意事項

- 外部連結檢查可能因網路問題而失敗，建議配置適當的 `--timeout` 參數
- 某些網站可能會封鎖自動化請求，可以將這些 URL 加入排除清單
- 定期檢查建議設定在非尖峰時段，避免影響其他 workflow
