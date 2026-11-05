import type { TournamentState } from "@/types/tournament";

import { describe, expect, it } from "vitest";

import {
  advanceByTime,
  isLastLevel,
  isTimeUp,
  levelsUntilNextBreak,
  repairSavedState,
  skipLevel,
} from "@/utils/transitions";

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
  timeRemaining: 1200,
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

// Level 1 ends at 1200s, level 2 at 2100s, its break at 2400s, level 3 at 3000s
// and level 4, the last one, at 4800s.
describe("advanceByTime after an absence", () => {
  const entry = (
    level: number,
    smallBlind: number,
    duration: number,
    from: number,
    to: number,
  ) => ({
    level,
    smallBlind,
    bigBlind: smallBlind * 2,
    startTime: secondsAfterStart(from),
    endTime: secondsAfterStart(to),
    duration,
  });
  const LEVEL_1 = entry(1, 25, 20, 0, 1200);
  const LEVEL_2 = entry(2, 50, 15, 1200, 2100);
  const LEVEL_3 = entry(3, 75, 10, 2400, 3000);

  it("crosses several levels, counting the remaining time from the moment the level really began", () => {
    const { state, transitioned } = advanceByTime(
      tournament({
        config: {
          ...tournament().config,
          breakInterval: 10,
        },
      }),
      secondsAfterStart(2100 + 60),
    );

    expect(transitioned).toBe(true);
    expect(state.currentLevel).toBe(3);
    expect(state.isBreak).toBe(false);
    expect(state.timeRemaining).toBe(540);
    expect(state.startTime).toEqual(secondsAfterStart(2100));
    expect(state.history).toEqual([LEVEL_1, LEVEL_2]);
  });

  it("lands inside a break that came due during the absence", () => {
    const { state, transitioned } = advanceByTime(
      tournament(),
      secondsAfterStart(2100 + 60),
    );

    expect(transitioned).toBe(true);
    expect(state.currentLevel).toBe(2);
    expect(state.isBreak).toBe(true);
    expect(state.timeRemaining).toBe(240);
    expect(state.startTime).toEqual(secondsAfterStart(2100));
    expect(state.history).toEqual([LEVEL_1, LEVEL_2]);
  });

  it("passes through a break and lands on the level after it", () => {
    const { state } = advanceByTime(tournament(), secondsAfterStart(2700));

    expect(state.currentLevel).toBe(3);
    expect(state.isBreak).toBe(false);
    expect(state.timeRemaining).toBe(300);
    expect(state.startTime).toEqual(secondsAfterStart(2400));
    expect(state.history).toEqual([LEVEL_1, LEVEL_2]);
  });

  it("starts from a break just the same", () => {
    const { state } = advanceByTime(
      tournament({ currentLevel: 2, isBreak: true }),
      secondsAfterStart(1000),
    );

    // The break ends at 300s and level 3 at 900s.
    expect(state.currentLevel).toBe(4);
    expect(state.timeRemaining).toBe(1700);
    expect(state.startTime).toEqual(secondsAfterStart(900));
    expect(state.history).toEqual([entry(3, 75, 10, 300, 900)]);
  });

  it("gives the full time when it lands exactly where a level begins", () => {
    const { state } = advanceByTime(tournament(), secondsAfterStart(3000));

    expect(state.currentLevel).toBe(4);
    expect(state.timeRemaining).toBe(1800);
    expect(state.startTime).toEqual(secondsAfterStart(3000));
  });

  it("does not reach the next level one second before it begins", () => {
    const { state } = advanceByTime(tournament(), secondsAfterStart(2999));

    expect(state.currentLevel).toBe(3);
    expect(state.timeRemaining).toBe(1);
  });

  it.each([
    ["exactly when the last level ends", 4800],
    ["long after the last level ends", 99 * 3600],
  ])("stops on the last level at 00:00 %s", (_, seconds) => {
    const { state, transitioned } = advanceByTime(
      tournament(),
      secondsAfterStart(seconds),
    );

    expect(transitioned).toBe(true);
    expect(state.currentLevel).toBe(4);
    expect(state.isBreak).toBe(false);
    expect(state.isRunning).toBe(true);
    expect(state.timeRemaining).toBe(0);
    expect(state.startTime).toEqual(secondsAfterStart(3000));
    expect(state.history).toEqual([LEVEL_1, LEVEL_2, LEVEL_3]);
    expect(isTimeUp(state)).toBe(true);
  });

  it("adds to the history it already has", () => {
    const { state } = advanceByTime(
      tournament({ currentLevel: 2, history: [LEVEL_1] }),
      secondsAfterStart(900),
    );

    expect(state.history.map((h) => h.level)).toEqual([1, 2]);
  });

  it("gets to the same place whether the time passed all at once or tick by tick", () => {
    let ticked = tournament();

    for (let second = 1; second <= 2700; second++) {
      ticked = advanceByTime(ticked, secondsAfterStart(second)).state;
    }

    expect(advanceByTime(tournament(), secondsAfterStart(2700)).state).toEqual(
      ticked,
    );
  });

  describe("with the clock moved backwards", () => {
    const BEFORE_START = secondsAfterStart(-3600);
    // 10:00 left of the 20-minute level at 12:10.
    const tenMinutesLeft = () => tournament({ timeRemaining: 600 });
    // 02:00 left of the 5-minute break at 12:03.
    const twoMinutesOfBreakLeft = () =>
      tournament({ currentLevel: 2, isBreak: true, timeRemaining: 120 });

    it.each([
      ["still after the level began", secondsAfterStart(300)],
      ["to before the level began", BEFORE_START],
    ])("keeps the level's time when the clock goes back %s", (_, now) => {
      const { state, transitioned } = advanceByTime(tenMinutesLeft(), now);

      expect(transitioned).toBe(false);
      expect(state.currentLevel).toBe(1);
      expect(state.timeRemaining).toBe(600);
      expect(state.history).toEqual([]);
    });

    it.each([
      ["still after the break began", secondsAfterStart(60)],
      ["to before the break began", BEFORE_START],
    ])("keeps the break's time when the clock goes back %s", (_, now) => {
      const { state, transitioned } = advanceByTime(
        twoMinutesOfBreakLeft(),
        now,
      );

      expect(transitioned).toBe(false);
      expect(state.isBreak).toBe(true);
      expect(state.timeRemaining).toBe(120);
    });

    it.each([
      ["a level", tenMinutesLeft, 600, secondsAfterStart(300)],
      ["a level, before it began", tenMinutesLeft, 600, BEFORE_START],
      ["a break", twoMinutesOfBreakLeft, 120, secondsAfterStart(60)],
      ["a break, before it began", twoMinutesOfBreakLeft, 120, BEFORE_START],
    ])("keeps counting from there during %s", (_, make, left, now) => {
      const moved = advanceByTime(make(), now).state;
      const later = (seconds: number) =>
        new Date(now.getTime() + seconds * 1000);

      expect(advanceByTime(moved, later(1)).state.timeRemaining).toBe(left - 1);
      expect(advanceByTime(moved, later(10)).state.timeRemaining).toBe(
        left - 10,
      );
    });

    it("ends the level when the kept time runs out, recording that moment", () => {
      const now = secondsAfterStart(300);
      const moved = advanceByTime(tenMinutesLeft(), now).state;
      const end = new Date(now.getTime() + 600 * 1000);
      const { state, transitioned } = advanceByTime(moved, end);

      expect(transitioned).toBe(true);
      expect(state.currentLevel).toBe(2);
      expect(state.timeRemaining).toBe(900);
      expect(state.history[0].endTime).toEqual(end);
    });

    it("still catches up when the clock jumps forward afterwards", () => {
      const moved = advanceByTime(
        tenMinutesLeft(),
        secondsAfterStart(300),
      ).state;
      const { state, transitioned } = advanceByTime(
        moved,
        secondsAfterStart(300 + 600 + 60),
      );

      expect(transitioned).toBe(true);
      expect(state.currentLevel).toBe(2);
      expect(state.timeRemaining).toBe(840);
    });

    it("gets back to the same place when it runs again at the same time", () => {
      const now = secondsAfterStart(300);
      const moved = advanceByTime(tenMinutesLeft(), now).state;

      expect(advanceByTime(moved, now).state).toEqual(moved);
    });

    it("does not read one second of rounding as the clock moving back", () => {
      // 601 computed against 600 saved.
      const { state } = advanceByTime(
        tenMinutesLeft(),
        secondsAfterStart(599),
      );

      expect(state.startTime).toEqual(START);
    });

    it("reads two seconds as the clock moving back", () => {
      // 602 computed against 600 saved.
      const { state } = advanceByTime(
        tenMinutesLeft(),
        secondsAfterStart(598),
      );

      expect(state.timeRemaining).toBe(600);
      expect(state.startTime).not.toEqual(START);
    });

    it("keeps the last level at 00:00", () => {
      const expired = tournament({
        currentLevel: 4,
        timeRemaining: 0,
      });
      const { state, transitioned } = advanceByTime(expired, BEFORE_START);

      expect(transitioned).toBe(false);
      expect(state).toBe(expired);
    });

    it("leaves a paused tournament untouched", () => {
      const before = paused();
      const { state, transitioned } = advanceByTime(before, BEFORE_START);

      expect(transitioned).toBe(false);
      expect(state).toBe(before);
    });
  });

  it("treats a clock moved forward as a real absence", () => {
    const { state, transitioned } = advanceByTime(
      tournament(),
      secondsAfterStart(1200 + 1),
    );

    expect(transitioned).toBe(true);
    expect(state.currentLevel).toBe(2);
    expect(state.timeRemaining).toBe(899);
  });

  it("does not mutate the state it receives while crossing levels", () => {
    const before = tournament();
    const copy = structuredClone(before);

    advanceByTime(before, secondsAfterStart(9999));

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

describe("the last level", () => {
  const onLastLevel = (over: Partial<TournamentState> = {}) =>
    tournament({ currentLevel: 4, timeRemaining: 1, ...over });
  const END_OF_LAST = secondsAfterStart(1800);

  it("stops at 00:00 keeping the level, reporting it as a transition exactly once", () => {
    const { state, transitioned } = advanceByTime(onLastLevel(), END_OF_LAST);

    expect(transitioned).toBe(true);
    expect(state.currentLevel).toBe(4);
    expect(state.isBreak).toBe(false);
    expect(state.isRunning).toBe(true);
    expect(state.timeRemaining).toBe(0);
    expect(state.startTime).toEqual(START);
    expect(isTimeUp(state)).toBe(true);
  });

  it("stays put on every later tick, without a transition or a new state", () => {
    const expired = advanceByTime(onLastLevel(), END_OF_LAST).state;
    const later = advanceByTime(expired, secondsAfterStart(99 * 3600));

    expect(later.transitioned).toBe(false);
    expect(later.state).toBe(expired);
  });

  it("is not time up while there is time left, or on any other level at zero", () => {
    expect(isTimeUp(onLastLevel())).toBe(false);
    expect(isTimeUp(tournament({ currentLevel: 3, timeRemaining: 0 }))).toBe(
      false,
    );
    expect(
      isTimeUp(onLastLevel({ isBreak: true, timeRemaining: 0 })),
    ).toBe(false);
  });

  it("is told apart from the other levels", () => {
    expect(isLastLevel(onLastLevel())).toBe(true);
    expect(isLastLevel(tournament({ currentLevel: 3 }))).toBe(false);
    expect(isLastLevel(onLastLevel({ isBreak: true }))).toBe(false);
  });

  it("has no break after it even when its number is a multiple of the interval", () => {
    // Level 4 with breakInterval 2.
    const { state } = advanceByTime(onLastLevel(), END_OF_LAST);

    expect(state.isBreak).toBe(false);
  });

  it("does not enter the history when its time runs out", () => {
    const { state } = advanceByTime(onLastLevel(), END_OF_LAST);

    expect(state.history).toEqual([]);
  });

  it.each([
    ["running", () => onLastLevel()],
    ["paused", () => paused({ currentLevel: 4 })],
    ["at 00:00", () => advanceByTime(onLastLevel(), END_OF_LAST).state],
  ])("ignores a skip while %s", (_, make) => {
    const before = make();
    const { state, transitioned } = skipLevel(before, NOW);

    expect(transitioned).toBe(false);
    expect(state).toBe(before);
  });
});

// What the organizer sees from a correction is covered through the App, in
// bugs.test.tsx. Only what the screen cannot tell apart stays here.
describe("repairSavedState", () => {
  const entry = (level: number) => ({
    level,
    smallBlind: 25,
    bigBlind: 50,
    startTime: START,
    endTime: START,
    duration: 20,
  });
  const leftover = () =>
    tournament({
      currentLevel: 4,
      isBreak: true,
      isRunning: false,
      pausedTimeRemaining: 30,
      history: [entry(1), entry(1), entry(4)],
    });

  it("returns the very same state when there is nothing to correct", () => {
    const clean = tournament({ currentLevel: 2, history: [entry(1)] });

    expect(repairSavedState(clean, NOW)).toBe(clean);
  });

  it.each([
    ["a different time", 299],
    ["no time at all", undefined],
  ])("makes a paused state with %s resume from the time on screen", (_, stale) => {
    const repaired = repairSavedState(
      paused({ timeRemaining: 1200, pausedTimeRemaining: stale }),
      NOW,
    );

    expect(repaired.timeRemaining).toBe(1200);
    expect(repaired.pausedTimeRemaining).toBe(1200);
  });

  it("keeps the correction of a stale pause idempotent", () => {
    const once = repairSavedState(
      paused({ timeRemaining: 1200, pausedTimeRemaining: 299 }),
      NOW,
    );

    expect(repairSavedState(once, NOW)).toBe(once);
  });

  it("leaves a running state's missing paused time alone", () => {
    const running = tournament();

    expect(repairSavedState(running, NOW)).toBe(running);
  });

  it("leaves a screen without a tournament alone", () => {
    const empty = tournament({
      config: { ...tournament().config, blindStructure: [] },
      isRunning: false,
      timeRemaining: 0,
      startTime: undefined,
    });

    expect(repairSavedState(empty, NOW)).toBe(empty);
  });

  it("changes nothing when run again, even later", () => {
    const once = repairSavedState(leftover(), NOW);

    expect(repairSavedState(once, secondsAfterStart(99 * 3600))).toBe(once);
  });

  it("does not mutate the state it receives", () => {
    const before = leftover();
    const copy = structuredClone(before);

    repairSavedState(before, NOW);

    expect(before).toEqual(copy);
  });

  it("reports no transition from the corrected 00:00, so no alert can follow", () => {
    const { transitioned } = advanceByTime(
      repairSavedState(leftover(), NOW),
      secondsAfterStart(99 * 3600),
    );

    expect(transitioned).toBe(false);
  });
});

// Real walks through the structure, so what the break card promises is compared
// against the breaks that actually happen.
describe("across structures and break intervals", () => {
  const structureSizes = [1, 2, 3, 4, 5, 6, 12, 15, 20, 25];
  const intervals = [1, 2, 3, 4, 5, 6, 7, 10, 12, 15, 20, 25, 30, 40, 50];

  const started = (levels: number, breakInterval: number): TournamentState => {
    const base = tournament();

    return tournament({
      config: {
        ...base.config,
        breakInterval,
        blindStructure: Array.from({ length: levels }, (_, i) => ({
          level: i + 1,
          smallBlind: 25 * (i + 1),
          bigBlind: 50 * (i + 1),
          duration: 10,
        })),
      },
    });
  };

  // Lets each level or break run out, recording every state on the way.
  const walk = (first: TournamentState) => {
    const states = [first];
    let current = first;

    while (!isTimeUp(current)) {
      const seconds = current.isBreak ? 300 : 600;
      const end = new Date(current.startTime!.getTime() + seconds * 1000);

      current = advanceByTime(current, end).state;
      states.push(current);

      if (states.length > 200) throw new Error("the tournament never ended");
    }

    return states;
  };

  const cases = structureSizes.flatMap((levels) =>
    intervals.map((interval) => [levels, interval] as const),
  );

  it.each(cases)(
    "%i levels, a break every %i: ends on the last level, one history entry per finished level",
    (levels, interval) => {
      const states = walk(started(levels, interval));
      const end = states[states.length - 1];

      expect(states.every((s) => s.currentLevel <= levels)).toBe(true);
      expect(
        states.filter((s) => s.isBreak && s.currentLevel === levels),
      ).toEqual([]);
      expect(end.currentLevel).toBe(levels);
      expect(end.timeRemaining).toBe(0);
      expect(end.history.map((h) => h.level)).toEqual(
        Array.from({ length: levels - 1 }, (_, i) => i + 1),
      );
    },
  );

  it.each(cases)(
    "%i levels, a break every %i: the card matches the breaks that really happen",
    (levels, interval) => {
      const states = walk(started(levels, interval));

      states.forEach((state, i) => {
        if (state.isBreak) return;

        const nextBreak = states.slice(i + 1).find((s) => s.isBreak);
        const expected = nextBreak
          ? nextBreak.currentLevel - state.currentLevel + 1
          : null;

        expect(levelsUntilNextBreak(state)).toBe(expected);
      });
    },
  );

  it("answers the worked examples", () => {
    const at = (levels: number, interval: number, currentLevel: number) =>
      levelsUntilNextBreak({ ...started(levels, interval), currentLevel });

    // Second-to-last level: the card used to promise a break in 2 levels.
    expect(at(4, 2, 3)).toBeNull();
    expect(at(5, 2, 3)).toBe(2);
    expect(at(5, 2, 4)).toBe(1);
    expect(at(5, 2, 5)).toBeNull();
    // The interval equals the level count, or is a multiple of it.
    expect(at(6, 6, 1)).toBeNull();
    expect(at(6, 12, 1)).toBeNull();
    // The level count is a multiple of the interval.
    expect(at(6, 3, 1)).toBe(3);
    expect(at(6, 3, 3)).toBe(1);
    expect(at(6, 3, 4)).toBeNull();
    expect(at(6, 3, 6)).toBeNull();
  });
});
