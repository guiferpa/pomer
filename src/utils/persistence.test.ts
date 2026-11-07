import type {
  BlindStructure,
  TournamentConfig,
  TournamentState,
} from "@/types/tournament";

import { beforeEach, describe, expect, it } from "vitest";

import {
  loadConfig,
  loadStructures,
  loadTournament,
  saveConfig,
  saveStructure,
  saveTournament,
} from "@/utils/persistence";

const TOURNAMENT_KEY = "pomer-tournament-state";
const CONFIG_KEY = "pomer-config";
const NOW = new Date("2026-01-01T12:07:00Z");

const config = (over: Partial<TournamentConfig> = {}): TournamentConfig => ({
  name: "T",
  breakInterval: 2,
  breakDuration: 5,
  primaryColor: "#FF6B6B",
  blindStructure: [
    { level: 1, smallBlind: 25, bigBlind: 50, duration: 20 },
    { level: 2, smallBlind: 50, bigBlind: 100, duration: 15 },
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

  it("brings back the ante of the levels and of the history entries that have one", () => {
    const entry = {
      level: 1,
      smallBlind: 25,
      bigBlind: 50,
      ante: 50,
      startTime: new Date("2026-01-01T11:40:00Z"),
      endTime: new Date("2026-01-01T12:00:00Z"),
      duration: 20,
    };
    const saved = tournament({
      config: config({
        blindStructure: [
          { level: 1, smallBlind: 25, bigBlind: 50, ante: 50, duration: 20 },
          { level: 2, smallBlind: 50, bigBlind: 100, duration: 15 },
        ],
      }),
      currentLevel: 2,
      history: [entry],
    });

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
    ["a level with a text ante", tournament({ config: config({ blindStructure: [{ ...usable, ante: "50" as any }] }) })],
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

  it("brings back a tournament saved by the previous version with the levels it kept", () => {
    const older = { ...config(), levelDuration: 99, structure: "turbo" };

    store(tournament({ config: older as TournamentConfig, timeRemaining: 900 }));

    const loaded = loadTournament(NOW);

    expect(loaded.status === "saved" && loaded.state.config.blindStructure).toEqual(
      config().blindStructure,
    );
    expect(loaded.status === "saved" && loaded.state.timeRemaining).toBe(900);
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
    const state = tournament({
      currentLevel: 2,
      timeRemaining: 800,
      isRunning: false,
    });

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
    ["a break interval missing", JSON.stringify({ ...config(), breakInterval: undefined })],
    ["a break duration that is null", JSON.stringify({ ...config(), breakDuration: null })],
    ["a colour that is not text", JSON.stringify({ ...config(), primaryColor: 1 })],
    ["levels that are not usable", JSON.stringify({ ...config(), blindStructure: [{}] })],
  ])("ignores %s", (_, raw) => {
    localStorage.setItem(CONFIG_KEY, raw);

    expect(loadConfig()).toBeNull();
  });

  const saved = {
    id: "house",
    name: "Casa",
    updatedAt: "2026-11-06T10:00:00.000Z",
    levels: [{ level: 1, smallBlind: 25, bigBlind: 50, duration: 15 }],
  };

  it("remembers the chosen structure by its id", () => {
    saveStructure(saved);
    saveConfig(config({ structureId: "house" }));

    expect(loadConfig()?.structureId).toBe("house");
  });

  it("forgets the chosen structure once it was deleted", () => {
    saveConfig(config({ structureId: "house" }));

    expect(loadConfig()).toEqual(config());
  });

  it("brings back a configuration saved by the previous version filled, without a chosen structure", () => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ ...config(), levelDuration: 20, structure: "turbo" }),
    );

    expect(loadConfig()).toEqual(config());
  });

  it("survives a reset of the tournament", () => {
    saveConfig(config());
    saveTournament(tournament());
    saveTournament(tournament({ config: config({ blindStructure: [] }) }));

    expect(loadConfig()).toEqual(config());
  });
});

describe("blind structures", () => {
  const STRUCTURES_KEY = "pomer-structures";

  const structure = (over: Partial<BlindStructure> = {}): BlindStructure => ({
    id: "a",
    name: "Casa",
    updatedAt: "2026-11-06T10:00:00.000Z",
    levels: [
      { level: 1, smallBlind: 25, bigBlind: 50, duration: 15 },
      { level: 2, smallBlind: 50, bigBlind: 100, duration: 20 },
    ],
    ...over,
  });

  it("has no structures when nothing was saved", () => {
    expect(loadStructures()).toEqual([]);
  });

  it("brings back a saved structure", () => {
    saveStructure(structure());

    expect(loadStructures()).toEqual([structure()]);
  });

  it("lists the most recently edited structure first", () => {
    saveStructure(structure({ id: "old", name: "Old", updatedAt: "2026-11-06T09:00:00.000Z" }));
    saveStructure(structure({ id: "new", name: "New", updatedAt: "2026-11-06T11:00:00.000Z" }));
    saveStructure(structure({ id: "mid", name: "Mid", updatedAt: "2026-11-06T10:00:00.000Z" }));

    expect(loadStructures().map((s) => s.id)).toEqual(["new", "mid", "old"]);
  });

  it("replaces a structure saved again with the same id", () => {
    saveStructure(structure());
    saveStructure(structure({ name: "Casa nova", updatedAt: "2026-11-06T12:00:00.000Z" }));

    expect(loadStructures()).toEqual([
      structure({ name: "Casa nova", updatedAt: "2026-11-06T12:00:00.000Z" }),
    ]);
  });

  it("ignores broken JSON", () => {
    localStorage.setItem(STRUCTURES_KEY, "{not json");

    expect(loadStructures()).toEqual([]);
  });

  it("ignores a stored value that is not a list", () => {
    localStorage.setItem(STRUCTURES_KEY, JSON.stringify(structure()));

    expect(loadStructures()).toEqual([]);
  });

  const level = structure().levels[0];

  it.each<[string, unknown]>([
    ["null", null],
    ["no id", { ...structure(), id: undefined }],
    ["an empty name", structure({ name: "  " })],
    ["no date", { ...structure(), updatedAt: undefined }],
    ["a date that is not a date", structure({ updatedAt: "yesterday" })],
    ["no levels", structure({ levels: [] })],
    ["levels that are not a list", { ...structure(), levels: {} }],
    ["a level without blinds", { ...structure(), levels: [{ duration: 10 }] }],
    ["a blind that is not an integer", structure({ levels: [{ ...level, smallBlind: 2.5 }] })],
    ["a blind that is not positive", structure({ levels: [{ ...level, smallBlind: 0 }] })],
    ["a big blind below the small blind", structure({ levels: [{ ...level, bigBlind: 10 }] })],
    ["a duration over 60", structure({ levels: [{ ...level, duration: 61 }] })],
    ["an ante of 0", structure({ levels: [{ ...level, ante: 0 }] })],
    ["an ante that is not an integer", structure({ levels: [{ ...level, ante: 2.5 }] })],
    ["an ante that is not a number", { ...structure(), levels: [{ ...level, ante: "50" }] }],
    ["a null ante", { ...structure(), levels: [{ ...level, ante: null }] }],
  ])("drops a stored structure with %s and keeps the others", (_, broken) => {
    localStorage.setItem(
      STRUCTURES_KEY,
      JSON.stringify([structure({ id: "good" }), broken]),
    );

    expect(loadStructures()).toEqual([structure({ id: "good" })]);
  });

  it("brings back the ante of the levels that have one", () => {
    const withAnte = structure({
      levels: [
        { level: 1, smallBlind: 25, bigBlind: 50, duration: 15 },
        { level: 2, smallBlind: 50, bigBlind: 100, ante: 100, duration: 20 },
      ],
    });

    saveStructure(withAnte);

    expect(loadStructures()).toEqual([withAnte]);
  });

  it("does not require blinds to go up between levels", () => {
    const down = structure({
      levels: [
        { level: 1, smallBlind: 100, bigBlind: 200, duration: 10 },
        { level: 2, smallBlind: 50, bigBlind: 100, duration: 10 },
      ],
    });

    saveStructure(down);

    expect(loadStructures()).toEqual([down]);
  });

  it("drops the invalid stored structures when saving another", () => {
    localStorage.setItem(STRUCTURES_KEY, JSON.stringify([null, structure()]));
    saveStructure(structure({ id: "b", name: "Outra", updatedAt: "2026-11-06T11:00:00.000Z" }));

    expect(JSON.parse(localStorage.getItem(STRUCTURES_KEY)!)).toHaveLength(2);
  });
});
