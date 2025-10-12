#!/bin/bash

# GitHub PR Management Script - CLI-based workflow
# Avoid GitHub UI completely with systematic PR operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to display help
show_help() {
    echo -e "${CYAN}🔧 GitHub PR Manager - CLI Workflow${NC}"
    echo "======================================"
    echo
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo -e "${YELLOW}Commands:${NC}"
    echo "  list           - List all open PRs with details"
    echo "  status         - Show detailed status of current/specific PR"
    echo "  review         - Review and approve/reject PR"
    echo "  merge          - Merge approved PR"
    echo "  create         - Create new PR from current branch"
    echo "  update         - Update PR description/title"
    echo "  checks         - Show CI/CD check status"
    echo "  approve        - Approve PR (if you have permissions)"
    echo "  close          - Close PR without merging"
    echo "  rebase         - Rebase PR branch on target"
    echo
    echo -e "${YELLOW}Options:${NC}"
    echo "  --pr NUMBER    - Specify PR number"
    echo "  --base BRANCH  - Specify base branch (default: develop)"
    echo "  --title TITLE  - Specify PR title"
    echo "  --body TEXT    - Specify PR body/description"
    echo "  --draft        - Create as draft PR"
    echo "  --force        - Force operations (use with caution)"
    echo
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 list"
    echo "  $0 status --pr 37"
    echo "  $0 review --pr 37"
    echo "  $0 merge --pr 37"
    echo "  $0 create --title 'Fix security issues' --base develop"
}

# Function to list all PRs
list_prs() {
    echo -e "${CYAN}📋 Open Pull Requests${NC}"
    echo "======================"

    gh pr list --json number,title,author,state,createdAt,updatedAt,mergeable,reviewDecision,statusCheckRollup \
        --template '{{range .}}{{printf "#%v" .number | color "blue"}} {{.title | color "white"}}
  👤 Author: {{.author.login | color "yellow"}}
  📅 Created: {{timeago .createdAt | color "green"}}
  🔄 Updated: {{timeago .updatedAt | color "green"}}
  🔀 Mergeable: {{if eq .mergeable "MERGEABLE"}}{{color "green" "✅ Yes"}}{{else if eq .mergeable "CONFLICTING"}}{{color "red" "❌ Conflicts"}}{{else}}{{color "yellow" "⚠️ Unknown"}}{{end}}
  👥 Review: {{if .reviewDecision}}{{if eq .reviewDecision "APPROVED"}}{{color "green" "✅ Approved"}}{{else if eq .reviewDecision "CHANGES_REQUESTED"}}{{color "red" "❌ Changes Requested"}}{{else}}{{color "yellow" "⏳ Review Required"}}{{end}}{{else}}{{color "yellow" "⏳ No Reviews"}}{{end}}
  🔍 Checks: {{if .statusCheckRollup}}{{len .statusCheckRollup}} checks{{else}}No checks{{end}}
  {{printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | color "blue"}}
{{end}}'
}

# Function to show detailed PR status
show_pr_status() {
    local pr_number=${1:-$(gh pr view --json number --jq '.number' 2>/dev/null || echo "")}

    if [ -z "$pr_number" ]; then
        echo -e "${RED}❌ No PR specified and not on a branch with an open PR${NC}"
        echo "Usage: $0 status --pr NUMBER"
        return 1
    fi

    echo -e "${CYAN}📊 PR #${pr_number} Detailed Status${NC}"
    echo "=========================="

    # Basic PR info
    gh pr view "$pr_number" --json title,author,state,createdAt,updatedAt,mergeable,reviewDecision,body,headRefName,baseRefName \
        --template '📝 Title: {{.title | color "white"}}
👤 Author: {{.author.login | color "yellow"}}
🌿 Branch: {{.headRefName | color "green"}} → {{.baseRefName | color "blue"}}
📅 Created: {{timeago .createdAt | color "green"}}
🔄 Updated: {{timeago .updatedAt | color "green"}}
🔀 Mergeable: {{if eq .mergeable "MERGEABLE"}}{{color "green" "✅ Yes"}}{{else if eq .mergeable "CONFLICTING"}}{{color "red" "❌ Conflicts"}}{{else}}{{color "yellow" "⚠️ Unknown"}}{{end}}
👥 Review: {{if .reviewDecision}}{{if eq .reviewDecision "APPROVED"}}{{color "green" "✅ Approved"}}{{else if eq .reviewDecision "CHANGES_REQUESTED"}}{{color "red" "❌ Changes Requested"}}{{else}}{{color "yellow" "⏳ Review Required"}}{{end}}{{else}}{{color "yellow" "⏳ No Reviews"}}{{end}}

📋 Description:
{{.body}}
'

    echo
    echo -e "${PURPLE}🔍 Check Status:${NC}"
    gh pr checks "$pr_number" || echo "No checks found"

    echo
    echo -e "${PURPLE}💬 Recent Comments:${NC}"
    gh pr view "$pr_number" --comments | tail -10
}

# Function to review PR
review_pr() {
    local pr_number=$1
    local action=$2
    local comment=$3

    if [ -z "$pr_number" ]; then
        echo -e "${RED}❌ PR number required${NC}"
        echo "Usage: $0 review --pr NUMBER"
        return 1
    fi

    echo -e "${CYAN}📝 Reviewing PR #${pr_number}${NC}"
    echo "===================="

    # Show current status first
    show_pr_status "$pr_number"

    echo
    echo -e "${YELLOW}Review Options:${NC}"
    echo "1. 👍 Approve"
    echo "2. 👎 Request Changes"
    echo "3. 💬 Comment Only"
    echo "4. 🔍 Show Diff"
    echo "5. 🚫 Cancel"

    if [ -z "$action" ]; then
        read -p "Choose action (1-5): " choice
    else
        choice=$action
    fi

    case $choice in
        1|approve)
            if [ -z "$comment" ]; then
                read -p "Approval comment (optional): " comment
            fi
            gh pr review "$pr_number" --approve ${comment:+--body "$comment"}
            echo -e "${GREEN}✅ PR approved!${NC}"
            ;;
        2|request-changes)
            if [ -z "$comment" ]; then
                read -p "Change request comment (required): " comment
                while [ -z "$comment" ]; do
                    read -p "Comment is required for change requests: " comment
                done
            fi
            gh pr review "$pr_number" --request-changes --body "$comment"
            echo -e "${YELLOW}📝 Changes requested!${NC}"
            ;;
        3|comment)
            if [ -z "$comment" ]; then
                read -p "Comment: " comment
            fi
            gh pr review "$pr_number" --comment ${comment:+--body "$comment"}
            echo -e "${BLUE}💬 Comment added!${NC}"
            ;;
        4|diff)
            gh pr diff "$pr_number"
            ;;
        5|cancel)
            echo -e "${YELLOW}🚫 Review cancelled${NC}"
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            ;;
    esac
}

# Function to merge PR
merge_pr() {
    local pr_number=$1
    local merge_method=${2:-squash}

    if [ -z "$pr_number" ]; then
        echo -e "${RED}❌ PR number required${NC}"
        echo "Usage: $0 merge --pr NUMBER"
        return 1
    fi

    echo -e "${CYAN}🔀 Merging PR #${pr_number}${NC}"
    echo "==================="

    # Check if PR is approved and checks pass
    local status=$(gh pr view "$pr_number" --json reviewDecision,mergeable,statusCheckRollup --jq '{reviewDecision, mergeable, checks: (.statusCheckRollup | length)}')
    echo "PR Status: $status"

    echo -e "${YELLOW}Merge Options:${NC}"
    echo "1. 🔀 Squash and merge (recommended)"
    echo "2. 🔗 Merge commit"
    echo "3. 📋 Rebase and merge"
    echo "4. 🚫 Cancel"

    read -p "Choose merge method (1-4, default: 1): " choice
    choice=${choice:-1}

    case $choice in
        1|squash)
            gh pr merge "$pr_number" --squash --delete-branch
            echo -e "${GREEN}✅ PR squashed and merged!${NC}"
            ;;
        2|merge)
            gh pr merge "$pr_number" --merge --delete-branch
            echo -e "${GREEN}✅ PR merged with merge commit!${NC}"
            ;;
        3|rebase)
            gh pr merge "$pr_number" --rebase --delete-branch
            echo -e "${GREEN}✅ PR rebased and merged!${NC}"
            ;;
        4|cancel)
            echo -e "${YELLOW}🚫 Merge cancelled${NC}"
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            ;;
    esac
}

# Function to create new PR
create_pr() {
    local title="$1"
    local body="$2"
    local base="${3:-develop}"
    local draft="$4"

    local current_branch=$(git branch --show-current)

    if [ "$current_branch" = "$base" ]; then
        echo -e "${RED}❌ Cannot create PR from $base to $base${NC}"
        echo "Switch to a feature branch first"
        return 1
    fi

    echo -e "${CYAN}📤 Creating PR from ${current_branch} to ${base}${NC}"
    echo "============================================"

    if [ -z "$title" ]; then
        # Generate smart title from branch name and recent commits
        local smart_title=$(echo "$current_branch" | sed 's/[_-]/ /g' | sed 's/\b\w/\U&/g')
        local recent_commit=$(git log -1 --pretty=format:"%s")
        echo -e "${YELLOW}Suggested title: $smart_title${NC}"
        echo -e "${YELLOW}Recent commit: $recent_commit${NC}"
        read -p "PR Title: " title
        title=${title:-$smart_title}
    fi

    if [ -z "$body" ]; then
        echo "PR Description (enter empty line to finish):"
        body=""
        while IFS= read -r line; do
            [ -z "$line" ] && break
            body="$body$line\n"
        done
    fi

    local draft_flag=""
    if [ "$draft" = "true" ] || [ "$draft" = "--draft" ]; then
        draft_flag="--draft"
    fi

    # Create the PR
    local pr_url=$(gh pr create --title "$title" --body "$body" --base "$base" $draft_flag)

    echo -e "${GREEN}✅ PR created: $pr_url${NC}"

    # Show the created PR status
    local pr_number=$(echo "$pr_url" | grep -o '[0-9]\+$')
    show_pr_status "$pr_number"
}

# Function to update PR
update_pr() {
    local pr_number=$1
    local title="$2"
    local body="$3"

    if [ -z "$pr_number" ]; then
        pr_number=$(gh pr view --json number --jq '.number' 2>/dev/null || echo "")
    fi

    if [ -z "$pr_number" ]; then
        echo -e "${RED}❌ No PR specified and not on a branch with an open PR${NC}"
        return 1
    fi

    echo -e "${CYAN}📝 Updating PR #${pr_number}${NC}"
    echo "===================="

    # Show current PR info
    gh pr view "$pr_number" --json title,body --template 'Current Title: {{.title}}
Current Description:
{{.body}}'

    echo
    if [ -z "$title" ]; then
        read -p "New title (press enter to keep current): " title
    fi

    if [ -z "$body" ]; then
        echo "New description (enter empty line to finish, or press enter to keep current):"
        body=""
        while IFS= read -r line; do
            [ -z "$line" ] && break
            body="$body$line\n"
        done
    fi

    # Update PR
    local update_args=""
    [ -n "$title" ] && update_args="$update_args --title \"$title\""
    [ -n "$body" ] && update_args="$update_args --body \"$body\""

    if [ -n "$update_args" ]; then
        eval "gh pr edit $pr_number $update_args"
        echo -e "${GREEN}✅ PR updated!${NC}"
    else
        echo -e "${YELLOW}⚠️ No changes made${NC}"
    fi
}

# Function to rebase PR
rebase_pr() {
    local pr_number=$1
    local force="${2:-false}"

    if [ -z "$pr_number" ]; then
        pr_number=$(gh pr view --json number --jq '.number' 2>/dev/null || echo "")
    fi

    if [ -z "$pr_number" ]; then
        echo -e "${RED}❌ No PR specified${NC}"
        return 1
    fi

    echo -e "${CYAN}🔄 Rebasing PR #${pr_number}${NC}"
    echo "===================="

    # Get PR info
    local pr_info=$(gh pr view "$pr_number" --json headRefName,baseRefName,author --jq '{head: .headRefName, base: .baseRefName, author: .author.login}')
    local head_branch=$(echo "$pr_info" | jq -r '.head')
    local base_branch=$(echo "$pr_info" | jq -r '.base')
    local author=$(echo "$pr_info" | jq -r '.author')

    echo "Rebasing $head_branch onto $base_branch"

    # Switch to the PR branch
    gh pr checkout "$pr_number"

    # Fetch latest changes
    git fetch origin "$base_branch"

    # Rebase
    if git rebase "origin/$base_branch"; then
        echo -e "${GREEN}✅ Rebase successful${NC}"

        # Push the rebased branch
        if [ "$force" = "true" ] || [ "$force" = "--force" ]; then
            git push --force-with-lease origin "$head_branch"
            echo -e "${GREEN}✅ Force pushed rebased branch${NC}"
        else
            echo -e "${YELLOW}⚠️ Rebase complete. Run with --force to push changes${NC}"
        fi
    else
        echo -e "${RED}❌ Rebase failed - resolve conflicts manually${NC}"
        echo "Run: git rebase --continue (after fixing conflicts)"
        echo "Or: git rebase --abort (to cancel)"
        return 1
    fi
}

# Main script logic
case "$1" in
    list|ls)
        list_prs
        ;;
    status|show)
        shift
        pr_number=""
        while [[ $# -gt 0 ]]; do
            case $1 in
                --pr)
                    pr_number="$2"
                    shift 2
                    ;;
                *)
                    pr_number="$1"
                    shift
                    ;;
            esac
        done
        show_pr_status "$pr_number"
        ;;
    review)
        shift
        pr_number=""
        action=""
        comment=""
        while [[ $# -gt 0 ]]; do
            case $1 in
                --pr)
                    pr_number="$2"
                    shift 2
                    ;;
                --approve)
                    action="approve"
                    shift
                    ;;
                --request-changes)
                    action="request-changes"
                    shift
                    ;;
                --comment)
                    action="comment"
                    shift
                    ;;
                --body)
                    comment="$2"
                    shift 2
                    ;;
                *)
                    if [ -z "$pr_number" ]; then
                        pr_number="$1"
                    fi
                    shift
                    ;;
            esac
        done
        review_pr "$pr_number" "$action" "$comment"
        ;;
    merge)
        shift
        pr_number=""
        method="squash"
        while [[ $# -gt 0 ]]; do
            case $1 in
                --pr)
                    pr_number="$2"
                    shift 2
                    ;;
                --method)
                    method="$2"
                    shift 2
                    ;;
                *)
                    pr_number="$1"
                    shift
                    ;;
            esac
        done
        merge_pr "$pr_number" "$method"
        ;;
    create|new)
        shift
        title=""
        body=""
        base="develop"
        draft="false"
        while [[ $# -gt 0 ]]; do
            case $1 in
                --title)
                    title="$2"
                    shift 2
                    ;;
                --body)
                    body="$2"
                    shift 2
                    ;;
                --base)
                    base="$2"
                    shift 2
                    ;;
                --draft)
                    draft="true"
                    shift
                    ;;
                *)
                    shift
                    ;;
            esac
        done
        create_pr "$title" "$body" "$base" "$draft"
        ;;
    update|edit)
        shift
        pr_number=""
        title=""
        body=""
        while [[ $# -gt 0 ]]; do
            case $1 in
                --pr)
                    pr_number="$2"
                    shift 2
                    ;;
                --title)
                    title="$2"
                    shift 2
                    ;;
                --body)
                    body="$2"
                    shift 2
                    ;;
                *)
                    if [ -z "$pr_number" ]; then
                        pr_number="$1"
                    fi
                    shift
                    ;;
            esac
        done
        update_pr "$pr_number" "$title" "$body"
        ;;
    checks|ci)
        shift
        pr_number=""
        while [[ $# -gt 0 ]]; do
            case $1 in
                --pr)
                    pr_number="$2"
                    shift 2
                    ;;
                *)
                    pr_number="$1"
                    shift
                    ;;
            esac
        done
        pr_number=${pr_number:-$(gh pr view --json number --jq '.number' 2>/dev/null || echo "")}
        if [ -n "$pr_number" ]; then
            echo -e "${CYAN}🔍 PR #${pr_number} Check Status${NC}"
            echo "========================"
            gh pr checks "$pr_number"
        else
            echo -e "${RED}❌ No PR specified${NC}"
        fi
        ;;
    rebase)
        shift
        pr_number=""
        force="false"
        while [[ $# -gt 0 ]]; do
            case $1 in
                --pr)
                    pr_number="$2"
                    shift 2
                    ;;
                --force)
                    force="true"
                    shift
                    ;;
                *)
                    pr_number="$1"
                    shift
                    ;;
            esac
        done
        rebase_pr "$pr_number" "$force"
        ;;
    close)
        shift
        pr_number=""
        while [[ $# -gt 0 ]]; do
            case $1 in
                --pr)
                    pr_number="$2"
                    shift 2
                    ;;
                *)
                    pr_number="$1"
                    shift
                    ;;
            esac
        done
        if [ -n "$pr_number" ]; then
            gh pr close "$pr_number"
            echo -e "${YELLOW}🚫 PR #${pr_number} closed${NC}"
        else
            echo -e "${RED}❌ PR number required${NC}"
        fi
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo
        show_help
        exit 1
        ;;
esac