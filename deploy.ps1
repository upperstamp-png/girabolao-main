# deploy.ps1
# Automatiza deploy completo do projeto Girabolao
# Executar com: .\deploy.ps1 (em PowerShell como Administrador)

Write-Host "[INFO] Iniciando deploy completo do Girabolao..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Yellow

# 1. Verificar se o diretorio dist/ existe, senao, buildar
Write-Host "[BUILD] Verificando build do frontend..." -ForegroundColor Yellow
if (-Not (Test-Path "dist")) {
    Write-Host "[BUILD] Executando 'bun run build'..." -ForegroundColor Yellow
    bun run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] Falha no build do frontend!"
        exit 1
    }
} else {
    Write-Host "[BUILD] Build ja existe: dist/" -ForegroundColor Green
}

# 2. Gerar all-migrations.sql com todas as migracoes em ordem
Write-Host "[MIGRATION] Gerando all-migrations.sql..." -ForegroundColor Yellow
$migrations = Get-ChildItem "supabase/migrations/*.sql" | Sort-Object Name
if ($migrations.Count -eq 0) {
    Write-Error "[ERROR] Nenhuma migracao encontrada em supabase/migrations/"
    exit 1
}
$migrations | ForEach-Object {
    Write-Host "   [+] Incluindo $($_.Name)" -ForegroundColor DarkGray
}
Get-ChildItem "supabase/migrations/*.sql" | Sort-Object Name | ForEach-Object { Get-Content $_.FullName } | Set-Content "supabase/all-migrations.sql"
Write-Host "[MIGRATION] all-migrations.sql gerado com $($migrations.Count) migracoes" -ForegroundColor Green

# 3. Deploy no Vercel
Write-Host "[VERCEL] Deployando no Vercel..." -ForegroundColor Yellow
vercel --prod
if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Falha no deploy do Vercel!"
    exit 1
}

# 4. Deploy das funcoes Supabase
Write-Host "[SUPABASE] Deployando funcoes Supabase..." -ForegroundColor Yellow
supabase functions deploy
if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Falha no deploy das funcoes Supabase!"
    exit 1
}

# 5. Abrir site no navegador
Write-Host "[OPEN] Abrindo site no navegador..." -ForegroundColor Green
Start-Process "https://girabolao-main-80t4xcbpw-igor-s-projectsbolao.vercel.app"

# 6. Mensagem final
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "[SUCCESS] DEPLOY COMPLETO! SEU SISTEMA ESTA NO AR!" -ForegroundColor Green
Write-Host "   Site: https://girabolao-main-80t4xcbpw-igor-s-projectsbolao.vercel.app" -ForegroundColor Cyan
Write-Host "   Supabase: https://app.supabase.com/project/ahcpszcxmqqiofacjasz" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Yellow