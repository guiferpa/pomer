Status: ready-for-agent
Blocked by: 03, 04

# 05: Relógio pela hora real depois de uma ausência

Spec: `spec/2026-11-05-fim-de-torneio-e-transicoes/spec.md` (regras 8 a 12 e 18; bug 12)

**O que construir:** quando o app fica fechado ou o aparelho suspenso, o organizador volta e encontra o torneio no ponto em que a mesa está. O app avança por todos os níveis e intervalos que passaram e registra os níveis concluídos no histórico.

- [ ] Com o torneio rodando, o app abre no nível ou intervalo e no tempo restante corretos pela hora real.
- [ ] O mesmo vale quando a aba volta de uma suspensão, sem recarregar a página.
- [ ] Os níveis concluídos durante a ausência entram no histórico, com horários calculados a partir das durações.
- [ ] Uma ausência maior que o restante do torneio termina no último nível em `00:00`.
- [ ] Um torneio pausado continua parado, não importa quanto tempo passe.
- [ ] Se o relógio do aparelho voltar para trás, o tempo restante fica limitado à duração do nível ou intervalo.
- [ ] Voltar com transições tenta tocar um único alerta, não importa quantas tenham ocorrido, e fica em silêncio sem erro se o navegador bloquear.
- [ ] As regras de tempo têm testes diretos no módulo de transições, com estados e horas explícitos.
- [ ] O alerta único tem teste pelo App.
- [ ] T5 passa sem `it.fails`.
- [ ] Refresh foi verificado em cada situação: nível rodando, nível pausado, intervalo rodando, intervalo pausado, último nível e último nível em `00:00`.
