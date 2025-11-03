# Script per correggere gli import paths in ProtomForms Frontend

Write-Host "Correzione import paths in ProtomForms Frontend..." -ForegroundColor Cyan

$frontendPath = "protomforms-frontend/src"

# Funzione per calcolare il path relativo corretto
function Get-RelativePath {
    param($file)
    
    $depth = ($file -replace [regex]::Escape($frontendPath), "" -split "\\").Count - 2
    if ($depth -le 0) { return "./" }
    return ("../" * $depth)
}

# Trova tutti i file TypeScript/TSX
$files = Get-ChildItem -Path $frontendPath -Recurse -Include "*.ts","*.tsx" | Where-Object { $_.DirectoryName -notmatch "node_modules" }

Write-Host "Trovati $($files.Count) file da processare..." -ForegroundColor Yellow

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $modified = $false
    
    # Calcola la profondità della directory
    $relativePath = Get-RelativePath $file.FullName
    
    # Pattern di sostituzione per @/ imports
    # @/lib/ -> ../lib/ or ./lib/
    # @/components/ -> ../components/ or ./components/
    # @/hooks/ -> ../hooks/ or ./hooks/
    # @/contexts/ -> ../contexts/ or ./contexts/
    # @/types/ -> ../types/ or ./types/
    
    $patterns = @(
        @{Old = '@/lib/'; New = "${relativePath}lib/"},
        @{Old = '@/components/'; New = "${relativePath}components/"},
        @{Old = '@/hooks/'; New = "${relativePath}hooks/"},
        @{Old = '@/contexts/'; New = "${relativePath}contexts/"},
        @{Old = '@/types/'; New = "${relativePath}types/"},
        @{Old = '@/pages/'; New = "${relativePath}pages/"}
    )
    
    foreach ($pattern in $patterns) {
        if ($content -match [regex]::Escape($pattern.Old)) {
            $content = $content -replace [regex]::Escape($pattern.Old), $pattern.New
            $modified = $true
        }
    }
    
    # Correggi import senza ./ all'inizio (solo per imports locali)
    # Ma solo se non iniziano già con . o /
    $content = $content -replace "from\s+'(components/|hooks/|lib/|contexts/|types/)", "from '${relativePath}`$1"
    $content = $content -replace 'from\s+"(components/|hooks/|lib/|contexts/|types/)', "from ""${relativePath}`$1"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✓ Corretto: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✅ Correzione completata!" -ForegroundColor Green
Write-Host "File processati: $($files.Count)" -ForegroundColor Cyan





