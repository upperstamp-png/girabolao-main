Revise, corrija e implemente integralmente todas as funcionalidades do sistema de bolão, garantindo que tudo esteja funcionando corretamente em ambiente de produção. Antes de realizar qualquer alteração, analise toda a estrutura existente do projeto (frontend, backend, integrações e banco de dados) para identificar problemas, inconsistências e funcionalidades incompletas.

### 1. Responsividade Mobile
- Ajuste toda a interface utilizando abordagem mobile-first.
- Garanta que todas as telas do sistema funcionem perfeitamente em smartphones Android e iOS.
- Corrija problemas de layout, overflow horizontal, componentes quebrando a tela, tabelas não responsivas, formulários difíceis de utilizar e botões desalinhados.
- Certifique-se de que todas as funcionalidades estejam acessíveis e utilizáveis em dispositivos móveis.

### 2. Integração com a API
- Verifique por que o sistema não está consumindo corretamente os dados da API.
- Analise e corrija todo o fluxo de integração, incluindo:
  - URL base;
  - variáveis de ambiente;
  - autenticação;
  - headers;
  - chamadas assíncronas;
  - tratamento de erros;
  - timeout e tentativas de reconexão quando necessário;
  - transformação e mapeamento dos dados recebidos;
  - persistência dos dados no banco.
- Implemente logs detalhados para facilitar a identificação de falhas futuras.
- Valide que os dados retornados pela API estão sendo exibidos corretamente na interface.

### 3. Persistência automática dos dados do campeonato
Ao obter os dados da API, o sistema deve salvar automaticamente no banco de dados:

- todos os grupos;
- todas as seleções/equipes;
- todos os jogos;
- todas as rodadas;
- todo o chaveamento do mata-mata;
- todas as datas e horários das partidas;
- estádios e demais informações disponíveis na API;
- todos os relacionamentos necessários entre essas entidades.

Regras:
- O processo deve ser idempotente.
- Registros existentes devem ser atualizados quando houver alterações.
- Registros inexistentes devem ser criados.
- Dados duplicados nunca devem ser inseridos.
- A sincronização deve poder ser executada múltiplas vezes sem corromper os dados.

### 4. Cadastro automático dos participantes do bolão
Ao criar um novo bolão, o sistema deve cadastrar automaticamente os seguintes participantes:

1. Igor
2. Natan
3. Alison
4. Pedro
5. Zé
6. Paulo
7. Vitinho
8. Kelvin

Regras:
- Os participantes devem ser vinculados automaticamente ao bolão criado.
- Devem existir exatamente 8 participantes padrão.
- Não pode haver participantes duplicados dentro do mesmo bolão.
- Caso o participante já exista naquele bolão, não deve ser criado novamente.
- O processo deve ser idempotente.
- Caso um administrador remova manualmente um participante após a criação inicial do bolão, ele não deve ser recriado automaticamente.
- O sistema deve permitir que administradores adicionem novos participantes futuramente.

Cada participante deve possuir no mínimo:
- ID único;
- nome;
- referência ao bolão;
- posição no sorteio;
- data de criação.

### 5. Sorteio da ordem do bolão
Cada bolão deve possuir um sorteio para definir a ordem em que os participantes irão realizar seus palpites.

Regras:
- O sorteio deve considerar todos os participantes cadastrados naquele bolão.
- O sorteio deve ocorrer apenas uma vez.
- A ordem sorteada deve ser armazenada permanentemente no banco de dados.
- Todos os participantes devem conseguir visualizar a ordem definida.
- Não deve ser possível realizar um novo sorteio após sua confirmação.
- Apenas administradores autorizados poderão redefinir o sorteio, caso essa funcionalidade exista.
- A posição sorteada deve ficar associada ao participante.

### 6. Sistema de palpites
Implemente e valide todo o fluxo de criação e armazenamento dos palpites.

Regras:
- Cada participante deve conseguir registrar seus palpites para todas as partidas.
- Os palpites devem ficar vinculados ao participante, ao bolão e ao jogo correspondente.
- O sistema deve impedir alterações após o prazo definido para cada partida.
- Deve existir validação tanto no frontend quanto no backend.

### 7. Impedir resultados iguais
O sistema não deve permitir resultados idênticos entre participantes quando a regra do bolão exigir exclusividade.

Regras:
- Antes de salvar um palpite, verifique se já existe outro participante com o mesmo resultado para aquela partida.
- Caso a regra seja aplicada ao conjunto completo de palpites do bolão, valide toda a combinação antes da gravação.
- Se houver duplicidade, exiba uma mensagem clara ao usuário informando que aquele resultado já foi escolhido por outro participante.
- Impedir a persistência do dado duplicado.
- Implementar a validação tanto no frontend quanto no backend.
- Criar restrições adequadas no banco de dados sempre que possível para garantir integridade.

### 8. Banco de dados
Revise toda a modelagem e implemente as correções necessárias.

Garanta que existam relacionamentos adequados entre:
- bolões;
- participantes;
- grupos;
- seleções;
- jogos;
- chaveamentos;
- rodadas;
- palpites;
- resultados oficiais;
- ordem do sorteio.

Crie ou ajuste:
- migrations;
- índices;
- chaves estrangeiras;
- constraints de unicidade;
- políticas de integridade.

### 9. Interface administrativa
Implemente ou corrija funcionalidades administrativas para permitir:

- sincronizar dados da API manualmente;
- visualizar participantes do bolão;
- visualizar a ordem sorteada;
- acompanhar os palpites registrados;
- visualizar jogos e resultados;
- gerenciar bolões existentes.

### 10. Tratamento de erros e experiência do usuário
- Adicione estados de carregamento em todas as operações assíncronas.
- Exiba mensagens claras de sucesso e erro.
- Trate cenários de indisponibilidade da API.
- Evite travamentos e telas em branco.
- Garanta que a aplicação continue funcional mesmo após falhas temporárias.

### 11. Testes
Implemente testes para validar os principais fluxos do sistema.

Teste pelo menos:
- sincronização da API;
- criação automática dos participantes;
- prevenção de participantes duplicados;
- sorteio da ordem do bolão;
- persistência dos jogos;
- persistência dos grupos;
- persistência das seleções;
- persistência do chaveamento;
- criação de palpites;
- bloqueio de palpites duplicados;
- responsividade das principais telas.

### 12. Critérios obrigatórios para considerar a tarefa concluída
A implementação somente poderá ser considerada finalizada quando:

- a API estiver sendo consumida corretamente;
- todos os dados do campeonato estiverem sendo persistidos corretamente;
- grupos, seleções, jogos, rodadas e chaveamentos estiverem completos no banco;
- os 8 participantes padrão estiverem sendo criados automaticamente;
- não houver duplicidade de participantes;
- o sorteio da ordem estiver funcionando corretamente;
- os palpites estiverem sendo salvos corretamente;
- resultados duplicados forem bloqueados conforme as regras do bolão;
- a aplicação estiver totalmente responsiva em dispositivos móveis;
- todos os testes implementados estiverem passando sem erros;
- não existirem erros críticos no console do navegador ou nos logs do backend.

IMPORTANTE:
- Não gere apenas sugestões, exemplos ou pseudocódigo.
- Implemente efetivamente todas as correções necessárias nos arquivos existentes do projeto.
- Analise o código atual antes de realizar qualquer alteração.
- Preserve as funcionalidades já existentes que estejam funcionando corretamente.
- Atualize banco de dados, backend e frontend sempre que necessário para manter consistência entre todas as camadas da aplicação.
- Ao finalizar, apresente um relatório contendo:
  1. problemas identificados;
  2. correções realizadas;
  3. migrations criadas ou alteradas;
  4. arquivos modificados;
  5. testes executados;
  6. resultados dos testes;
  7. instruções para executar o sistema atualizado em ambiente de desenvolvimento e produção.