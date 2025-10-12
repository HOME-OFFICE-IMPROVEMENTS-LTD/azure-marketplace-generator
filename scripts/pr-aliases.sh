# PR Management Aliases for .bashrc or .zshrc
# Add these lines to your shell configuration file

# PR Manager shortcuts
alias pr='./scripts/pr-manager.sh'
alias prl='./scripts/pr-manager.sh list'
alias prs='./scripts/pr-manager.sh status'
alias prc='./scripts/pr-manager.sh create'
alias prm='./scripts/pr-manager.sh merge'
alias prr='./scripts/pr-manager.sh review'
alias prch='./scripts/pr-manager.sh checks'

# Load PR shortcuts when in project directory
if [ -f "scripts/pr-shortcuts.sh" ]; then
    source scripts/pr-shortcuts.sh
fi

# Quick functions for common operations
pr-approve() {
    if [ -z "$1" ]; then
        echo "Usage: pr-approve PR_NUMBER [comment]"
        return 1
    fi
    ./scripts/pr-manager.sh review --pr "$1" --approve ${2:+--body "$2"}
}

pr-merge-squash() {
    if [ -z "$1" ]; then
        echo "Usage: pr-merge-squash PR_NUMBER"
        return 1
    fi
    ./scripts/pr-manager.sh merge --pr "$1" --method squash
}

pr-current() {
    local pr_number=$(gh pr view --json number --jq '.number' 2>/dev/null)
    if [ -n "$pr_number" ]; then
        ./scripts/pr-manager.sh status --pr "$pr_number"
    else
        echo "No PR found for current branch"
    fi
}

# Auto-complete for PR numbers (bash)
_pr_complete() {
    local cur=${COMP_WORDS[COMP_CWORD]}
    local pr_numbers=$(gh pr list --json number --jq '.[].number' 2>/dev/null | tr '\n' ' ')
    COMPREPLY=($(compgen -W "$pr_numbers" -- "$cur"))
}

# Register auto-complete
if [ -n "$BASH_VERSION" ]; then
    complete -F _pr_complete pr-approve pr-merge-squash prr prm
fi