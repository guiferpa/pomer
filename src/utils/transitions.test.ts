import type { TournamentState } from "@/types/tournament";

import { describe, expect, it } from "vitest";

import { advanceByTime, skipLevel } from "@/utils/transitions";

const START = new Date("2026-01-01T12:00:00Z");
const NOW = new Date("2026-01-01T12:07:00Z"); // 420 seconds after START

// Each level has its own duration, so inheriting the wrong one shows up.
const tournament = (over: Partial<TournamentState> = {}): TournamentState => ({
  config: {
    name: "T",
    levelDuration: 99,
    breakInterval: 2,
    breakDuration: 5,
    primaryColor: "#FF6B6B",
    blindStructure: [
      { level: 1, smallBlind: 25, bigBlind: 50, duration: 20 },
      { level: 2, smallBlind: 50, bigBlind: 100, duration: 15 },
      { level: 3, smallBlind: 75, bigBlind: 150, duration: 10 },
      { level: 4, smallBlind: 100, bigBlind: 200, duration: 30 },
    ],
  },
  currentLevel: 1,
  timeRemaining: 780,
  isRunning: true,
  isBreak: false,
  history: [],
  startTime: START,
  ...over,
});

const paused = (over: Partial<TournamentState> = {}) =>
  tournament({
    isRunning: false,
    timeRemaining: 300,
    pausedTimeRemaining: 300,
    ...over,
  });

const secondsAfterStart = (seconds: number) =>
  new Date(START.getTime() + seconds * 1000);

describe("advanceByTime", () => {
  it("counts down from the current time without a transition", () => {
    const { state, transitioned } = advanceByTime(
      tournament(),
      secondsAfterStart(60),
    );

    expect(transitioned).toBe(false);
    expect(state.currentLevel).toBe(1);
    expect(state.timeRemaining).toBe(1140);
    expect(state.history).toEqual([]);
  });

  it("leaves a paused tournament untouched, however much time has passed", () => {
    const before = paused();
    const { state, transitioned } = advanceByTime(
      before,
      secondsAfterStart(99 * 3600),
    );

    expect(transitioned).toBe(false);
    expect(state).toBe(before);
  });

  it("starts the next level when the time runs out and records the finished one", () => {
    const end = secondsAfterStart(1200);
    const { state, transitioned } = advanceByTime(tournament(), end);

    expect(transitioned).toBe(true);
    expect(state.currentLevel).toBe(2);
    expect(state.timeRemaining).toBe(900);
    expect(state.startTime).toEqual(end);
    expect(state.history).toEqual([
      {
        level: 1,
        smallBlind: 25,
        bigBlind: 50,
        startTime: START,
        endTime: end,
        duration: 20,
      },
    ]);
  });

  it("starts a due break when the level's time runs out", () => {
    const { state, transitioned } = advanceByTime(
      tournament({ currentLevel: 2 }),
      secondsAfterStart(900),
    );

    expect(transitioned).toBe(true);
    expect(state.isBreak).toBe(true);
    expect(state.currentLevel).toBe(2);
    expect(state.timeRemaining).toBe(300);
    expect(state.history.map((h) => h.level)).toEqual([2]);
  });

  it("counts a break down by the break's own length", () => {
    const { state, transitioned } = advanceByTime(
      tournament({ currentLevel: 2, isBreak: true }),
      secondsAfterStart(60),
    );

    expect(transitioned).toBe(false);
    expect(state.timeRemaining).toBe(240);
  });

  it("starts the next level when a break's time runs out, adding nothing to the history", () => {
    const { state, transitioned } = advanceByTime(
      tournament({ currentLevel: 2, isBreak: true }),
      secondsAfterStart(300),
    );

    expect(transitioned).toBe(true);
    expect(state.isBreak).toBe(false);
    expect(state.currentLevel).toBe(3);
    expect(state.timeRemaining).toBe(600);
    expect(state.history).toEqual([]);
  });

  it("does not mutate the state it receives", () => {
    const before = tournament();
    const copy = structuredClone(before);

    advanceByTime(before, secondsAfterStart(1200));
    skipLevel(before, NOW);

    expect(before).toEqual(copy);
  });
});

describe("skipLevel while paused", () => {
  it("gives the next level its full time and stays paused", () => {
    const { state, transitioned } = skipLevel(paused(), NOW);

    expect(transitioned).toBe(true);
    expect(state.currentLevel).toBe(2);
    expect(state.isRunning).toBe(false);
    expect(state.timeRemaining).toBe(900);
    expect(state.pausedTimeRemaining).toBe(900);
  });

  it("enters a due break with the break's own length, never the paused time", () => {
    const { state, transitioned } = skipLevel(
      paused({ currentLevel: 2, timeRemaining: 800, pausedTimeRemaining: 800 }),
      NOW,
    );

    expect(transitioned).toBe(true);
    expect(state.isBreak).toBe(true);
    expect(state.currentLevel).toBe(2);
    expect(state.isRunning).toBe(false);
    expect(state.timeRemaining).toBe(300);
    expect(state.pausedTimeRemaining).toBe(300);
  });

  it("leaves a break into the next level with its full time and stays paused", () => {
    const { state } = skipLevel(
      paused({ currentLevel: 2, isBreak: true }),
      NOW,
    );

    expect(state.isBreak).toBe(false);
    expect(state.currentLevel).toBe(3);
    expect(state.isRunning).toBe(false);
    expect(state.timeRemaining).toBe(600);
    expect(state.pausedTimeRemaining).toBe(600);
  });
});

describe("skipLevel while running", () => {
  it("gives the next level its full time without creating a paused time", () => {
    const { state, transitioned } = skipLevel(tournament(), NOW);

    expect(transitioned).toBe(true);
    expect(state.currentLevel).toBe(2);
    expect(state.isRunning).toBe(true);
    expect(state.timeRemaining).toBe(900);
    expect(state.startTime).toEqual(NOW);
    expect(state.pausedTimeRemaining).toBeUndefined();
  });

  it("enters a due break with the break's full time", () => {
    const { state } = skipLevel(tournament({ currentLevel: 2 }), NOW);

    expect(state.isBreak).toBe(true);
    expect(state.currentLevel).toBe(2);
    expect(state.timeRemaining).toBe(300);
    expect(state.startTime).toEqual(NOW);
  });
});

describe("skipLevel and the history", () => {
  it("records the skipped level, including when it leads to a break", () => {
    const { state } = skipLevel(tournament({ currentLevel: 2 }), NOW);

    expect(state.history).toEqual([
      {
        level: 2,
        smallBlind: 50,
        bigBlind: 100,
        startTime: START,
        endTime: NOW,
        duration: 15,
      },
    ]);
  });

  it("records a level skipped while paused", () => {
    const { state } = skipLevel(paused(), NOW);

    expect(state.history.map((h) => h.level)).toEqual([1]);
  });

  it("records nothing when leaving a break, since that level is already there", () => {
    const earlier = {
      level: 2,
      smallBlind: 50,
      bigBlind: 100,
      startTime: START,
      endTime: START,
      duration: 15,
    };
    const { state } = skipLevel(
      tournament({ currentLevel: 2, isBreak: true, history: [earlier] }),
      NOW,
    );

    expect(state.history).toEqual([earlier]);
  });
});
