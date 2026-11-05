# Pomer

Relógio de poker para torneios: conta os blinds e recomenda estruturas de blinds.

## Regras do produto

- **À prova de refresh** é a prioridade máxima: um refresh acidental devolve o torneio exatamente como estava (nível, intervalo, tempo restante, pausa, histórico e configuração).
- **Só client-side**: tudo é processado no navegador do usuário, em React, com o estado guardado no próprio dispositivo. Toda funcionalidade é resolvida sem backend e sem integração com APIs. A única exceção é o Google Analytics, usado para as métricas de uso (veja o README).
- **PWA**: o app pode ser instalado no dispositivo do usuário, e toda mudança preserva essa capacidade.
- **HeroUI v3 como base**: todo componente parte de um componente HeroUI. Sem equivalente direto, ele é composto a partir de componentes HeroUI.

## Fluxo de trabalho

Toda ideia ou funcionalidade passa por estes passos, nesta ordem. Upgrades técnicos de dependências seguem direto para a implementação. `/to-spec`, `/to-tickets`, `/implement-spec` e `/improve-codebase-architecture` só podem ser disparadas pelo usuário: nelas, peça que ele as execute.

1. **Estressar a ideia**: acione `/grilling`.
   Concluído quando o usuário confirma as decisões e nenhuma pergunta segue em aberto.

2. **Escrever a spec**: peça `/to-spec` e depois `/to-tickets`. A spec fica em `spec/AAAA-MM-DD-slug/spec.md`, com a data da solicitação, e os tickets em `spec/AAAA-MM-DD-slug/issues/NN-slug.md`. A spec começa por este header:

   ```yaml
   ---
   title: Nome da funcionalidade
   status: proposta # proposta | aprovada | em-desenvolvimento | concluida | descartada
   solicitada-em: AAAA-MM-DD
   substitui: # pasta da spec anterior, se houver
   ---
   ```

   Concluído quando a spec traz as regras de negócio e os critérios de aceite, cada ticket declara o que o bloqueia, e o usuário aprova (`status: aprovada`).

3. **Escolher a demanda**: leia todos os arquivos `spec/*/spec.md` antes de desenvolver.
   Concluído quando você consegue nomear a única spec a desenvolver e as specs que a afetam. Marque-a como `em-desenvolvimento`.

4. **Implementar**: peça `/implement-spec` com a spec escolhida. Os componentes são criados com `/stitch-react-components`, `/taste-design` e `/heroui-react`, e ligados às regras de negócio da spec.
   Concluído quando todos os tickets estão resolvidos e cada componente que a spec exige existe e parte do HeroUI.

5. **Revisar**: confirme que `/tdd` e `/code-review` rodaram durante a `/implement-spec` e peça `/improve-codebase-architecture`.
   Concluído quando todos os critérios de aceite têm teste passando, os achados da revisão foram tratados e o estado sobrevive a um refresh em cada situação que a funcionalidade cria. Marque a spec como `concluida`.

## Lacunas conhecidas

O projeto ainda diverge das regras acima. Remova cada item quando ele for resolvido.

- O PWA ainda não existe: faltam manifest e service worker.
