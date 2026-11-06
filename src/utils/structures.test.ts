import { describe, expect, it } from "vitest";

import {
  STRUCTURE_NAMES,
  blindLevels,
  buildStructure,
  deduceStructure,
  structureDuration,
} from "@/utils/structures";

const smallBlinds = (name: (typeof STRUCTURE_NAMES)[number]) =>
  buildStructure(name, 20).map((level) => level.smallBlind);

describe("structures", () => {
  it("each structure brings its own level duration", () => {
    expect(structureDuration("small")).toBe(20);
    expect(structureDuration("medium")).toBe(20);
    expect(structureDuration("large")).toBe(20);
    expect(structureDuration("turbo")).toBe(10);
  });

  it("builds the levels of each structure with the duration given", () => {
    const shapes = STRUCTURE_NAMES.map((name) => {
      const levels = buildStructure(name, 15);

      return [name, levels.length, levels[0].smallBlind, levels[0].bigBlind];
    });

    expect(shapes).toEqual([
      ["small", 15, 25, 50],
      ["medium", 20, 50, 100],
      ["large", 25, 100, 200],
      ["turbo", 12, 25, 50],
    ]);
    expect(buildStructure("medium", 15).every((l) => l.duration === 15)).toBe(true);
    expect(buildStructure("medium", 15).map((l) => l.level).slice(0, 3)).toEqual([1, 2, 3]);
  });

  it("the big blind is always twice the small blind", () => {
    const levels = buildStructure("large", 20);

    expect(levels.every((l) => l.bigBlind === l.smallBlind * 2)).toBe(true);
  });

  it("large levels 21 to 25 are 1536x, 2048x, 3072x, 4096x and 6144x the first blind", () => {
    expect(smallBlinds("large").slice(20)).toEqual(
      [1536, 2048, 3072, 4096, 6144].map((x) => x * 100),
    );
  });

  it("keeps the first 20 levels of the known progression", () => {
    expect(smallBlinds("medium")).toEqual(
      [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024].map(
        (x) => x * 50,
      ),
    );
  });

  it.each(STRUCTURE_NAMES)("no jump between levels exceeds 2x in %s", (name) => {
    const blinds = smallBlinds(name);
    const jumps = blinds.slice(1).map((blind, i) => blind / blinds[i]);

    expect(Math.max(...jumps)).toBeLessThanOrEqual(2);
  });

  it("blindLevels builds any number of levels from a first blind", () => {
    expect(blindLevels(10, 3, 5)).toEqual([
      { level: 1, smallBlind: 10, bigBlind: 20, duration: 5 },
      { level: 2, smallBlind: 20, bigBlind: 40, duration: 5 },
      { level: 3, smallBlind: 30, bigBlind: 60, duration: 5 },
    ]);
  });

  it.each(STRUCTURE_NAMES)("deduces %s from its levels, whatever their duration", (name) => {
    expect(deduceStructure(buildStructure(name, 7))).toBe(name);
  });

  it("deduces from levels saved by older versions, with other blinds past level 20", () => {
    const old = buildStructure("large", 20).map((level, i) =>
      i < 20 ? level : { ...level, smallBlind: Math.round(100 * 1.5 ** i) },
    );

    expect(deduceStructure(old)).toBe("large");
  });

  it("falls back to medium when nothing matches", () => {
    expect(deduceStructure(blindLevels(25, 20, 20))).toBe("medium");
    expect(deduceStructure(blindLevels(30, 15, 20))).toBe("medium");
    expect(deduceStructure([])).toBe("medium");
  });
});
