# E-bike Tucson — arranque con PostgreSQL (Docker) + migraciones + API + frontend
# Uso: en PowerShell, desde la raíz del repo:  .\scripts\iniciar-dev.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== E-bike Tucson ===" -ForegroundColor Cyan

# 1) Docker (PostgreSQL) — buscar docker.exe (PATH o instalación típica)
$dockerExe = $null
$cmd = Get-Command docker -ErrorAction SilentlyContinue
if ($cmd) { $dockerExe = $cmd.Source }
if (-not $dockerExe -and (Test-Path "C:\Program Files\Docker\Docker\resources\bin\docker.exe")) {
    $dockerExe = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
}
if (-not $dockerExe) {
    Write-Host "No se encontró docker.exe. Instala Docker Desktop y reinicia si hace falta." -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop/" -ForegroundColor Gray
    exit 1
}

Write-Host "Usando: $dockerExe" -ForegroundColor Gray
& $dockerExe ps 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "El motor de Docker no responde. Abre Docker Desktop y espera a 'Engine running'." -ForegroundColor Yellow
    $dd = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dd) {
        Write-Host "Iniciando Docker Desktop..." -ForegroundColor Green
        Start-Process $dd
    }
    Write-Host "Vuelve a ejecutar este script cuando Docker esté listo." -ForegroundColor Yellow
    exit 1
}

Write-Host "Levantando PostgreSQL..." -ForegroundColor Green
Push-Location $root
& $dockerExe compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "docker compose no disponible; usando docker run (postgres:16)..." -ForegroundColor Yellow
    & $dockerExe rm -f ebike-tucson-db 2>$null | Out-Null
    & $dockerExe run -d --name ebike-tucson-db -e POSTGRES_USER=ebike -e POSTGRES_PASSWORD=ebike_dev -e POSTGRES_DB=ebike_tucson -p 5433:5432 postgres:16-alpine
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Host "No se pudo crear el contenedor PostgreSQL." -ForegroundColor Red
        exit 1
    }
}
Pop-Location

$deadline = (Get-Date).AddSeconds(45)
do {
    Start-Sleep -Seconds 2
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $c.Connect("127.0.0.1", 5433)
        $c.Close()
        break
    } catch {
        if ((Get-Date) -gt $deadline) {
            Write-Host "No se pudo conectar al puerto 5433 (PostgreSQL en Docker). Revisa Docker Desktop (motor en ejecución)." -ForegroundColor Red
            exit 1
        }
    }
} while ($true)

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "No se encontró 'python' en PATH. Instala Python 3.11+ y marca 'Add to PATH'." -ForegroundColor Red
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "No se encontró 'npm' en PATH. Instala Node.js 20+ (incluye npm)." -ForegroundColor Red
    exit 1
}

# 2) Backend
$backend = Join-Path $root "backend"
if (-not (Test-Path (Join-Path $backend ".env"))) {
    Copy-Item (Join-Path $backend ".env.example") (Join-Path $backend ".env")
    Write-Host "Creado backend\.env desde .env.example" -ForegroundColor Green
}

Set-Location $backend
if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
    python -m venv .venv
}
& .\.venv\Scripts\Activate.ps1
pip install -q -e ".[dev]"
alembic upgrade head
python -m scripts.seed

Write-Host "Iniciando API en http://127.0.0.1:8000 (nueva ventana)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backend'; .\.venv\Scripts\Activate.ps1; uvicorn app.main:application --reload --host 127.0.0.1 --port 8000"

# 3) Frontend
$frontend = Join-Path $root "frontend"
if (-not (Test-Path (Join-Path $frontend ".env"))) {
    Copy-Item (Join-Path $frontend ".env.example") (Join-Path $frontend ".env")
    Write-Host "Creado frontend\.env desde .env.example" -ForegroundColor Green
}
Set-Location $frontend
if (-not (Test-Path ".\node_modules")) {
    npm install
}
Write-Host "Iniciando frontend en http://localhost:5173 (nueva ventana)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontend'; npm run dev"

Set-Location $root
Write-Host "`nListo. Abre el navegador en: http://localhost:5173" -ForegroundColor Cyan
Write-Host "API docs: http://127.0.0.1:8000/docs" -ForegroundColor Gray
