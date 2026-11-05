Status: ready-for-agent
Blocked by: 01

# 02: Pular nível com o relógio pausado

Spec: `spec/2026-11-05-fim-de-torneio-e-transicoes/spec.md` (regras 13 a 15; bugs 1 e 2)

**O que construir:** ao pular com o relógio pausado, o organizador vê o tempo cheio do novo nível ou intervalo, e o torneio continua pausado até ser retomado. Pular com o relógio rodando continua funcionando.

**Módulo de transições:** nasce neste ticket. É um módulo puro que recebe o estado do torneio e a hora atual, devolve o novo estado e informa se houve transição. O fim por tempo e o pulo de nível passam a usar as mesmas regras, e `useTournament` só chama esse módulo. O comportamento do fim da estrutura só muda no ticket 03.

- [ ] Pular pausado mostra o tempo cheio do novo nível ou intervalo e mantém a pausa.
- [ ] Ao retomar, a contagem parte desse tempo cheio.
- [ ] Um intervalo nunca mostra mais tempo do que a duração dele.
- [ ] Pular com o relógio rodando dá o tempo cheio ao novo nível ou intervalo.
- [ ] Pular entra em intervalo quando ele é devido e registra o nível no histórico.
- [ ] O fim por tempo e o pulo não têm mais lógica de transição duplicada.
- [ ] As regras acima têm testes diretos no módulo de transições.
- [ ] T1 e T2 passam sem `it.fails`.
- [ ] Os controles C1 a C5 continuam passando.
- [ ] O formato salvo no dispositivo não mudou.
