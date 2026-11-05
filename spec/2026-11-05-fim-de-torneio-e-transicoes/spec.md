---
title: Fim de torneio e transições de nível
status: em-desenvolvimento
solicitada-em: 2026-11-05
substitui:
---

# Fim de torneio e transições de nível

Corrige os bugs 1 a 4, 8 a 10 e 12 de `spec/2026-11-05-bugs-analise-inicial/spec.md` e configura o executor de testes. A implementação começa depois do merge do PR #1 (React 19 e HeroUI v3).

## Problema

O organizador não pode confiar no relógio em momentos críticos do torneio:

- Ao fim da estrutura, o último nível reinicia para sempre e duplica o histórico, ou o app volta ao formulário sem aviso e o torneio se perde. Com o intervalo padrão de 3 níveis, nenhuma estrutura termina corretamente.
- Ao pular um nível com o relógio pausado, o novo nível herda o tempo do anterior.
- Quando o app fica fechado ou o aparelho suspenso, o relógio deixa de acompanhar a mesa: avança um só nível e reinicia o tempo.
- O alerta falha: não toca no início natural de um intervalo, toca duas vezes ao pular e toca sem motivo em um refresh.

Além disso, o projeto não tem executor de testes, então nada impede que esses bugs voltem.

## Solução

O torneio passa a ter um fim definido. O último nível continua valendo até o organizador encerrar pelo reset, porque um torneio só termina quando sobra um jogador. Em `00:00`, o relógio para e os blinds se mantêm.

O relógio segue a hora real: ao voltar de uma ausência, o app abre exatamente onde o torneio estaria. Cada transição toca um alerta, e um refresh sem mudança não toca nenhum.

Os testes passam a rodar em cada PR e bloqueiam a publicação quando falham.

## Regras de negócio

### Último nível

1. Nunca há intervalo depois do último nível, mesmo quando o número dele é múltiplo do intervalo de break.
2. Quando o tempo do último nível acaba, o relógio fica em `00:00`, os blinds continuam valendo e a tela mostra "Tempo esgotado". O alerta toca uma vez.
3. Durante todo o último nível, o card de próximo nível mostra "Último nível" e o botão de pular fica desabilitado.
4. Em `00:00`, o botão de pausa também fica desabilitado. O reset continua disponível e a tela segue sem apagar.
5. O último nível não entra no histórico, que lista apenas níveis concluídos.
6. O card de intervalo informa que não há mais intervalos a partir do momento em que nenhum outro intervalo vai acontecer.
7. Os novos textos existem em português, espanhol e inglês.

### Tempo e ausência

8. Com o torneio rodando, o estado é calculado pela hora real. Ao voltar de uma ausência, o app avança por todos os níveis e intervalos que passaram e abre no ponto em que o torneio estaria.
9. Os níveis concluídos durante a ausência entram no histórico, com horários calculados a partir das durações.
10. Uma ausência maior que o restante do torneio termina no último nível em `00:00`.
11. Um torneio pausado continua parado, não importa quanto tempo passe.
12. Se o relógio do aparelho voltar para trás, o tempo restante fica limitado à duração do nível ou intervalo, como se nenhum tempo tivesse passado. Um salto para frente é tratado como ausência real.

### Pular nível

13. Pular com o relógio rodando dá o tempo cheio ao novo nível ou intervalo.
14. Pular com o relógio pausado mantém a pausa e dá o tempo cheio ao novo nível ou intervalo, que aparece na tela e vale ao retomar.
15. Pular segue as mesmas regras de um fim natural: entra em intervalo quando ele é devido e registra o nível no histórico.

### Alerta

16. Cada início de nível ou de intervalo toca exatamente um alerta, tanto por tempo quanto ao pular.
17. Um refresh sem mudança de nível ou intervalo não toca alerta.
18. Ao voltar de uma ausência com transições, o app tenta tocar um único alerta, não importa quantas tenham ocorrido. Se o navegador bloquear, fica em silêncio, sem aviso na tela.
19. Iniciar o torneio, pausar e retomar não tocam alerta.

### Torneios já salvos

20. Ao carregar um estado salvo, um intervalo depois do último nível vira o último nível em `00:00`.
21. Ao carregar um estado salvo, o histórico duplicado fica com uma entrada por nível.
22. O formato salvo no dispositivo não muda.
23. Ao carregar um estado salvo pausado, o tempo que vale ao retomar passa a ser o tempo mostrado na tela.

## Critérios de aceite

- [ ] Cada regra de negócio acima tem um teste passando.
- [ ] Em nenhuma das estruturas, com qualquer intervalo de break, o torneio volta ao formulário sem o reset.
- [ ] Refresh em cada situação devolve o torneio como estava, ou no ponto correto pela hora real: nível rodando, nível pausado, intervalo rodando, intervalo pausado, último nível e último nível em `00:00`.
- [ ] Os testes T1 a T5 e T7 a T11 passam sem a marcação de falha esperada.
- [ ] `npm test` existe e roda toda a suíte.
- [ ] Um teste falhando impede a publicação e aparece no PR antes do merge.
- [ ] A tela do último nível foi conferida em um navegador real, nos temas claro e escuro e em largura de celular.

## Histórias de usuário

1. Como organizador, quero que o último nível continue valendo depois que o tempo acabar, para que a mesa siga jogando até sobrar um jogador.
2. Como organizador, quero ver "Tempo esgotado" em `00:00`, para saber que o relógio parou de propósito.
3. Como organizador, quero saber que estou no último nível desde o início dele, para avisar os jogadores.
4. Como organizador, quero que o histórico não se repita, para confiar no que aconteceu no torneio.
5. Como organizador, quero nunca voltar ao formulário sem pedir, para não perder o torneio no meio do jogo.
6. Como organizador, quero que não haja intervalo depois do último nível, para não parar a mesa sem motivo.
7. Como organizador, quero saber quando não há mais intervalos, para não prometer aos jogadores uma pausa que não vai acontecer.
8. Como organizador, quero encerrar o torneio pelo reset, para decidir quando ele realmente acabou.
9. Como organizador, quero que a tela continue ligada em `00:00`, para os jogadores seguirem vendo os blinds.
10. Como organizador, quero que os botões sem efeito fiquem desabilitados, para não apertar algo que não faz nada.
11. Como organizador, quero que o novo nível tenha o tempo cheio quando pulo com o relógio pausado, para retomar com a contagem certa.
12. Como organizador, quero continuar pausado depois de pular, para decidir quando a mesa recomeça.
13. Como organizador, quero que um intervalo nunca mostre mais tempo do que a duração dele, para confiar na contagem.
14. Como organizador, quero que o relógio acompanhe a hora real quando fecho o notebook, para reabrir no ponto em que a mesa está.
15. Como organizador, quero ver no histórico os níveis que passaram durante a ausência, para entender o que aconteceu.
16. Como organizador, quero que um torneio pausado continue parado durante uma ausência, para que a pausa seja respeitada.
17. Como organizador, quero que um refresh acidental passe despercebido, para não atrapalhar a mesa.
18. Como organizador, quero que uma ausência longa pare no último nível, para o app não sair do torneio.
19. Como jogador, quero ouvir um alerta em cada início de nível, para saber que os blinds mudaram.
20. Como jogador, quero ouvir um alerta quando um intervalo começa, para saber que posso levantar da mesa.
21. Como jogador, quero ouvir um alerta só uma vez ao pular nível, para não achar que dois níveis passaram.
22. Como jogador, quero silêncio em um refresh, para não confundir com uma mudança de nível.
23. Como organizador, quero um único alerta ao voltar de uma ausência, para não ouvir uma sequência de sons.
24. Como organizador com um torneio já em andamento, quero que a atualização do app corrija o estado salvo, para não perder o torneio por um bug antigo.
25. Como organizador que usa outro idioma, quero os novos textos em português, espanhol ou inglês, para entender a tela.
26. Como mantenedor, quero as regras de transição em um só lugar, para corrigir uma regra sem procurá-la em vários trechos.
27. Como mantenedor, quero testes rodando em cada PR, para ver uma regressão antes do merge.
28. Como mantenedor, quero que um teste falhando bloqueie a publicação, para um torneio em produção não receber um relógio quebrado.
29. Como mantenedor, quero os bugs ainda abertos registrados como falhas esperadas, para que o próprio teste avise quando um deles for corrigido.

## Decisões de implementação

- **Módulo de transições:** um novo módulo puro concentra as regras. Recebe o estado do torneio e a hora atual, devolve o novo estado e informa se houve transição. O fim por tempo, o pulo de nível e a volta de uma ausência usam as mesmas regras, sem lógica duplicada.
- **`useTournament`:** só chama esse módulo, guarda o resultado e salva no dispositivo. O timer e o pulo deixam de calcular transições por conta própria.
- **Estado de tempo esgotado:** é derivado, sem campo novo: estar no último nível, fora de intervalo, com tempo restante zero. O torneio continua marcado como rodando, o que mantém a tela ligada e faz o refresh restaurar `00:00`.
- **Correção de estados antigos:** roda uma vez ao carregar o estado salvo, antes de o torneio aparecer na tela.
- **Alerta:** sai de um único lugar, a partir da transição informada pelo módulo. O botão de pular e o efeito que observa o número do nível deixam de tocar som. O alerta fica fora da atualização de estado, porque o React pode executá-la duas vezes em desenvolvimento.
- **Interface:** a tela do último nível usa os componentes HeroUI já presentes. Nenhum componente novo é necessário.
- **Executor de testes:** Vitest, Testing Library e jsdom, com o script `npm test`.
- **Publicação:** o workflow de deploy roda os testes antes do build. Um workflow novo roda testes e build em cada PR, sem publicar.
- **Documentação:** o README ganha `npm test`, e a lacuna do executor de testes sai do `AGENTS.md`.

## Decisões de teste

Um bom teste verifica comportamento visível, sem conhecer detalhes internos: dado um estado e uma hora, qual é o novo estado; dado um torneio salvo, o que o organizador vê e ouve.

- **Módulo de transições (ponto principal):** cobre as regras de tempo, último nível, pulo e ausência, com estados e horas explícitos, sem simular o passar dos segundos. Inclui estruturas e intervalos de break variados, incluindo o último nível como múltiplo do intervalo.
- **App (segundo ponto):** cobre só o que passa pela tela: alerta, botões, textos do último nível, refresh e correção de estados antigos. Usa a mesma técnica de `bugs.test.tsx`: estado semeado no `localStorage`, relógio simulado e `Audio` substituído.
- **Testes existentes:** `bugs.test.tsx` é a base e passa a fazer parte da suíte do projeto. Os controles C1 a C5 continuam passando.
- **T16 e T18:** são reescritos para o Select da v3. O T18 vira um teste normal, porque o bug 5 foi resolvido.
- **Falhas esperadas:** os testes de bugs abertos ficam marcados com `it.fails`: T16 (bug 6), T13 (bug 7), T15 (bug 11), T17 (bug 13), T6 (bug 14), T12 (bug 15) e T14 (bug 16).

## Fora do escopo

- Bugs 6, 7, 11 e 13 a 16 e os itens "não reproduzidos" da lista inicial.
- Tela de "Torneio encerrado", resumo do torneio e geração automática de níveis extras.
- Aviso na tela sobre o que passou durante uma ausência.
- PWA.
- Torneios salvos que já caíram no formulário: o estado deles não é recuperado.

## Observações

- A regra 6 vai além do último nível, porque hoje o card pode anunciar um intervalo que nunca acontece, como "próximo intervalo em 2 níveis" no penúltimo nível.
- A regra 19 mantém o comportamento atual de não tocar alerta no início do torneio.
- O som no iPhone segue sem verificação em aparelho real. O bloqueio do navegador da regra 18 é esperado e não é tratado como erro.
