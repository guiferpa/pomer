Status: ready-for-agent
Blocked by: None

# 02: Wake lock com interface mínima

Spec: `spec/2026-11-05-melhorias-de-arquitetura/spec.md` (regras 21 a 24; bugs 7 e 16)

**O que construir:** a tela fica ligada enquanto o torneio roda, sem pedidos repetidos, e o wake lock não fica ativo depois de uma pausa. Quem usa o módulo informa apenas se a tela deve ficar ligada.

- [ ] O wake lock é pedido uma vez enquanto a tela deve ficar ligada e não é liberado nem pedido de novo a cada segundo.
- [ ] Pausar com um pedido em andamento não deixa o wake lock ativo.
- [ ] O wake lock é pedido de novo quando a página volta a ficar visível com o torneio rodando.
- [ ] Saem os callbacks, os valores de retorno e os logs repetidos, e uma falha gera um único aviso interno.
- [ ] O fallback para navegadores sem a API mantém o comportamento atual.
- [ ] Em `00:00` no último nível, a tela continua ligada.
- [ ] T13 e T14 passam sem `it.fails`.
- [ ] O controle C4 foi atualizado para a nova interface, sem perder o que verifica.
