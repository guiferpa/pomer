import type { TournamentConfig, TournamentState } from "@/types/tournament";

import { beforeEach, describe, expect, it } from "vitest";

import {
  loadConfig,
  loadTournament,
  saveConfig,
  saveTournament,
} from "@/utils/persistence";
import { blindLevels, buildStructure } from "@/utils/structures";

const TOURNAMENT_KEY = "pomer-tournament-state";
const CONFIG_KEY = "pomer-config";
const NOW = new Date("2026-01-01T12:07:00Z");

const config = (over: Partial<TournamentConfig> = {}): TournamentConfig => ({
  name: "T",
  levelDuration: 20,
  breakInterval: 2,
  breakDuration: 5,
  primaryColor: "#FF6B6B",
  structure: "turbo",
  blindStructure: [
    { level: 1, smallBlind: 25, bigBlind: 50, duration: 20 },
    { level: 2, smallBlind: 50, bigBlind: 100, duration: 20 },
  ],
  ...over,
});

const tournament = (over: Partial<TournamentState> = {}): TournamentState => ({
  config: config(),
  currentLevel: 1,
  timeRemaining: 1200,
  isRunning: true,
  isBreak: false,
  history: [],
  startTime: new Date("2026-01-01T12:00:00Z"),
  ...over,
});

const store = (value: unknown) =>
  localStorage.setItem(TOURNAMENT_KEY, JSON.stringify(value));

beforeEach(() => localStorage.clear());

describe("loadTournament", () => {
  it("reports nothing saved when the key is empty", () => {
    expect(loadTournament(NOW)).toEqual({ status: "empty" });
  });

  it("brings back a saved tournament with its dates", () => {
    const entry = {
      level: 1,
      smallBlind: 25,
      bigBlind: 50,
      startTime: new Date("2026-01-01T11:40:00Z"),
      endTime: new Date("2026-01-01T12:00:00Z"),
      duration: 20,
    };
    const saved = tournament({ currentLevel: 2, history: [entry] });

    store(saved);

    expect(loadTournament(NOW)).toEqual({ status: "saved", state: saved });
  });

  it("reports broken JSON as invalid", () => {
    localStorage.setItem(TOURNAMENT_KEY, "{not json");

    expect(loadTournament(NOW)).toEqual({ status: "invalid" });
  });

  const { config: _config, ...withoutConfig } = tournament();
  const usable = config().blindStructure[0];

  it.each<[string, unknown]>([
    ["an empty object", {}],
    ["an array", [tournament()]],
    ["null", null],
    ["a number", 42],
    ["no config", withoutConfig],
    ["a config that is not an object", tournament({ config: "x" as any })],
    ["no levels", tournament({ config: { ...config(), blindStructure: undefined as any } })],
    ["levels that are not a list", tournament({ config: config({ blindStructure: {} as any }) })],
    ["a level without blinds", tournament({ config: config({ blindStructure: [{ level: 1 } as any] }) })],
    ["a level with text blinds", tournament({ config: config({ blindStructure: [{ ...usable, smallBlind: "25" as any }] }) })],
    ["a level that is null", tournament({ config: config({ blindStructure: [null as any] }) })],
    ["a current level that is not a number", tournament({ currentLevel: "2" as any })],
    ["no current level", tournament({ currentLevel: undefined as any })],
    ["a time that is not a number", tournament({ timeRemaining: null as any })],
    ["a time that is NaN text", tournament({ timeRemaining: "NaN" as any })],
    ["a history that is not a list", tournament({ history: "x" as any })],
  ])("reports %s as invalid", (_, value) => {
    store(value);

    expect(loadTournament(NOW)).toEqual({ status: "invalid" });
  });

  it("reports the blank state left by older resets as nothing saved", () => {
    store(
      tournament({
        config: config({ blindStructure: [] }),
        timeRemaining: 0,
        isRunning: false,
        startTime: undefined,
      }),
    );

    expect(loadTournament(NOW)).toEqual({ status: "empty" });
  });

  it("corrects what older versions left in the saved state", () => {
    const finished = (level: number) => ({
      level,
      smallBlind: 25,
      bigBlind: 50,
      startTime: new Date("2026-01-01T11:00:00Z"),
      endTime: new Date("2026-01-01T11:20:00Z"),
      duration: 20,
    });

    store(tournament({ currentLevel: 2, history: [finished(1), finished(1)] }));

    const loaded = loadTournament(NOW);

    expect(loaded.status === "saved" && loaded.state.history).toEqual([
      finished(1),
    ]);
  });
});

describe("saveTournament", () => {
  it("saves a tournament that comes back the same", () => {
    const state = tournament({ currentLevel: 2, timeRemaining: 800 });

    saveTournament(state);

    expect(loadTournament(NOW)).toEqual({ status: "saved", state });
  });

  it("empties the key when there is no tournament, as after a reset", () => {
    saveTournament(tournament());
    saveTournament(
      tournament({
        config: config({ blindStructure: [] }),
        timeRemaining: 0,
        isRunning: false,
        startTime: undefined,
      }),
    );

    expect(localStorage.getItem(TOURNAMENT_KEY)).toBeNull();
  });
});

describe("last configuration", () => {
  it("has none when nothing was saved", () => {
    expect(loadConfig()).toBeNull();
  });

  it("comes back as it was saved", () => {
    saveConfig(config({ name: "Friday" }));

    expect(loadConfig()).toEqual(config({ name: "Friday" }));
  });

  it.each<[string, string]>([
    ["broken JSON", "{oops"],
    ["an empty object", "{}"],
    ["an array", JSON.stringify([config()])],
    ["null", "null"],
    ["a name that is not text", JSON.stringify({ ...config(), name: 3 })],
    ["a duration that is not a number", JSON.stringify({ ...config(), levelDuration: "20" })],
    ["a break interval missing", JSON.stringify({ ...config(), breakInterval: undefined })],
    ["a break duration that is null", JSON.stringify({ ...config(), breakDuration: null })],
    ["a colour that is not text", JSON.stringify({ ...config(), primaryColor: 1 })],
    ["levels that are not usable", JSON.stringify({ ...config(), blindStructure: [{}] })],
  ])("ignores %s", (_, raw) => {
    localStorage.setItem(CONFIG_KEY, raw);

    expect(loadConfig()).toBeNull();
  });

  it("keeps the structure name it was saved with", () => {
    saveConfig(config({ structure: "large" }));

    expect(loadConfig()?.structure).toBe("large");
  });

  it.each<[string, Record<string, unknown>, string]>([
    ["turbo levels", { blindStructure: buildStructure("turbo", 10) }, "turbo"],
    ["small levels", { blindStructure: buildStructure("small", 15) }, "small"],
    ["large levels", { blindStructure: buildStructure("large", 20) }, "large"],
    ["levels of no structure", { blindStructure: blindLevels(30, 9, 20) }, "medium"],
    ["an unknown name", { structure: "huge", blindStructure: buildStructure("small", 20) }, "small"],
  ])("deduces the structure of an older configuration with %s", (_, over, name) => {
    const { structure: _structure, ...older } = config();

    localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...older, ...over }));

    expect(loadConfig()).toEqual({ ...older, ...over, structure: name });
  });

  it("survives a reset of the tournament", () => {
    saveConfig(config());
    saveTournament(tournament());
    saveTournament(tournament({ config: config({ blindStructure: [] }) }));

    expect(loadConfig()).toEqual(config());
  });
});
