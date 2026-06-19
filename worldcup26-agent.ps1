$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMzQ3NmMxNWE5YjM0NGQyYmI1NjZjMCIsImlhdCI6MTc4MTgyMzIwOSwiZXhwIjoxNzg5MDgwODA5fQ.YPi4BW6IeGea6umPwD8zd2Gu8SSCXkYSSJZi3hlADo8"
$headers = @{"Authorization" = "Bearer $token"}

# Carregar seleções (cache)
$teams = Invoke-RestMethod -Uri "https://worldcup26.ir/get/teams" -Method Get -Headers $headers -ErrorAction Stop
$teamsMap = @{}
foreach ($team in $teams.teams) {
    $teamsMap[$team.id] = $team
}

Write-Host "✅ Agente FIFA 2026 - Foco em JOGOS AO VIVO" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Yellow

while ($true) {
    try {
        $games = Invoke-RestMethod -Uri "https://worldcup26.ir/get/games" -Method Get -Headers $headers -ErrorAction Stop

        # Limpar tela a cada atualização
        Clear-Host

        Write-Host "🕒 Atualizado em: $(Get-Date)" -ForegroundColor Cyan
        Write-Host ""

        $liveGames = $games.games | Where-Object { $_.finished -eq "FALSE" -and $_.time_elapsed -ne "notstarted" }

        if ($liveGames.Count -eq 0) {
            Write-Host "⏳ Nenhum jogo ao vivo no momento." -ForegroundColor Yellow
        }
        else {
            foreach ($game in $liveGames) {
            $homeTeam = $teamsMap[$game.home_team_id]
            $awayTeam = $teamsMap[$game.away_team_id]

                $time = $game.time_elapsed
                $scoreline = "$($homeTeam.name_en) $($game.home_score) x $($game.away_score) $($awayTeam.name_en) - $time'"

                Write-Host $scoreline -ForegroundColor Green
        }
    }

        Write-Host ""
        Write-Host "🔄 Próxima atualização em 5 segundos..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
    }
    catch {
        Clear-Host
        Write-Host "❌ Erro ao buscar partidas: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "🔄 Tentando novamente em 5 segundos..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
}
}
