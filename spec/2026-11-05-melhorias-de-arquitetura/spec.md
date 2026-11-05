---
title: Melhorias de arquitetura e bugs restantes
status: aprovada
solicitada-em: 2026-11-05
substitui:
---

# Melhorias de arquitetura e bugs restantes

Aprofunda os módulos com mais atrito na revisão de arquitetura e corrige os bugs 6, 7, 11 e 13 a 16 de `spec/2026-11-05-bugs-analise-inicial/spec.md`.

## Problema

O organizador ainda encontra falhas fora do relógio:

- Um torneio salvo inválido lança erro a cada carregamento, em vez de abrir o app.
- O Turbo promete níveis de 10 min, mas usa a duração do formulário.
- A estrutura e a cor salvas se perdem ao voltar ao formulário.
- Apagar um campo numérico devolve o valor padrão na hora, então não dá para digitar outro número com calma.
- Os blinds saltam 3,25x do nível 20 para o 21 na estrutura Grande.
- O wake lock é liberado e pedido de novo a cada segundo, e pode ficar ativo depois de uma pausa.
- As visualizações de página do Google Analytics estão infladas.

Quem mantém o projeto também encontra atrito:

- A leitura e a gravação do torneio estão espalhadas.
- A pausa e a retomada são as únicas mudanças de estado fora do módulo de transições.
- A regra das estruturas mora dentro do formulário.
- `useWakeLock` e `useAnalytics` têm interfaces maiores do que o uso.
- Sete testes seguem marcados como falha esperada.

## Solução

O app sempre abre: um torneio salvo inválido vira o formulário com um aviso curto. O formulário volta como foi deixado, cada estrutura traz a própria duração, e os campos numéricos aceitam edição livre, com a validação no início do torneio.

Por dentro, cada conceito passa a ter um único módulo, testado pela própria interface. Ao final, nenhum teste fica marcado como falha esperada, a lista de bugs é fechada e o código morto sai.

## Regras de negócio

### Persistência

1. Um único módulo cuida do torneio salvo e da última configuração, nas chaves `pomer-tournament-state` e `pomer-config`. O tema e o idioma continuam onde estão.
2. Um torneio salvo é inválido quando tem JSON quebrado, não tem `config`, não tem níveis com dados utilizáveis, ou tem nível atual ou tempo que não são números.
3. Um torneio inválido é descartado, e o app abre o formulário com um aviso curto de que não foi possível recuperar o torneio salvo. O aviso existe em português, espanhol e inglês.
4. A chave vazia e o estado em branco deixado por resets antigos (`blindStructure` vazio) abrem o formulário sem aviso.
5. Uma última configuração inválida é ignorada sem aviso, e o formulário usa os valores padrão.
6. Depois de um reset, a chave do torneio fica vazia, e a última configuração continua guardada para preencher o formulário.
7. Depois de um torneio inválido ser descartado, um novo refresh abre o formulário sem aviso, porque não há mais nada salvo.

### Pausa e retomada

8. Pausar e retomar passam a ser regras do módulo de transições, recebendo o estado e a hora atual.
9. O campo `pausedTimeRemaining` deixa de existir. Retomar conta a partir do tempo mostrado na tela.
10. Um torneio salvo com esse campo abre normalmente e retoma do tempo mostrado na tela. O campo é ignorado e some na gravação seguinte.
11. Em `00:00` no último nível, pausar continua sem efeito.

### Estruturas de blinds

12. Escolher uma estrutura preenche a duração do nível com a duração dela: 10 min no Turbo, 20 min nas demais. Trocar de estrutura sobrescreve o que estava digitado.
13. O organizador pode alterar a duração depois de escolher a estrutura, e o valor digitado é o que vale no torneio.
14. A última configuração guarda o nome da estrutura. Ao voltar ao formulário, a estrutura, a duração e a cor aparecem como foram deixadas, sem que a duração salva seja sobrescrita.
15. Em uma configuração antiga, sem o nome, ele é deduzido da quantidade de níveis e do primeiro blind. Sem correspondência, vale Médio.
16. Na estrutura Grande, os níveis 21 a 25 usam 1536x, 2048x, 3072x, 4096x e 6144x do blind inicial, e nenhum salto entre níveis passa de 2x.
17. Um torneio já iniciado mantém os níveis que guardou.

### Campos numéricos

18. Um campo numérico pode ficar vazio enquanto se digita, sem voltar ao valor padrão.
19. Os limites são: duração do nível de 1 a 60, intervalo de 1 a 10 e duração do intervalo de 1 a 30.
20. Ao iniciar, um valor vazio ou fora dos limites mostra o erro no próprio campo, e o torneio não começa.

### Wake lock

21. O wake lock é pedido uma vez enquanto a tela deve ficar ligada e não é liberado nem pedido de novo a cada segundo.
22. Pausar com um pedido em andamento não deixa o wake lock ativo.
23. Quem usa o módulo informa apenas se a tela deve ficar ligada. Saem os callbacks, os valores de retorno e os logs repetidos, e uma falha gera um único aviso interno.
24. O fallback para navegadores sem a API mantém o comportamento atual.

### Analytics

25. O envio de eventos não depende de montar um componente. O `index.html` é o único que registra a visualização de página.
26. Só os 5 eventos que o app envia continuam definidos: `tournament_started`, `tournament_paused`, `tournament_resumed`, `level_skipped` e `tournament_reset`.
27. O README explica que a queda nas visualizações de página a partir da data do deploy é correção de contagem, não perda de uso.

### Fechamento

28. Nenhum teste fica marcado com `it.fails`.
29. A lista de bugs passa a `concluida`. O som no iPhone e o fallback do wake lock passam para "Lacunas conhecidas" no `AGENTS.md`.
30. A limpeza final não muda comportamento.

## Critérios de aceite

- [ ] Cada regra de negócio acima tem um teste passando, exceto as regras 24, 27, 29 e 30, conferidas na revisão.
- [ ] Os estados `{}`, array, JSON quebrado e objeto incompleto abrem o formulário com o aviso, e o refresh seguinte abre sem aviso.
- [ ] Um torneio válido, rodando ou pausado, sobrevive a um refresh como na spec anterior.
- [ ] Um torneio pausado salvo pela versão anterior retoma do tempo mostrado na tela.
- [ ] T6 e T12 a T17 passam sem `it.fails`.
- [ ] O formulário, o aviso e os erros de campo foram conferidos em um navegador real, nos temas claro e escuro e em largura de celular.
- [ ] `npm test` e `npm run build` passam, sem casts `as any` nas chaves de tradução.

## Histórias de usuário

1. Como organizador, quero que o app abra mesmo com dados salvos danificados, para não ficar sem relógio no meio de um evento.
2. Como organizador, quero saber quando um torneio salvo não pôde ser recuperado, para não achar que perdi o torneio por engano meu.
3. Como organizador, quero não ver esse aviso ao abrir o app normalmente, para não me preocupar sem motivo.
4. Como organizador, quero que o aviso apareça uma vez só, para ele não se repetir a cada refresh.
5. Como organizador, quero que o formulário volte preenchido depois de um reset, para repetir o torneio sem digitar tudo.
6. Como organizador, quero que a estrutura escolhida volte ao abrir o formulário, para não trocar sem perceber.
7. Como organizador, quero que a cor escolhida volte ao abrir o formulário, para manter a identidade do meu torneio.
8. Como organizador, quero que a duração salva volte como deixei, para não perder um ajuste que fiz.
9. Como organizador, quero que o Turbo sugira níveis de 10 min, para que ele cumpra o que promete.
10. Como organizador, quero poder mudar essa duração, para adaptar o torneio à minha mesa.
11. Como organizador, quero que trocar de estrutura atualize a duração, para partir do valor próprio de cada estrutura.
12. Como organizador com uma configuração antiga, quero que a estrutura seja reconhecida, para não precisar escolher de novo.
13. Como organizador, quero apagar um campo numérico e digitar outro valor, para editar sem brigar com o formulário.
14. Como organizador, quero ver no campo o que está errado, para corrigir antes de iniciar.
15. Como organizador, quero que um valor inválido não inicie o torneio, para não começar com números que eu não escolhi.
16. Como jogador em um torneio Grande, quero uma subida de blinds sem saltos bruscos, para o jogo continuar equilibrado.
17. Como organizador com um torneio em andamento, quero que os blinds dele não mudem, para a atualização do app não alterar o jogo.
18. Como organizador, quero que a tela continue ligada sem pedidos repetidos, para ela não correr o risco de apagar entre um pedido e outro.
19. Como organizador, quero que a pausa libere o wake lock, para a tela poder apagar quando o torneio estiver parado.
20. Como organizador em um aparelho antigo, quero que o fallback continue como está, para não perder o que já funciona lá.
21. Como dono do projeto, quero visualizações de página corretas, para confiar nas métricas.
22. Como dono do projeto, quero saber a data da mudança na contagem, para não confundir a queda com perda de uso.
23. Como organizador com um torneio pausado, quero retomar do tempo que vejo na tela, para não perder nem ganhar tempo.
24. Como mantenedor, quero um único lugar para ler e gravar o torneio, para corrigir uma falha de persistência uma vez só.
25. Como mantenedor, quero todas as mudanças de estado no módulo de transições, para testar pausa e retomada com estado e hora.
26. Como mantenedor, quero uma só cópia do tempo restante, para não haver dois valores a manter iguais.
27. Como mantenedor, quero as estruturas fora do formulário, para testar as regras sem renderizar a tela.
28. Como mantenedor, quero que `useWakeLock` só receba "tela ligada", para callbacks de quem usa não causarem novos pedidos.
29. Como mantenedor, quero enviar eventos sem montar um hook, para o envio não ter efeito ao montar.
30. Como mantenedor, quero remover o código morto, para não ler nem manter o que ninguém usa.
31. Como mantenedor, quero as chaves de tradução verificadas pelo TypeScript, para um texto ausente aparecer no build.
32. Como mantenedor, quero os itens ainda sem verificação nas lacunas conhecidas, para eles não se perderem em uma spec fechada.

## Decisões de implementação

- **Módulo de persistência:** novo módulo deep, responsável por chaves, conversão de datas, validação e correção. Na leitura, informa ao chamador se há torneio, se não há nada salvo ou se o torneio salvo era inválido. A correção de estados antigos passa a rodar dentro dele. `useLocalStorage` sai, porque tem um único chamador.
- **`useTournament`:** só carrega pelo módulo de persistência, chama o módulo de transições, grava o resultado e toca o alerta. A lógica de pausa, retomada e reset que calcula tempo sai dele.
- **Módulo de transições:** ganha pausa e retomada. A regra de `00:00` deixa de ser verificada no hook.
- **Formato salvo:** `pausedTimeRemaining` sai do torneio, e o nome da estrutura entra na configuração. Esta spec é a exceção à regra 22 da spec anterior, que se aplicava àquela entrega.
- **Módulo de estruturas:** novo módulo deep, que transforma uma estrutura nomeada em níveis e deduz o nome em configurações antigas. A progressão de blinds fica nele. O formulário guarda o texto digitado separado da configuração e só monta a configuração ao iniciar.
- **Aviso de torneio inválido:** aparece no topo do formulário, com um componente HeroUI já disponível no projeto, e não é gravado.
- **Erros de campo:** usam a validação dos campos HeroUI do próprio formulário.
- **`useWakeLock`:** recebe apenas se a tela deve ficar ligada e não devolve nada. Depois de cada pedido assíncrono, confere se a tela ainda deve ficar ligada e libera o wake lock se não precisar.
- **Analytics:** `useAnalytics` vira uma função simples de envio, com uma lista única de eventos.
- **Limpeza final:** remove os casts `as any` das traduções, `getBreakInfo`, `BreakInfo`, `defaultConfig`, o tipo `WakeLock` sem uso, ícones e textos sem uso, as props `isRunning` e `history` do `Countdown`, o argumento ignorado de `playSound` e a cópia de `darkenColor`.

## Decisões de teste

Um bom teste verifica comportamento visível pela interface do módulo, sem conhecer os detalhes internos.

- **App:** cobre o formulário, o aviso, os erros de campo, o refresh e o analytics, com a técnica de `src/bugs.test.tsx`: estado semeado no `localStorage`, relógio simulado e `Audio` substituído.
- **Módulo de transições:** cobre pausa e retomada com estados e horas explícitos, como `src/utils/transitions.test.ts`.
- **Módulo de persistência:** teste direto, com todos os formatos válidos e inválidos e a correção de estados antigos, sobre o `localStorage` do jsdom.
- **Módulo de estruturas:** teste direto das quatro estruturas, da dedução de nomes e dos saltos de blinds, sem renderizar a tela.
- **`useWakeLock`:** continua testado pelo próprio hook, como T13, T14 e C4, com `navigator.wakeLock` substituído.
- **Testes existentes:** T6 e T12 a T17 perdem `it.fails`. Testes que dependem de `pausedTimeRemaining` ou da interface antiga são atualizados, sem perder o comportamento que verificam.

## Fora do escopo

- PWA, que é a próxima demanda.
- Remover ou trocar o fallback do wake lock.
- Verificar o som no iPhone.
- Tipo de "fase" para o torneio e divisão adicional de `useTournament`.
- Compartilhar passos entre os workflows.
- Novos eventos de analytics, ou limitar o rastreamento à produção.
- Estruturas personalizadas.
- Tela própria para recuperar um torneio inválido.

## Observações

- Reverter o site para uma versão anterior faz um torneio pausado na versão nova retomar com o tempo errado, porque essa versão ainda lê `pausedTimeRemaining`. O risco foi aceito.
- O teste de exclusão justifica os dois módulos novos: sem eles, a complexidade volta a se espalhar pelo hook e pelo formulário. `useLocalStorage` e `useAnalytics` não passam nesse teste, porque removê-los não espalha complexidade.
- A ordem de implementação é: persistência, wake lock e analytics em paralelo; depois pausa e estruturas em paralelo; por último, a limpeza e o fechamento.
- A data do deploy para o README só é conhecida no merge, então o texto pode ser ajustado nesse momento.
