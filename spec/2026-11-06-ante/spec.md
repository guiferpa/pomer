---
title: Ante por nível
status: em-desenvolvimento
solicitada-em: 2026-11-06
substitui:
---

# Ante por nível

Adiciona o ante aos níveis das estruturas de blinds e o mostra onde os blinds aparecem. Era a próxima entrega citada em `spec/2026-11-06-estruturas-e-preferencias/spec.md`.

> Aprovação: o usuário autorizou explicitamente, em 2026-11-06, que o agente escrevesse esta spec e os tickets, os aprovasse, implementasse e fizesse o merge sem a presença dele, como exceção à regra do `AGENTS.md` que reserva `/to-spec`, `/to-tickets` e `/implement-spec` ao usuário.

## Problema

O organizador não consegue registrar o ante nos níveis da estrutura dele, e os jogadores não veem o ante no relógio.

## Solução

Cada nível ganha um campo "Ante" opcional. O ante aparece no relógio, no próximo nível, no histórico e na prévia do formulário, só quando o nível tem ante.

## Regras de negócio

1. Cada nível tem um ante opcional, chamado só de "Ante", sem escolher a forma de pagar.
2. Um ante vazio quer dizer que o nível não tem ante.
3. Quando preenchido, o ante é um inteiro positivo. Não há relação obrigatória com os blinds.
4. Um ante inválido mostra o erro no próprio campo ao salvar, e a estrutura não é salva.
5. "Adicionar nível" sugere o dobro do ante do nível anterior. Se o anterior não tem ante, o novo também vem sem.
6. No celular, os quatro campos de um nível ficam numa grade 2×2: small blind e big blind em cima, ante e duração embaixo. Em telas largas, ficam numa linha.
7. O ante aparece, só quando o nível tem ante, no relógio, no card de próximo nível, no histórico e na prévia do formulário de torneio.
8. Estruturas, torneios e históricos salvos sem ante abrem normalmente, como níveis sem ante.
9. Um torneio guarda o ante na cópia dos níveis, e um refresh mantém o ante na tela.

## Critérios de aceite

- [ ] Cada regra de negócio acima tem um teste passando, exceto a regra 6, conferida em largura de celular.
- [ ] O editor, a prévia e o relógio com ante foram conferidos em largura de celular, nos temas claro e escuro.
- [ ] Os textos existem em português, espanhol e inglês.
- [ ] `npm test` e `npm run build` passam.

## Histórias de usuário

1. Como organizador, quero registrar o ante de cada nível, para a estrutura refletir como a minha casa joga.
2. Como organizador, quero deixar o ante vazio nos primeiros níveis, para níveis sem ante continuarem simples.
3. Como organizador, quero que "adicionar nível" sugira o ante dobrado, para digitar pouco no celular.
4. Como organizador, quero ver o erro do ante no próprio campo, para corrigir antes de salvar.
5. Como organizador, quero os campos do nível confortáveis no celular, para digitar sem errar.
6. Como jogador, quero ver o ante no relógio, para saber quanto pagar no nível.
7. Como jogador, quero ver o ante do próximo nível, para me preparar.
8. Como organizador, quero o ante no histórico, para conferir o que já foi jogado.
9. Como organizador, quero o ante na prévia do formulário, para conferir a estrutura antes de iniciar.
10. Como organizador com estruturas criadas antes do ante, quero que elas continuem funcionando, para não recriar nada.

## Decisões de implementação

- **Nível:** ganha um campo de ante opcional. O formato salvo continua válido sem ele, e o módulo de persistência aceita o ante ausente ou um inteiro positivo; um ante presente e inválido torna o nível inválido, como os demais campos.
- **Rascunho do nível:** ganha o texto do ante, vazio por padrão.
- **Módulo de estruturas:** a sugestão de próximo nível e a validação passam a cuidar do ante.
- **Histórico:** cada entrada guarda o ante do nível jogado, quando houver.
- **Exibição:** o relógio, o próximo nível, o histórico e a prévia mostram o ante com o mesmo estilo dos blinds, em tamanho menor, e não mostram nada quando o nível não tem ante.

## Decisões de teste

Um bom teste verifica comportamento visível pela interface do módulo, sem conhecer os detalhes internos.

- **App:** cobre o editor (campo, sugestão e erro), a prévia, o relógio, o próximo nível, o histórico e o refresh com ante, com a técnica de `src/structures.test.tsx`.
- **Módulo de persistência:** testes diretos para níveis com ante, sem ante e com ante inválido, como `src/utils/persistence.test.ts`.

## Fora do escopo

- Escolher a forma de pagar o ante.
- Editar e excluir estruturas e o rascunho que sobrevive ao refresh (tickets 04 e 05 de `spec/2026-11-06-estruturas-e-preferencias/`).
- Novos eventos de analytics.

## Observações

- Para usar ante no torneio de 2026-11-07, o organizador cria uma estrutura nova, porque ainda não dá para editar uma estrutura salva.
