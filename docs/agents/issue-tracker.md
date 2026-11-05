# Issue tracker: pasta spec/

Specs e tickets deste repositório ficam em arquivos markdown dentro de `spec/`.

## Convenções

- Uma funcionalidade por pasta: `spec/AAAA-MM-DD-slug/`, com a data da solicitação
- A spec é `spec/AAAA-MM-DD-slug/spec.md` e começa pelo header definido no `AGENTS.md`
- Cada ticket é um arquivo próprio: `spec/AAAA-MM-DD-slug/issues/NN-slug.md`, numerado a partir de `01`
- Os comentários e o histórico da conversa vão no fim do arquivo, sob o título `## Comments`

## Estado

- **Spec:** fica no campo `status` do header. Toda spec publicada entra como `proposta`. O papel `ready-for-agent` corresponde a `aprovada`, e só o usuário aprova.
- **Ticket:** fica numa linha `Status:` no topo, com os valores de `triage-labels.md`. Um ticket concluído recebe `Status: resolved`.
- **Bloqueios:** ficam numa linha `Blocked by: NN, NN` no topo. Um ticket está desbloqueado quando todos os listados estão `resolved`.

## Quando uma skill disser "publish to the issue tracker"

Crie o arquivo dentro de `spec/AAAA-MM-DD-slug/`, criando a pasta se preciso.

## Quando uma skill disser "fetch the relevant ticket"

Leia o arquivo no caminho indicado. O usuário normalmente passa o caminho ou o número do ticket.

## Operações de wayfinding

Usadas pela `/wayfinder`. O **map** é um arquivo com um arquivo **child** por ticket.

- **Map:** `spec/AAAA-MM-DD-slug/map.md` (Notes, Decisions-so-far e Fog).
- **Child:** `spec/AAAA-MM-DD-slug/issues/NN-slug.md`, com a pergunta no corpo. Uma linha `Type:` guarda o tipo (`research`, `prototype`, `grilling` ou `task`), e `Status:` guarda `claimed` ou `resolved`.
- **Frontier:** tickets abertos, desbloqueados e não reivindicados; vence o de menor número.
- **Claim:** defina `Status: claimed` e salve antes de começar.
- **Resolve:** adicione a resposta sob `## Answer`, defina `Status: resolved` e acrescente um ponteiro (resumo e link) em Decisions-so-far no `map.md`.
