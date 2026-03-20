param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

node "C:\Users\hadi\.agent-comms\bin\agent-comms-cli.cjs" --project "shatter-realms" @Args
