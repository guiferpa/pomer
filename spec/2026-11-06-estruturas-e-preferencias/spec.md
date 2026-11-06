---
title: Estruturas de blinds próprias e preferências do aplicativo
status: proposta
solicitada-em: 2026-11-06
substitui:
---

# Estruturas de blinds próprias e preferências do aplicativo

Melhora o uso no celular: as preferências do aplicativo saem do formulário de torneio, e as estruturas de blinds passam a ser criadas pelo organizador em uma tela própria. Há um torneio usando o sistema em 2026-11-07.

## Problema

No celular, o organizador encontra um formulário de torneio longo e misturado:

- O tema aparece no formulário de torneio, embora seja uma preferência do aparelho, e também no menu de configurações.
- Só existem quatro estruturas de blinds prontas, geradas por fórmula. O organizador não consegue usar a estrutura da casa dele.
- A duração do nível é um campo do torneio, então todos os níveis têm a mesma duração.

## Solução

As preferências do aplicativo (tema, idioma e som) ficam só no menu de configurações. O formulário de torneio fica com o que vale para o torneio.

Uma tela própria de estruturas de blinds permite criar, do zero, estruturas com nome e níveis, cada nível com small blind, big blind e duração. Ao iniciar o torneio, o organizador escolhe uma das estruturas dele. Tudo fica guardado no aparelho e sobrevive a um refresh, inclusive uma estrutura em edição.

## Regras de negócio

### Preferências do aplicativo

1. Tema, idioma e som ficam só no menu de configurações, acessível do formulário de torneio, do relógio e da tela de estruturas.
2. O formulário de torneio não tem mais o campo de tema.
3. A cor continua na configuração do torneio.

### Estrutura de blinds

4. Uma estrutura de blinds tem nome e uma lista de níveis. Cada nível tem small blind, big blind e duração em minutos.
5. As quatro estruturas prontas (Pequeno, Médio, Grande e Turbo) deixam de existir. Toda estrutura é criada pelo organizador.
6. O nome é obrigatório e não pode repetir o de outra estrutura salva.
7. Uma estrutura tem pelo menos 1 nível.
8. Small blind, big blind e duração são inteiros positivos, o big blind é maior ou igual ao small blind, e a duração vai de 1 a 60.
9. A ordem crescente dos blinds entre níveis não é exigida.
10. Um valor inválido mostra o erro no próprio campo ao salvar, e a estrutura não é salva.

### Tela de estruturas

11. A tela de estruturas tem endereço próprio. Um refresh nela continua nela.
12. A lista mostra as estruturas salvas, da editada mais recentemente para a mais antiga.
13. Criar começa do zero: o organizador dá o nome e preenche o 1º nível.
14. "Adicionar nível" acrescenta um nível sugerido com o dobro do small blind e do big blind e a mesma duração do nível anterior. Tudo continua editável.
15. Qualquer nível pode ser removido, desde que reste pelo menos 1.
16. Uma estrutura salva pode ser editada e excluída. Excluir pede confirmação.
17. Editar ou excluir uma estrutura não altera um torneio em andamento, que guarda a própria cópia dos níveis.
18. Existe um único rascunho por vez. Uma estrutura em edição sobrevive a um refresh, com o que já foi digitado.
19. Voltar com mudanças não salvas pede confirmação para descartá-las. Salvar ou descartar apaga o rascunho.
20. Uma estrutura guardada que esteja inválida é ignorada sem aviso, e as demais aparecem normalmente. Um rascunho inválido é descartado sem aviso.

### Formulário de torneio

21. O formulário tem nome do torneio, estrutura, intervalo a cada N níveis, duração do intervalo e cor. O campo de duração do nível sai.
22. A escolha de estrutura lista as estruturas salvas, na mesma ordem da tela de estruturas, e tem ao lado o link "Gerenciar estruturas".
23. Ao escolher uma estrutura, o formulário mostra a prévia dos níveis dela.
24. Sem nenhuma estrutura salva, o formulário mostra um convite para criar a primeira, e o torneio não começa.
25. Ao iniciar, o torneio guarda uma cópia dos níveis da estrutura escolhida.
26. A última configuração guarda qual estrutura foi escolhida. Ao voltar ao formulário, ela aparece escolhida; se foi excluída, o formulário abre sem estrutura escolhida.
27. A validação dos campos numéricos do torneio continua como antes: intervalo de 1 a 10 e duração do intervalo de 1 a 30, com o erro no próprio campo.

### Compatibilidade

28. Um torneio em andamento, salvo pela versão anterior, abre e segue com os níveis que guardou.
29. Uma última configuração salva pela versão anterior volta preenchida, mas sem estrutura escolhida.

## Critérios de aceite

- [ ] Cada regra de negócio acima tem um teste passando, exceto as regras 1 e 3, conferidas na revisão.
- [ ] Uma estrutura criada, editada ou excluída sobrevive a um refresh como foi deixada.
- [ ] Um rascunho com dados digitados sobrevive a um refresh na tela de estruturas.
- [ ] Um torneio iniciado com uma estrutura própria roda, pausa, pula e sobrevive a refresh como na spec anterior, com a duração de cada nível.
- [ ] Um torneio salvo pela versão anterior abre sem mudança.
- [ ] A tela de estruturas, o formulário de torneio e o menu de configurações foram conferidos em um celular real ou em largura de celular, nos temas claro e escuro.
- [ ] `npm test` e `npm run build` passam.

## Histórias de usuário

1. Como organizador, quero mudar o tema pelo menu de configurações, para não procurar essa opção no formulário de torneio.
2. Como organizador, quero mudar o idioma e o som no mesmo menu do tema, para achar todas as preferências do aparelho num lugar só.
3. Como organizador, quero um formulário de torneio só com o que vale para o torneio, para preenchê-lo rápido no celular.
4. Como organizador, quero abrir o menu de configurações de qualquer tela, para ajustar o som ou o tema com o torneio rodando.
5. Como organizador, quero manter a cor do torneio no formulário de torneio, para cada torneio ter a sua identidade.
6. Como organizador, quero uma tela só para estruturas de blinds, para montar a estrutura da minha casa com calma.
7. Como organizador, quero criar uma estrutura do zero, para usar exatamente os blinds que eu jogo.
8. Como organizador, quero dar um nome à estrutura, para reconhecê-la na hora de iniciar o torneio.
9. Como organizador, quero definir a duração de cada nível, para ter níveis mais curtos ou mais longos em fases diferentes.
10. Como organizador, quero que "adicionar nível" sugira o próximo nível, para digitar pouco no celular.
11. Como organizador, quero editar qualquer valor sugerido, para ajustar a sugestão à minha estrutura.
12. Como organizador, quero remover um nível, para corrigir um nível adicionado por engano.
13. Como organizador, quero ver o erro no próprio campo ao salvar, para corrigir antes de perder tempo.
14. Como organizador, quero ser impedido de salvar dois nomes iguais, para não confundir estruturas na escolha.
15. Como organizador, quero que uma estrutura em edição sobreviva a um refresh, para não perder o que digitei.
16. Como organizador, quero uma confirmação ao voltar com mudanças não salvas, para não descartá-las sem querer.
17. Como organizador, quero editar uma estrutura salva, para corrigir um blind depois.
18. Como organizador, quero excluir uma estrutura que não uso, com confirmação, para manter a lista curta sem apagar por engano.
19. Como organizador, quero ver a estrutura mais recente no topo da lista, para achar logo a que acabei de criar.
20. Como organizador, quero que um refresh na tela de estruturas continue nela, para não voltar ao início no meio do trabalho.
21. Como organizador, quero escolher uma das minhas estruturas ao iniciar o torneio, para usar a estrutura certa.
22. Como organizador, quero ver a prévia dos níveis da estrutura escolhida, para conferir antes de iniciar.
23. Como organizador, quero um link para gerenciar estruturas ao lado da escolha, para criar uma estrutura sem sair procurando.
24. Como organizador sem nenhuma estrutura, quero um convite para criar a primeira, para saber o que fazer.
25. Como organizador, quero que a estrutura escolhida volte ao formulário, para repetir o torneio sem escolher de novo.
26. Como organizador, quero que editar uma estrutura não mude o torneio em andamento, para o jogo não mudar no meio.
27. Como organizador com um torneio em andamento na versão anterior, quero que ele continue igual, para a atualização não atrapalhar o evento.
28. Como organizador, quero que uma estrutura danificada não impeça o app de abrir, para não ficar sem relógio.
29. Como organizador, quero que um torneio com níveis de durações diferentes conte cada nível com a própria duração, para o relógio seguir a minha estrutura.

## Decisões de implementação

- **Módulo de persistência:** passa a guardar também a lista de estruturas e o rascunho, em chaves próprias, com a mesma validação e o mesmo tratamento de dados inválidos que já aplica ao torneio e à última configuração. Na leitura, estruturas inválidas são descartadas uma a uma.
- **Identidade da estrutura:** cada estrutura tem um identificador estável, gerado no aparelho, e a data da última edição, que define a ordem da lista. A última configuração guarda o identificador da estrutura escolhida.
- **Configuração do torneio:** a configuração guardada no torneio continua com a cópia dos níveis. O campo de duração do nível e o nome de estrutura pronta saem da configuração; as configurações antigas que ainda os têm continuam válidas, e esses campos são ignorados.
- **Módulo de estruturas:** a fórmula das estruturas prontas e a dedução de nomes saem. O módulo passa a cuidar da sugestão de próximo nível e da validação de uma estrutura.
- **Navegação:** o app passa a ter dois endereços por hash, o principal (formulário de torneio ou relógio) e o da tela de estruturas, sem biblioteca nova. O relógio continua tendo prioridade: com um torneio em andamento, o endereço principal mostra o relógio.
- **Componentes:** a tela de estruturas, a lista, o editor de níveis e o convite partem de componentes HeroUI v3. A confirmação de exclusão e de descarte reutiliza o modal de confirmação existente.
- **Menu de configurações:** continua o mesmo modal, agora acessível também da tela de estruturas.

## Decisões de teste

Um bom teste verifica comportamento visível pela interface do módulo, sem conhecer os detalhes internos.

- **App:** é o ponto principal. Cobre a jornada de criação, a sugestão de nível, a validação, a edição, a exclusão, o rascunho no refresh, a confirmação ao voltar, a escolha no formulário de torneio, o convite sem estruturas, o início do torneio com durações por nível e as preferências só no menu. Usa a técnica de `src/bugs.test.tsx`: estado semeado no `localStorage`, relógio simulado e `Audio` substituído.
- **Módulo de persistência:** testes diretos, como `src/utils/persistence.test.ts`, para estruturas e rascunhos inválidos, para a última configuração que aponta para uma estrutura excluída e para a compatibilidade com configurações e torneios da versão anterior.
- **Testes existentes:** os que dependem das estruturas prontas ou do campo de duração do nível são atualizados para semear estruturas próprias, sem perder o comportamento que verificam.

## Fora do escopo

- **Ante:** é a próxima entrega, prevista para 2026-11-07. Esta spec não adiciona o campo, mas o formato do nível não deve impedir que ele seja acrescentado depois.
- Estruturas prontas ou modelos para copiar.
- Duplicar, importar ou exportar estruturas.
- Novos eventos de analytics.
- Outros ajustes de tela para o celular além das duas mudanças acima.
- Intervalos definidos dentro da estrutura.
- O módulo de restauração proposto na revisão de arquitetura.

## Observações

- O torneio de 2026-11-07 usa esta versão só se ela for conferida no celular a tempo. Caso contrário, ele roda na versão do PR #3, já em produção.
- Depois do deploy, quem tinha uma última configuração com estrutura pronta precisa criar uma estrutura antes de iniciar um novo torneio.
