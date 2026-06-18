import { SupabaseClient } from 'npm:@supabase/supabase-js';
import { BetType, BetPayload, BetResponse } from './types.ts';

export async function validateAndSubmitBet<
  T extends BetType,
>(client: SupabaseClient, betType: T, payload: BetPayload<T>, userId: string): Promise<BetResponse> {
  try {
    // 1. Validar se o usuário está autenticado
    if (!userId) {
      return { success: false, message: 'Usuário não autenticado', error: 'UNAUTHORIZED' };
    }

    // 2. Validar tipo de aposta
    const validTypes: BetType[] = ['artilheiro', 'campeao', 'finalistas', 'goleada', 'zebra'];
    if (!validTypes.includes(betType)) {
      return { success: false, message: 'Tipo de aposta inválido', error: 'INVALID_BET_TYPE' };
    }

    // 3. Validar payload específico
    switch (betType) {
      case 'artilheiro':
        if (!payload || !('player_id' in payload) || !payload.player_id) {
          return { success: false, message: 'player_id é obrigatório', error: 'MISSING_PLAYER_ID' };
        }
        break;
      case 'campeao':
        if (!payload || !('team_id' in payload) || !payload.team_id) {
          return { success: false, message: 'team_id é obrigatório', error: 'MISSING_TEAM_ID' };
        }
        break;
      case 'finalistas':
        if (!payload || !('finalist_1' in payload) || !('finalist_2' in payload) || !payload.finalist_1 || !payload.finalist_2) {
          return { success: false, message: 'finalist_1 e finalist_2 são obrigatórios', error: 'MISSING_FINALISTS' };
        }
        break;
      case 'goleada':
        if (!payload || !('home_team_id' in payload) || !('away_team_id' in payload) || !('home_goals' in payload) || !('away_goals' in payload)) {
          return { success: false, message: 'home_team_id, away_team_id, home_goals e away_goals são obrigatórios', error: 'MISSING_GOLEADA_DATA' };
        }
        if (payload.home_team_id === payload.away_team_id) {
          return { success: false, message: 'Times da goleada devem ser diferentes', error: 'SAME_TEAMS' };
        }
        if (!Number.isInteger(payload.home_goals) || payload.home_goals < 0) {
          return { success: false, message: 'home_goals deve ser inteiro não negativo', error: 'INVALID_HOME_GOALS' };
        }
        if (!Number.isInteger(payload.away_goals) || payload.away_goals < 0) {
          return { success: false, message: 'away_goals deve ser inteiro não negativo', error: 'INVALID_AWAY_GOALS' };
        }
        break;
      case 'zebra':
        if (!payload || !('match_id' in payload) || !('underdog_id' in payload) || !payload.match_id || !payload.underdog_id) {
          return { success: false, message: 'match_id e underdog_id são obrigatórios', error: 'MISSING_ZEBRA_DATA' };
        }
        break;
    }

    // 4. Verificar se já existe aposta do usuário para esse tipo
    const { data: existingBet, error: checkError } = await client
      .from('apostas_especiais')
      .select('id')
      .eq('usuario_id', userId)
      .eq('tipo', betType)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      return { success: false, message: 'Erro ao verificar aposta existente', error: checkError.message };
    }

    // 5. Se já existe, atualizar (ou retornar erro, dependendo da regra de negócio)
    // Por enquanto, permitimos atualização — ajuste conforme necessário
    if (existingBet) {
      const { data: updateData, error: updateError } = await client
        .from('apostas_especiais')
        .update({
          ...payload,
          atualizada_em: new Date().toISOString(),
        })
        .eq('id', existingBet.id);

      if (updateError) {
        return { success: false, message: 'Erro ao atualizar aposta', error: updateError.message };
      }

      return { success: true, message: 'Aposta atualizada com sucesso', data: updateData };
    }

    // 6. Criar nova aposta
    const { data: insertData, error: insertError } = await client
      .from('apostas_especiais')
      .insert({
        usuario_id: userId,
        tipo: betType,
        ...payload,
        criada_em: new Date().toISOString(),
        atualizada_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, message: 'Erro ao criar aposta', error: insertError.message };
    }

    return { success: true, message: 'Aposta criada com sucesso', data: insertData };
  } catch (error: any) {
    return { success: false, message: 'Erro interno no servidor', error: error.message };
  }
}