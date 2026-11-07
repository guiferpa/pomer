// The blind structures screen, driven through the App with the setup of
// `src/bugs.test.tsx`: state seeded in localStorage, fake clock, stubbed Audio.
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";

const STRUCTURES_KEY = "pomer-structures";

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-11-06T12:00:00Z") });
  localStorage.clear();
  localStorage.setItem("pomer-language", "pt");
  window.location.hash = "";
  vi.stubGlobal(
    "Audio",
    class {
      volume = 1; preload = ""; src = "";
      load() {}
      play() { return Promise.resolve(); }
    },
  );
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: false, media: q, addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, dispatchEvent: () => false, onchange: null,
  }));
  window.matchMedia = (globalThis as any).matchMedia;
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  (globalThis as any).CSS = { escape: (v: string) => v };
  Element.prototype.scrollIntoView = () => {};
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  window.location.hash = "";
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const heading = () => screen.queryByRole("heading", { name: "Estruturas de blinds" });
const button = (name: string | RegExp) => screen.getByRole("button", { name });
const field = (name: string | RegExp) => screen.getByRole("textbox", { name }) as HTMLInputElement;
const type = (input: HTMLInputElement, value: string) =>
  fireEvent.change(input, { target: { value } });

// The level fields of the n-th level (1-based).
const levelField = (n: number, label: "Small Blind" | "Big Blind" | "Duração (min)") =>
  within(screen.getByRole("group", { name: `Nível ${n}` })).getByRole("textbox", {
    name: label,
  }) as HTMLInputElement;

const fillLevel = (n: number, sb: string, bb: string, duration: string) => {
  type(levelField(n, "Small Blind"), sb);
  type(levelField(n, "Big Blind"), bb);
  type(levelField(n, "Duração (min)"), duration);
};

const openStructures = () => {
  render(<App />);
  fireEvent.click(screen.getByRole("link", { name: "Gerenciar estruturas" }));
};

const stored = () => JSON.parse(localStorage.getItem(STRUCTURES_KEY) ?? "[]");

describe("structures screen", () => {
  it("opens from the tournament form and has its own address", () => {
    openStructures();

    expect(heading()).toBeTruthy();
    expect(window.location.hash).toBe("#/estruturas");
  });

  it("stays on the structures screen after a refresh", () => {
    window.location.hash = "#/estruturas";
    render(<App />);

    expect(heading()).toBeTruthy();
  });

  it("goes back to the tournament form", () => {
    openStructures();
    fireEvent.click(button("Voltar"));

    expect(heading()).toBeNull();
    expect(button("Iniciar Torneio")).toBeTruthy();
  });

  it("opens the settings menu", () => {
    openStructures();
    fireEvent.click(button("Configurações"));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Idioma")).toBeTruthy();
  });
});

const structure = (id: string, name: string, updatedAt: string) => ({
  id,
  name,
  updatedAt,
  levels: [{ level: 1, smallBlind: 25, bigBlind: 50, duration: 15 }],
});

const listed = () =>
  within(screen.getByRole("list", { name: "Estruturas de blinds" }))
    .getAllByRole("listitem")
    .map((item) => item.textContent);

const refresh = () => {
  cleanup();
  render(<App />);
};

describe("creating a structure", () => {
  it("starts from scratch with the name and an empty first level", () => {
    openStructures();
    fireEvent.click(button("Nova estrutura"));

    expect(field("Nome da estrutura").value).toBe("");
    expect(levelField(1, "Small Blind").value).toBe("");
    expect(levelField(1, "Big Blind").value).toBe("");
    expect(levelField(1, "Duração (min)").value).toBe("");
    expect(screen.queryByRole("group", { name: "Nível 2" })).toBeNull();
  });

  it("saves the structure on the device and lists it, even after a refresh", () => {
    openStructures();
    fireEvent.click(button("Nova estrutura"));
    type(field("Nome da estrutura"), "Casa");
    fillLevel(1, "25", "50", "15");
    fireEvent.click(button("Adicionar nível"));
    fireEvent.click(button("Salvar"));

    expect(listed()).toEqual([expect.stringContaining("Casa")]);
    expect(listed()[0]).toContain("2 níveis");
    expect(stored()).toEqual([
      expect.objectContaining({
        name: "Casa",
        levels: [
          { level: 1, smallBlind: 25, bigBlind: 50, duration: 15 },
          { level: 2, smallBlind: 50, bigBlind: 100, duration: 15 },
        ],
      }),
    ]);

    refresh();

    expect(listed()).toEqual([expect.stringContaining("Casa")]);
  });

  it("suggests the next level with double blinds and the same duration, all editable", () => {
    openStructures();
    fireEvent.click(button("Nova estrutura"));
    fillLevel(1, "100", "200", "20");
    fireEvent.click(button("Adicionar nível"));

    expect(levelField(2, "Small Blind").value).toBe("200");
    expect(levelField(2, "Big Blind").value).toBe("400");
    expect(levelField(2, "Duração (min)").value).toBe("20");

    type(levelField(2, "Small Blind"), "150");
    type(levelField(2, "Big Blind"), "300");
    type(levelField(2, "Duração (min)"), "25");
    fireEvent.click(button("Adicionar nível"));

    expect(levelField(3, "Small Blind").value).toBe("300");
    expect(levelField(3, "Big Blind").value).toBe("600");
    expect(levelField(3, "Duração (min)").value).toBe("25");
  });

  it("removes any level as long as one is left", () => {
    openStructures();
    fireEvent.click(button("Nova estrutura"));

    expect(button("Remover nível 1").hasAttribute("disabled")).toBe(true);

    fillLevel(1, "10", "20", "10");
    fireEvent.click(button("Adicionar nível"));
    fireEvent.click(button("Adicionar nível"));
    fireEvent.click(button("Remover nível 2"));

    expect(levelField(1, "Small Blind").value).toBe("10");
    expect(levelField(2, "Small Blind").value).toBe("40");
    expect(screen.queryByRole("group", { name: "Nível 3" })).toBeNull();

    fireEvent.click(button("Remover nível 1"));

    expect(levelField(1, "Small Blind").value).toBe("40");
    expect(button("Remover nível 1").hasAttribute("disabled")).toBe(true);
  });

  it("does not require the blinds to go up between levels", () => {
    openStructures();
    fireEvent.click(button("Nova estrutura"));
    type(field("Nome da estrutura"), "Descendo");
    fillLevel(1, "100", "200", "10");
    fireEvent.click(button("Adicionar nível"));
    fillLevel(2, "50", "100", "10");
    fireEvent.click(button("Salvar"));

    expect(stored()).toHaveLength(1);
  });
});

describe("validating a structure on save", () => {
  const startValid = () => {
    openStructures();
    fireEvent.click(button("Nova estrutura"));
    type(field("Nome da estrutura"), "Casa");
    fillLevel(1, "25", "50", "15");
  };

  it("shows the error on an empty name and saves nothing", () => {
    startValid();
    type(field("Nome da estrutura"), "  ");
    fireEvent.click(button("Salvar"));

    expect(screen.getByText("Preencha este campo.")).toBeTruthy();
    expect(field("Nome da estrutura").getAttribute("aria-invalid")).toBe("true");
    expect(localStorage.getItem(STRUCTURES_KEY)).toBeNull();
  });

  it("refuses a name already used by another saved structure", () => {
    localStorage.setItem(
      STRUCTURES_KEY,
      JSON.stringify([structure("a", "Casa", "2026-11-05T10:00:00.000Z")]),
    );
    startValid();
    type(field("Nome da estrutura"), " casa ");
    fireEvent.click(button("Salvar"));

    expect(screen.getByText("Já existe uma estrutura com este nome.")).toBeTruthy();
    expect(stored()).toHaveLength(1);
  });

  it.each([
    ["a blind that is not an integer", "Small Blind", "2.5", "Use um número inteiro maior que zero."],
    ["a blind that is not positive", "Small Blind", "0", "Use um número inteiro maior que zero."],
    ["an empty blind", "Big Blind", "", "Preencha este campo."],
    ["a big blind below the small blind", "Big Blind", "20", "O big blind deve ser maior ou igual ao small blind."],
    ["a duration of 0", "Duração (min)", "0", "Use um número inteiro de 1 a 60."],
    ["a duration over 60", "Duração (min)", "61", "Use um número inteiro de 1 a 60."],
  ] as const)("shows the error on %s in the field and saves nothing", (_, label, value, message) => {
    startValid();
    type(levelField(1, label), value);
    fireEvent.click(button("Salvar"));

    expect(levelField(1, label).getAttribute("aria-invalid")).toBe("true");
    expect(
      within(screen.getByRole("group", { name: "Nível 1" })).getByText(message),
    ).toBeTruthy();
    expect(localStorage.getItem(STRUCTURES_KEY)).toBeNull();
  });

  it("points the error at the level that has it", () => {
    startValid();
    fireEvent.click(button("Adicionar nível"));
    type(levelField(2, "Duração (min)"), "90");
    fireEvent.click(button("Salvar"));

    expect(levelField(1, "Duração (min)").getAttribute("aria-invalid")).not.toBe("true");
    expect(levelField(2, "Duração (min)").getAttribute("aria-invalid")).toBe("true");
  });
});

describe("structures list", () => {
  it("lists the most recently edited structure first", () => {
    localStorage.setItem(
      STRUCTURES_KEY,
      JSON.stringify([
        structure("a", "Antiga", "2026-11-01T10:00:00.000Z"),
        structure("b", "Recente", "2026-11-05T10:00:00.000Z"),
      ]),
    );
    openStructures();

    expect(listed()).toEqual([
      expect.stringContaining("Recente"),
      expect.stringContaining("Antiga"),
    ]);

    fireEvent.click(button("Nova estrutura"));
    type(field("Nome da estrutura"), "Nova");
    fillLevel(1, "10", "20", "10");
    fireEvent.click(button("Salvar"));

    expect(listed()).toEqual([
      expect.stringContaining("Nova"),
      expect.stringContaining("Recente"),
      expect.stringContaining("Antiga"),
    ]);
  });

  it("ignores an invalid stored structure and shows the others", () => {
    localStorage.setItem(
      STRUCTURES_KEY,
      JSON.stringify([
        { id: "x", name: "Quebrada", levels: [] },
        structure("a", "Boa", "2026-11-01T10:00:00.000Z"),
      ]),
    );
    openStructures();

    expect(listed()).toEqual([expect.stringContaining("Boa")]);
  });
});

describe("starting a tournament with an own structure", () => {
  const KEY = "pomer-tournament-state";
  const CONFIG_KEY = "pomer-config";

  const house = {
    id: "house",
    name: "Casa",
    updatedAt: "2026-11-05T10:00:00.000Z",
    levels: [
      { level: 1, smallBlind: 25, bigBlind: 50, duration: 15 },
      { level: 2, smallBlind: 50, bigBlind: 100, duration: 20 },
      { level: 3, smallBlind: 100, bigBlind: 200, duration: 5 },
      { level: 4, smallBlind: 200, bigBlind: 400, duration: 30 },
    ],
  };
  const turbo = {
    id: "turbo",
    name: "Turbo da casa",
    updatedAt: "2026-11-06T10:00:00.000Z",
    levels: [{ level: 1, smallBlind: 10, bigBlind: 20, duration: 7 }],
  };
  const lastConfig = (over: Record<string, unknown> = {}) => ({
    name: "Sexta",
    breakInterval: 10,
    breakDuration: 5,
    primaryColor: "#FF6B6B",
    blindStructure: turbo.levels,
    ...over,
  });

  const saveStructures = (...list: unknown[]) =>
    localStorage.setItem(STRUCTURES_KEY, JSON.stringify(list));
  const structureSelect = () => screen.getByRole("button", { name: /Estrutura de Blinds/ });
  const submit = () => fireEvent.submit(document.querySelector("form")!);
  const started = () => JSON.parse(localStorage.getItem(KEY)!);
  const tick = (seconds: number) => {
    for (let i = 0; i < seconds; i++) act(() => void vi.advanceTimersByTime(1000));
  };

  it("has no level duration field nor ready-made structures", async () => {
    saveStructures(house);
    vi.useRealTimers();
    render(<App />);

    expect(screen.queryByRole("spinbutton", { name: /Duração dos Níveis/ })).toBeNull();
    fireEvent.click(structureSelect());
    const options = (await screen.findAllByRole("option")).map((o) => o.textContent);
    expect(options).toEqual([expect.stringContaining("Casa")]);
  });

  it("without saved structures, invites to create the first one and does not start", () => {
    render(<App />);

    expect(screen.getByText("Crie a sua primeira estrutura de blinds para iniciar o torneio.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Gerenciar estruturas" })).toBeTruthy();
    submit();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(button("Iniciar Torneio")).toBeTruthy();
  });

  it("lists the saved structures in the order of the structures screen, with the link beside it", async () => {
    saveStructures(house, turbo);
    vi.useRealTimers();
    render(<App />);

    expect(screen.getByRole("link", { name: "Gerenciar estruturas" })).toBeTruthy();
    fireEvent.click(structureSelect());
    const options = (await screen.findAllByRole("option")).map((o) => o.textContent);
    expect(options).toEqual([
      expect.stringContaining("Turbo da casa"),
      expect.stringContaining("Casa"),
    ]);
  });

  it("previews the levels of the chosen structure, each with its duration", async () => {
    saveStructures(house, turbo);
    vi.useRealTimers();
    render(<App />);
    fireEvent.click(structureSelect());
    fireEvent.click(await screen.findByRole("option", { name: /^Casa/ }));
    await waitFor(() => expect(screen.queryByRole("option")).toBeNull());

    expect(screen.getByText("25/50")).toBeTruthy();
    expect(screen.getByText("50/100")).toBeTruthy();
    expect(screen.getByText("15 min")).toBeTruthy();
    expect(screen.getByText("20 min")).toBeTruthy();

    submit();
    expect(started().config.blindStructure).toEqual(house.levels);
    expect(JSON.parse(localStorage.getItem(CONFIG_KEY)!).structureId).toBe("house");
  });

  it("does not start until a structure is chosen", () => {
    saveStructures(house);
    render(<App />);
    submit();

    expect(localStorage.getItem(KEY)).toBeNull();
    expect(screen.getByText("Escolha uma estrutura.")).toBeTruthy();
  });

  it("counts each level with its own duration, also when skipping, pausing and after a refresh", () => {
    saveStructures(house);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(lastConfig({ structureId: "house" })));
    render(<App />);
    submit();

    expect(screen.getByText("15:00")).toBeTruthy();
    tick(15 * 60);
    expect(started().currentLevel).toBe(2);
    expect(screen.getByText("20:00")).toBeTruthy();

    fireEvent.click(button("Pausar"));
    fireEvent.click(button("Próximo Nível"));
    expect(started().currentLevel).toBe(3);
    expect(screen.getByText("05:00")).toBeTruthy();

    refresh();
    expect(screen.getByText("05:00")).toBeTruthy();
    fireEvent.click(button("Retomar"));
    tick(5 * 60);
    expect(started().currentLevel).toBe(4);
    expect(screen.getByText("30:00")).toBeTruthy();
  });

  it("keeps its copy of the levels when the structure is deleted afterwards", () => {
    saveStructures(house);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(lastConfig({ structureId: "house" })));
    render(<App />);
    submit();
    saveStructures();
    refresh();

    expect(screen.getByText("15:00")).toBeTruthy();
    expect(started().config.blindStructure).toEqual(house.levels);
  });

  it("comes back to the form with the chosen structure after a reset", () => {
    saveStructures(house, turbo);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(lastConfig({ structureId: "house" })));
    render(<App />);
    submit();
    fireEvent.click(button("Reset"));
    fireEvent.click(button("Resetar"));
    refresh();

    expect(structureSelect().textContent).toContain("Casa");
    submit();
    expect(started().config.blindStructure).toEqual(house.levels);
  });

  it("opens without a chosen structure when it was deleted", () => {
    saveStructures(turbo);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(lastConfig({ structureId: "house" })));
    render(<App />);

    expect(structureSelect().textContent).not.toContain("Casa");
    submit();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("brings back a configuration from the previous version filled, without a chosen structure", () => {
    saveStructures(house);
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ ...lastConfig(), levelDuration: 20, structure: "turbo" }),
    );
    render(<App />);

    expect(field("Nome do Torneio").value).toBe("Sexta");
    expect(
      (screen.getByRole("spinbutton", { name: /Intervalo de Break/ }) as HTMLInputElement).value,
    ).toBe("10");
    expect(structureSelect().textContent).not.toContain("Casa");
    submit();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("keeps the validation of the break fields", () => {
    saveStructures(house);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(lastConfig({ structureId: "house" })));
    render(<App />);
    const interval = screen.getByRole("spinbutton", { name: /Intervalo de Break/ });
    fireEvent.change(interval, { target: { value: "11" } });
    submit();

    expect(interval.getAttribute("aria-invalid")).toBe("true");
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("opens a tournament saved by the previous version with the levels it kept", () => {
    const older = {
      name: "Antigo",
      levelDuration: 99,
      structure: "turbo",
      breakInterval: 10,
      breakDuration: 5,
      primaryColor: "#FF6B6B",
      blindStructure: house.levels,
    };
    localStorage.setItem(
      KEY,
      JSON.stringify({
        config: older,
        currentLevel: 2,
        timeRemaining: 600,
        isRunning: false,
        isBreak: false,
        history: [],
        startTime: new Date().toISOString(),
      }),
    );
    render(<App />);

    expect(screen.getByText("10:00")).toBeTruthy();
    fireEvent.click(button("Próximo Nível"));
    expect(screen.getByText("05:00")).toBeTruthy();
    expect(started().config.blindStructure).toEqual(house.levels);
  });
});
