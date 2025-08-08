# Poker Club - Aplicação de Gerenciamento de Torneios

Uma aplicação moderna para gerenciamento de torneios de poker, desenvolvida para clubes de poker.

## Funcionalidades

### 🎲 Sorteio de Seats
- **Quantidade configurável** de jogadores (2-20)
- **Sorteio individual** com animação
- **Reset completo** para novo sorteio
- **Interface intuitiva** com visualização clara dos seats

### ⏱️ Timer do Torneio
- **Duração configurável** dos níveis
- **Valores SB/BB** que dobram automaticamente
- **Intervalos opcionais** entre níveis
- **Som de alerta** quando o nível termina
- **Avanço automático** para próximo nível
- **Visualização dos próximos níveis**
- **Limite configurável** de níveis (opcional)
- **Encerramento automático** do torneio

## Tecnologias Utilizadas

- **React 18** com TypeScript
- **Vite** para build rápido
- **Tailwind CSS** para design responsivo
- **React Router** para navegação
- **Context API** para gerenciamento de estado

## Como Executar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Executar em modo desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Build para produção:**
   ```bash
   npm run build
   ```

## Estrutura do Projeto

```
src/
├── pages/
│   ├── SeatSorter.tsx      # Página de sorteio de seats
│   └── TournamentTimer.tsx  # Página do timer do torneio
├── components/              # Componentes reutilizáveis
├── App.tsx                 # Componente principal com roteamento
├── main.tsx               # Ponto de entrada
└── index.css              # Estilos globais
```

## Funcionalidades Detalhadas

### Sorteio de Seats
- Configure a quantidade de jogadores
- Clique em "Sortear Seat" para cada jogador
- Visualize os seats sorteados em tempo real
- Use "Resetar Sorteio" para começar novamente

### Timer do Torneio
- **Configurações:**
  - Duração do nível (1-60 minutos)
  - Valores iniciais de SB e BB
  - Duração do intervalo (0-30 minutos)
  - Habilitar/desabilitar intervalos
  - **Limite de níveis (1-50 níveis)**
  - **Habilitar/desabilitar limite de níveis**

- **Controles:**
  - Iniciar/Pausar timer
  - Resetar para o início
  - Visualização em tempo real

- **Recursos:**
  - Som de alerta ao final do nível
  - Avanço automático para próximo nível
  - Preview dos próximos 6 níveis
  - Cálculo automático dos valores SB/BB
  - **Encerramento automático quando atinge o limite de níveis**
  - **Indicador de progresso (Nível X de Y)**

## Design

A aplicação utiliza um design moderno com:
- **Tema escuro** ideal para ambientes de poker
- **Cores verde/azul** para destaque
- **Interface responsiva** para diferentes telas
- **Animações suaves** para melhor UX

## Manutenção

A aplicação foi desenvolvida com foco em:
- **Código limpo** e bem documentado
- **TypeScript** para type safety
- **Componentes reutilizáveis**
- **Fácil manutenção** e extensão

## Licença

Este projeto é de uso livre para clubes de poker.
