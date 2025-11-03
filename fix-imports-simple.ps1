# Script semplice per correggere gli import paths

Write-Host "Correzione import paths..." -ForegroundColor Cyan

$frontendPath = "C:\Users\Giuseppe Mursia\Documents\GitHub\AGO_Explorer\ProtomForms\protomforms-frontend\src"

# Trova tutti i file TypeScript/TSX
$files = Get-ChildItem -Path $frontendPath -Recurse -Include "*.ts","*.tsx" -Exclude "*.d.ts"

Write-Host "Trovati $($files.Count) file..." -ForegroundColor Yellow

$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Sostituisci @/ con path relativi
    # Per semplicità, usiamo un approccio basato sulla posizione del file
    $relativePath = $file.DirectoryName.Replace($frontendPath, "")
    $depth = ($relativePath.Split("\") | Where-Object { $_ -ne "" }).Count
    
    if ($depth -eq 0) {
        # File nella root di src/
        $prefix = "./"
    } else {
        # File in sottodirectory
        $prefix = "../" * $depth
    }
    
    # Sostituzioni
    $content = $content -replace '@/lib/', ($prefix + 'lib/')
    $content = $content -replace '@/components/', ($prefix + 'components/')
    $content = $content -replace '@/hooks/', ($prefix + 'hooks/')
    $content = $content -replace '@/contexts/', ($prefix + 'contexts/')
    $content = $content -replace '@/types/', ($prefix + 'types/')
    $content = $content -replace '@/pages/', ($prefix + 'pages/')
    
    # Sostituisci import relativi senza ./
    $content = $content -replace "from\s+'(components/|hooks/|lib/|contexts/|types/|pages/)", "from '$prefix`$1"
    $content = $content -replace 'from\s+"(components/|hooks/|lib/|contexts/|types/|pages/)', "from ""$prefix`$1"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
        $count++
        Write-Host "✓ $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✅ Completato! File modificati: $count" -ForegroundColor Cyan





