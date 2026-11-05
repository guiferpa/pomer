Status: resolved
Blocked by: 03, 04

# 05: Relógio pela hora real depois de uma ausência

Spec: `spec/2026-11-05-fim-de-torneio-e-transicoes/spec.md` (regras 8 a 12 e 18; bug 12)

**O que construir:** quando o app fica fechado ou o aparelho suspenso, o organizador volta e encontra o torneio no ponto em que a mesa está. O app avança por todos os níveis e intervalos que passaram e registra os níveis concluídos no histórico.

- [x] Com o torneio rodando, o app abre no nível ou intervalo e no tempo restante corretos pela hora real.
- [x] O mesmo vale quando a aba volta de uma suspensão, sem recarregar a página.
- [x] Os níveis concluídos durante a ausência entram no histórico, com horários calculados a partir das durações.
- [x] Uma ausência maior que o restante do torneio termina no último nível em `00:00`.
- [x] Um torneio pausado continua parado, não importa quanto tempo passe.
- [x] Se o relógio do aparelho voltar para trás, o tempo restante fica limitado à duração do nível ou intervalo.
- [x] Voltar com transições tenta tocar um único alerta, não importa quantas tenham ocorrido, e fica em silêncio sem erro se o navegador bloquear.
- [x] As regras de tempo têm testes diretos no módulo de transições, com estados e horas explícitos.
- [x] O alerta único tem teste pelo App.
- [x] T5 passa sem `it.fails`.
- [x] Refresh foi verificado em cada situação: nível rodando, nível pausado, intervalo rodando, intervalo pausado, último nível e último nível em `00:00`.

Verificado por testes em jsdom, com relógio simulado e `Audio` substituído. A suspensão real do aparelho e o bloqueio real de áudio pelo navegador não foram exercitados em um navegador.
