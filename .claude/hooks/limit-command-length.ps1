# PreToolUse hook: blocks Bash/PowerShell commands longer than 150 characters.
# Only reads its input (JSON on stdin), measures the command, prints a message, exits.
# Exit 0 = allow the command. Exit 2 = block it (the stderr message is shown to Claude).
$limit = 150
$raw = [Console]::In.ReadToEnd()
$data = ConvertFrom-Json -InputObject $raw
$command = [string]$data.tool_input.command
if ([string]::IsNullOrEmpty($command)) {
    [Console]::Error.WriteLine("Blocked: hook found no command in its input")
    exit 2
}
if ($command.Length -gt $limit) {
    [Console]::Error.WriteLine("Blocked: command is $($command.Length) characters (limit $limit). Put longer logic in a script under scripts/ and show it to the user first.")
    exit 2
}
exit 0
