# Script per creare i tarball di BE, FE e config per il deploy

Write-Host "Creazione tarball per il deploy..." -ForegroundColor Cyan

# Crea directory temporanea
$tempDir = ".\deploy-temp"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# 1. Backend tarball
Write-Host "Creazione tarball backend..." -ForegroundColor Yellow
$backendFiles = @(
    "protomforms-backend\src",
    "protomforms-backend\prisma",
    "protomforms-backend\Dockerfile",
    "protomforms-backend\next.config.js",
    "protomforms-backend\package.json",
    "protomforms-backend\package-lock.json",
    "protomforms-backend\tsconfig.json",
    "protomforms-backend\create-admin.js",
    "protomforms-backend\.gitignore"
)

$backendTar = "protomforms-backend.tar"
if (Test-Path $backendTar) {
    Remove-Item -Force $backendTar
}

# Crea directory backend nella temp
$backendTemp = Join-Path $tempDir "protomforms-backend"
New-Item -ItemType Directory -Path $backendTemp | Out-Null

# Copia file backend
foreach ($file in $backendFiles) {
    $dest = Join-Path $backendTemp (Split-Path $file -Leaf)
    if (Test-Path $file) {
        if ((Get-Item $file).PSIsContainer) {
            Copy-Item -Path $file -Destination $backendTemp -Recurse -Force
        } else {
            Copy-Item -Path $file -Destination $dest -Force
        }
    }
}

# Crea tarball usando tar (se disponibile)
if (Get-Command tar -ErrorAction SilentlyContinue) {
    tar -czf $backendTar -C $tempDir protomforms-backend
    Write-Host "Creato: $backendTar" -ForegroundColor Green
} else {
    Write-Host "Tar non disponibile, usa 7zip o WinRAR per creare l'archivio" -ForegroundColor Yellow
    Write-Host "Directory pronta: $backendTemp" -ForegroundColor Yellow
}

# 2. Frontend tarball
Write-Host "Creazione tarball frontend..." -ForegroundColor Yellow
$frontendFiles = @(
    "protomforms-frontend\src",
    "protomforms-frontend\public",
    "protomforms-frontend\Dockerfile",
    "protomforms-frontend\nginx.conf",
    "protomforms-frontend\package.json",
    "protomforms-frontend\package-lock.json",
    "protomforms-frontend\tsconfig.json",
    "protomforms-frontend\vite.config.ts",
    "protomforms-frontend\index.html",
    "protomforms-frontend\.gitignore",
    "protomforms-frontend\tailwind.config.js"
)

$frontendTar = "protomforms-frontend.tar"
if (Test-Path $frontendTar) {
    Remove-Item -Force $frontendTar
}

# Crea directory frontend nella temp
$frontendTemp = Join-Path $tempDir "protomforms-frontend"
New-Item -ItemType Directory -Path $frontendTemp | Out-Null

# Copia file frontend
foreach ($file in $frontendFiles) {
    $srcPath = $file
    $leaf = Split-Path $file -Leaf
    if (Test-Path $file) {
        if ((Get-Item $file).PSIsContainer) {
            Copy-Item -Path $srcPath -Destination (Join-Path $frontendTemp $leaf) -Recurse -Force
        } else {
            Copy-Item -Path $srcPath -Destination (Join-Path $frontendTemp $leaf) -Force
        }
    }
}

if (Get-Command tar -ErrorAction SilentlyContinue) {
    tar -czf $frontendTar -C $tempDir protomforms-frontend
    Write-Host "Creato: $frontendTar" -ForegroundColor Green
} else {
    Write-Host "Tar non disponibile" -ForegroundColor Yellow
    Write-Host "Directory pronta: $frontendTemp" -ForegroundColor Yellow
}

# 3. Config tarball
Write-Host "Creazione tarball configurazione..." -ForegroundColor Yellow
$configFiles = @(
    "docker-compose.production.yml",
    "nginx-pov-protom.conf",
    "env.production.protomforms",
    "deploy-production.sh",
    "setup-nginx.sh",
    "env.production.protomforms.example"
)

$configTar = "protomforms-config.tar"
if (Test-Path $configTar) {
    Remove-Item -Force $configTar
}

# Crea directory config nella temp
$configTemp = Join-Path $tempDir "protomforms-config"
New-Item -ItemType Directory -Path $configTemp | Out-Null

# Copia file config
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $configTemp -Force
    }
}

if (Get-Command tar -ErrorAction SilentlyContinue) {
    tar -czf $configTar -C $tempDir protomforms-config
    Write-Host "Creato: $configTar" -ForegroundColor Green
} else {
    Write-Host "Tar non disponibile" -ForegroundColor Yellow
    Write-Host "Directory pronta: $configTemp" -ForegroundColor Yellow
}

# Cleanup
Write-Host "Pulizia directory temporanea..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $tempDir

Write-Host "Creazione tarball completata!" -ForegroundColor Green
Write-Host "Tarball creati:" -ForegroundColor Cyan
Write-Host "  - $backendTar"
Write-Host "  - $frontendTar"
Write-Host "  - $configTar"
