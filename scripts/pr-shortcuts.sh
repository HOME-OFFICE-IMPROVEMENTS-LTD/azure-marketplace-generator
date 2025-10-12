#!/bin/bash

# Quick PR workflow commands - shortcuts for common operations
# Source this file to add convenient functions to your shell

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Quick PR list
prs() {
    echo -e "${CYAN}📋 Quick PR Overview${NC}"
    ./scripts/pr-manager.sh list
}

# Quick PR status for current branch
prst() {
    echo -e "${CYAN}📊 Current PR Status${NC}"
    ./scripts/pr-manager.sh status
}

# Quick PR checks
prcheck() {
    local pr=${1:-$(gh pr view --json number --jq '.number' 2>/dev/null)}
    if [ -n "$pr" ]; then
        echo -e "${CYAN}🔍 PR #${pr} Checks${NC}"
        ./scripts/pr-manager.sh checks --pr "$pr"
    else
        echo -e "${RED}❌ No PR found${NC}"
    fi
}

# Quick approve PR
prapprove() {
    local pr=$1
    local comment="$2"
    if [ -z "$pr" ]; then
        echo -e "${RED}❌ Usage: prapprove PR_NUMBER [comment]${NC}"
        return 1
    fi
    ./scripts/pr-manager.sh review --pr "$pr" --approve ${comment:+--body "$comment"}
}

# Quick merge PR
prmerge() {
    local pr=$1
    local method=${2:-squash}
    if [ -z "$pr" ]; then
        echo -e "${RED}❌ Usage: prmerge PR_NUMBER [squash|merge|rebase]${NC}"
        return 1
    fi
    ./scripts/pr-manager.sh merge --pr "$pr" --method "$method"
}

# Quick create PR
prcreate() {
    local title="$1"
    local base="${2:-develop}"

    if [ -z "$title" ]; then
        echo -e "${YELLOW}💡 Creating PR with smart defaults...${NC}"
        ./scripts/pr-manager.sh create --base "$base"
    else
        ./scripts/pr-manager.sh create --title "$title" --base "$base"
    fi
}

# Quick rebase current PR
prrebase() {
    local force="$1"
    echo -e "${CYAN}🔄 Rebasing current PR...${NC}"
    ./scripts/pr-manager.sh rebase ${force:+--force}
}

# Show PR diff
prdiff() {
    local pr=${1:-$(gh pr view --json number --jq '.number' 2>/dev/null)}
    if [ -n "$pr" ]; then
        gh pr diff "$pr"
    else
        echo -e "${RED}❌ No PR specified or found${NC}"
    fi
}

# Quick workflow: feature branch → PR → merge
workflow() {
    local branch_name="$1"
    local pr_title="$2"
    local target_branch="${3:-develop}"

    if [ -z "$branch_name" ] || [ -z "$pr_title" ]; then
        echo -e "${CYAN}🔄 Feature Workflow${NC}"
        echo "Usage: workflow BRANCH_NAME 'PR Title' [target_branch]"
        echo
        echo "Example: workflow feature/fix-bug 'Fix critical security bug' develop"
        return 1
    fi

    echo -e "${CYAN}🚀 Starting feature workflow...${NC}"
    echo "Branch: $branch_name"
    echo "Title: $pr_title"
    echo "Target: $target_branch"
    echo

    # Create and switch to feature branch
    git checkout "$target_branch"
    git pull origin "$target_branch"
    git checkout -b "$branch_name"

    echo -e "${GREEN}✅ Created branch: $branch_name${NC}"
    echo -e "${YELLOW}💡 Make your changes, then run: workflowcomplete${NC}"
}

# Complete workflow: commit → push → PR
workflowcomplete() {
    local commit_msg="$1"
    local pr_title="$2"

    local current_branch=$(git branch --show-current)

    if [[ "$current_branch" == "main" || "$current_branch" == "develop" ]]; then
        echo -e "${RED}❌ Cannot complete workflow from protected branch: $current_branch${NC}"
        return 1
    fi

    if [ -z "$commit_msg" ]; then
        read -p "Commit message: " commit_msg
    fi

    if [ -z "$pr_title" ]; then
        pr_title="$commit_msg"
    fi

    echo -e "${CYAN}🚀 Completing workflow...${NC}"

    # Add, commit, push
    git add .
    git commit -m "$commit_msg"
    git push -u origin "$current_branch"

    # Create PR
    ./scripts/pr-manager.sh create --title "$pr_title" --base develop

    echo -e "${GREEN}✅ Workflow complete! PR created.${NC}"
}

# Git shortcuts for our workflow
gwip() {
    git add .
    git commit -m "WIP: $(git branch --show-current)"
    git push -u origin "$(git branch --show-current)" 2>/dev/null || git push
}

gfix() {
    local msg="$1"
    git add .
    git commit -m "fix: ${msg:-quick fix}"
    git push
}

gfeat() {
    local msg="$1"
    git add .
    git commit -m "feat: ${msg:-new feature}"
    git push
}

# Show available shortcuts
prhelp() {
    echo -e "${CYAN}🔧 PR Management Shortcuts${NC}"
    echo "=========================="
    echo
    echo -e "${YELLOW}Quick Commands:${NC}"
    echo "  prs                    - List all PRs"
    echo "  prst                   - Status of current PR"
    echo "  prcheck [PR]           - Show PR checks"
    echo "  prapprove PR [comment] - Approve PR"
    echo "  prmerge PR [method]    - Merge PR"
    echo "  prcreate [title]       - Create PR"
    echo "  prrebase [--force]     - Rebase current PR"
    echo "  prdiff [PR]            - Show PR diff"
    echo
    echo -e "${YELLOW}Workflow Commands:${NC}"
    echo "  workflow BRANCH TITLE  - Start feature workflow"
    echo "  workflowcomplete       - Commit, push, create PR"
    echo
    echo -e "${YELLOW}Git Shortcuts:${NC}"
    echo "  gwip                   - Quick WIP commit and push"
    echo "  gfix 'message'         - Quick fix commit and push"
    echo "  gfeat 'message'        - Quick feature commit and push"
    echo
    echo -e "${YELLOW}Full PR Manager:${NC}"
    echo "  ./scripts/pr-manager.sh help - Full PR manager help"
}

echo -e "${GREEN}✅ PR workflow shortcuts loaded!${NC}"
echo -e "${YELLOW}💡 Run 'prhelp' to see available commands${NC}"