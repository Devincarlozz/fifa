# extract_authcontext.ps1
$logPath = "C:\Users\vtckt\.gemini\antigravity\brain\9ed26b75-2f58-4576-9748-2ad4fff6ab62\.system_generated\logs\overview.txt"
$lines = Get-Content -Path $logPath

foreach ($line in $lines) {
    if ($line -match '"type":"PLANNER_RESPONSE"') {
        $data = ConvertFrom-Json $line -ErrorAction SilentlyContinue
        if ($data -and $data.tool_calls) {
            foreach ($call in $data.tool_calls) {
                if ($call.args.TargetFile -like "*AuthContext.jsx*") {
                    Write-Host "========================================="
                    Write-Host "StepIndex: $($data.step_index)"
                    Write-Host "Action: $($call.name)"
                    Write-Host "StartLine: $($call.args.StartLine) | EndLine: $($call.args.EndLine)"
                    if ($call.args.TargetContent) {
                        Write-Host "--- TargetContent ---"
                        Write-Host $call.args.TargetContent
                    }
                    if ($call.args.ReplacementContent) {
                        Write-Host "--- ReplacementContent ---"
                        Write-Host $call.args.ReplacementContent
                    }
                }
            }
        }
    }
}
