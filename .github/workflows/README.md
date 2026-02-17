# Setup Instructions for Issue Auto Labeler

This document provides instructions for setting up the Issue Auto Labeler workflow.

## Prerequisites

The workflow has been created and compiled. The following files are included:
- `.github/workflows/issue-auto-labeler.md` - The workflow definition
- `.github/workflows/issue-auto-labeler.lock.yml` - The compiled workflow
- `.gitattributes` - Configuration for lock file handling

## Required Labels

The Issue Auto Labeler workflow requires the following labels to be created in the repository:

### Type Labels
- `tool` - Tool-related application (CLI, Web, API, etc.)
- `game` - Game-related application

### Application Type Labels (新增)
- `web-app` - Web Application (網頁應用程式)
- `script` - Script (腳本)
- `cli-tool` - CLI Tool (CLI 工具)
- `api-service` - API Service (API 服務)
- `desktop-app` - Desktop Application (桌面應用程式)
- `game-prototype` - Game Prototype (遊戲原型)
- `library` - Library/Package (函式庫/套件)

### Status Labels
- `proposal` - New proposal, not yet evaluated
- `needs-info` - Insufficient information, waiting for clarification
- `accepted` - Requirement ready for implementation, scheduled
- `in-progress` - Under development
- `blocked` - Blocked by dependencies, environment, legal or external factors
- `done` - Delivered
- `wont-do` - Will not be implemented

## Creating Labels

You can create these labels manually through the GitHub UI or using the GitHub CLI:

### Option 1: Using GitHub CLI (Recommended)

```bash
# Type labels
gh label create "tool" --color "0075ca" --description "Tool-related application (CLI, Web, API, etc.)"
gh label create "game" --color "d876e3" --description "Game-related application"

# Application Type labels (新增)
gh label create "web-app" --color "1f77b4" --description "Web Application (網頁應用程式)"
gh label create "script" --color "ff7f0e" --description "Script (腳本)"
gh label create "cli-tool" --color "2ca02c" --description "CLI Tool (CLI 工具)"
gh label create "api-service" --color "d62728" --description "API Service (API 服務)"
gh label create "desktop-app" --color "9467bd" --description "Desktop Application (桌面應用程式)"
gh label create "game-prototype" --color "8c564b" --description "Game Prototype (遊戲原型)"
gh label create "library" --color "e377c2" --description "Library/Package (函式庫/套件)"

# Status labels
gh label create "proposal" --color "fbca04" --description "New proposal, not yet evaluated"
gh label create "needs-info" --color "d93f0b" --description "Insufficient information, waiting for clarification"
gh label create "accepted" --color "0e8a16" --description "Requirement ready for implementation, scheduled"
gh label create "in-progress" --color "1d76db" --description "Under development"
gh label create "blocked" --color "b60205" --description "Blocked by dependencies, environment, or external factors"
gh label create "done" --color "5319e7" --description "Delivered"
gh label create "wont-do" --color "ffffff" --description "Will not be implemented"
```

### Option 2: Using GitHub Web UI

1. Go to your repository on GitHub
2. Click on "Issues" tab
3. Click on "Labels" button
4. Click "New label" for each label listed above
5. Enter the name, description, and choose a color

## How the Workflow Works

1. **Trigger**: The workflow runs automatically when:
   - A new issue is opened
   - An existing issue is edited
   - An issue is reopened
   - Manually triggered via workflow_dispatch

2. **Analysis**: The AI agent analyzes:
   - Issue title and content
   - Completeness of requirements
   - Compliance with project guidelines

3. **Labeling**: The agent applies appropriate labels:
   - One type label (`tool` or `game`)
   - One application type label (`web-app`, `script`, `cli-tool`, `api-service`, `desktop-app`, `game-prototype`, `library`)
   - One or more status labels (`proposal`, `needs-info`, `accepted`, etc.)

## Testing the Workflow

After creating the labels and merging this PR:

1. Create a new issue using one of the issue templates
2. The workflow should run automatically
3. Check that appropriate labels are added to the issue
4. You can view workflow runs in the "Actions" tab

## Troubleshooting

If the workflow doesn't run:
- Ensure all required labels exist in the repository
- Check that the workflow file is in the main branch
- Verify workflow permissions in repository settings
- Check the Actions tab for any error messages

## Customization

To modify the labeling logic:
1. Edit `.github/workflows/issue-auto-labeler.md`
2. Run `gh aw compile issue-auto-labeler` to regenerate the lock file
3. Commit both the `.md` and `.lock.yml` files
