# PowerShell script to add Quotas link to all admin panel pages

$pages = @(
    "admin-panel.html",
    "admins-list.html",
    "tickets.html",
    "ticket-view.html",
    "my-tickets.html",
    "discord-search.html"
)

$searchPattern = @'
            <a href="ban-goals.html" class="sidebar-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Цели банов
            </a>
            
            <a href="discord-search.html" class="sidebar-item">
'@

$replacement = @'
            <a href="ban-goals.html" class="sidebar-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Цели банов
            </a>
            
            <a href="quotas.html" class="sidebar-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                Нормы наказаний
            </a>
            
            <a href="discord-search.html" class="sidebar-item">
'@

foreach ($page in $pages) {
    $filePath = Join-Path $PSScriptRoot $page
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        $newContent = $content -replace [regex]::Escape($searchPattern), $replacement
        Set-Content $filePath -Value $newContent -NoNewline
        Write-Host "Updated: $page"
    }
}

Write-Host "Done!"
