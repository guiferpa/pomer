// Each test asserts the CORRECT behaviour. `it.fails` marks a bug still open:
// when the bug is fixed the test turns red until the marker is removed.
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { Fragment, StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import { ConfigForm } from "@/components/form-config";
import { I18nProvider } from "@/contexts/I18nContext";
import { useTournament } from "@/hooks/useTournament";
import { useWakeLock } from "@/hooks/useWakeLock";
import { generateBlindLevels } from "@/utils/helpers";

const KEY = "pomer-tournament-state";
let plays = 0;

const cfg = (levels: number, breakInterval: number, duration = 1, breakDuration = 1) => ({
  name: "T",
  levelDuration: duration,
  breakInterval,
  breakDuration,
  blindStructure: generateBlindLevels(25, levels, duration),
  primaryColor: "#FF6B6B",
});

const seed = (over: Record<string, any>) => {
  const { config = cfg(5, 10), currentLevel = 1, isBreak = false } = over;
  const fullTime =
    (isBreak
      ? config.breakDuration
      : (config.blindStructure[currentLevel - 1]?.duration ?? 0)) * 60;

  localStorage.setItem(
    KEY,
    JSON.stringify({
      config,
      currentLevel,
      timeRemaining: fullTime,
      isRunning: true,
      isBreak,
      history: [],
      startTime: new Date().toISOString(),
      ...over,
    }),
  );
};

// One act per second, as the real interval would fire.
const tick = (seconds: number) => {
  for (let i = 0; i < seconds; i++) act(() => void vi.advanceTimersByTime(1000));
};
const flushAudio = () => act(() => void vi.advanceTimersByTime(200));

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-01-01T12:00:00Z") });
  localStorage.clear();
  localStorage.setItem("pomer-language", "pt");
  plays = 0;
  vi.stubGlobal(
    "Audio",
    class {
      volume = 1; preload = ""; src = "";
      load() {}
      play() { plays++; return Promise.resolve(); }
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
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (window as any).gtag;
  delete (navigator as any).wakeLock;
});

describe("useTournament", () => {
  it("T1 skipping a level while paused gives the new level its full time on resume", () => {
    const { result } = renderHook(() => useTournament());
    act(() => result.current.startTournament(cfg(5, 10, 20)));
    tick(15 * 60);
    act(() => result.current.toggleTournament()); // pause with 05:00 left
    act(() => result.current.nextLevel());
    act(() => result.current.toggleTournament()); // resume
    tick(1);
    expect(result.current.state.currentLevel).toBe(2);
    expect(result.current.state.timeRemaining).toBeGreaterThan(19 * 60);
  });

  it("T2 skipping into a break while paused never shows more than the break length", () => {
    const { result } = renderHook(() => useTournament());
    act(() => result.current.startTournament(cfg(5, 1, 20, 10)));
    tick(60);
    act(() => result.current.toggleTournament()); // pause with 19:00 left
    act(() => result.current.nextLevel()); // into 10-minute break
    act(() => result.current.toggleTournament());
    tick(1);
    expect(result.current.state.isBreak).toBe(true);
    expect(result.current.state.timeRemaining).toBeLessThanOrEqual(10 * 60);
  });

  it("skipping while paused survives a refresh in the same saved format", () => {
    const first = renderHook(() => useTournament());
    act(() => first.result.current.startTournament(cfg(5, 10, 20)));
    tick(60);
    act(() => first.result.current.toggleTournament());
    act(() => first.result.current.nextLevel());
    first.unmount();

    expect(Object.keys(JSON.parse(localStorage.getItem(KEY)!)).sort()).toEqual([
      "config",
      "currentLevel",
      "history",
      "isBreak",
      "isRunning",
      "pausedTimeRemaining",
      "startTime",
      "timeRemaining",
    ]);

    tick(300); // time passing while closed must not count
    const { result } = renderHook(() => useTournament());
    expect(result.current.state.currentLevel).toBe(2);
    expect(result.current.state.isRunning).toBe(false);
    expect(result.current.state.timeRemaining).toBe(1200);
    expect(result.current.state.history.map((h) => h.level)).toEqual([1]);

    act(() => result.current.toggleTournament());
    tick(1);
    expect(result.current.state.timeRemaining).toBe(1199);
  });

  it("T3 last level finishing does not repeat it forever", () => {
    const { result } = renderHook(() => useTournament());
    act(() => result.current.startTournament(cfg(2, 10)));
    tick(60 * 4 + 5);
    const levels = result.current.state.history.map((h) => h.level);
    expect(new Set(levels).size).toBe(levels.length);
  });

  it("T4 currentLevel never goes past the structure when the last level ends in a break", () => {
    const { result } = renderHook(() => useTournament());
    act(() => result.current.startTournament(cfg(3, 3)));
    tick(60 * 3 + 60 + 10);
    expect(result.current.state.currentLevel).toBeLessThanOrEqual(3);
  });

  it("T5 reopening after 2.25 levels of absence catches up instead of skipping one level", () => {
    seed({
      config: cfg(5, 10, 20),
      startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    });
    const { result } = renderHook(() => useTournament());
    tick(2);
    expect(result.current.state.currentLevel).toBe(3);
    expect(result.current.state.timeRemaining).toBeLessThan(16 * 60);
  });
});

describe("generateBlindLevels", () => {
  it.fails("T6 blinds never jump more than 2x between levels (large structure, 25 levels)", () => {
    const s = generateBlindLevels(100, 25, 20);
    const jumps = s.slice(1).map((l, i) => l.smallBlind / s[i].smallBlind);
    expect(Math.max(...jumps)).toBeLessThanOrEqual(2);
  });
});

describe("App integration", () => {
  const nextBtn = () => screen.getByRole("button", { name: "Próximo Nível" });

  it("T7 manual skip plays the sound once", () => {
    seed({});
    render(<App />);
    fireEvent.click(nextBtn());
    flushAudio();
    expect(plays).toBe(1);
  });

  it("T8 reloading mid-tournament does not ring", () => {
    seed({ currentLevel: 3 });
    render(<App />);
    flushAudio();
    expect(plays).toBe(0);
  });

  it("T9 a break starting naturally rings", () => {
    seed({ config: cfg(5, 1) });
    render(<App />);
    tick(61);
    flushAudio();
    expect(plays).toBeGreaterThanOrEqual(1);
  });

  it("T10 ending the last level + break does not silently drop to the config form", () => {
    seed({ config: cfg(3, 3), currentLevel: 3, isBreak: true });
    render(<App />);
    tick(62);
    expect(screen.queryByRole("button", { name: "Iniciar Torneio" })).toBeNull();
  });

  it("T11 the history has no duplicates and leaves out the last level", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    seed({ config: cfg(3, 10) });
    render(<App />);
    tick(60 * 3 + 125);
    const dup = errors.mock.calls.filter((c) => String(c[0]).includes("same key"));
    expect(dup.length).toBe(0);
    const saved = JSON.parse(localStorage.getItem(KEY)!);
    expect(saved.history.map((h: { level: number }) => h.level)).toEqual([1, 2]);
  });

  it.fails("T12 mounting does not send extra GA page_view config calls (index.html already sends one)", () => {
    const gtag = vi.fn();
    (window as any).gtag = gtag;
    seed({});
    render(<App />);
    expect(gtag.mock.calls.filter((c) => c[0] === "config").length).toBe(0);
  });

  it.fails("T13 the wake lock is requested once across timer ticks", async () => {
    const request = vi.fn(async () => {
      const s = new EventTarget() as any;
      s.release = vi.fn(async () => {});
      return s;
    });
    Object.defineProperty(navigator, "wakeLock", { value: { request }, configurable: true });
    seed({ config: cfg(5, 10, 20) });
    render(<App />);
    for (let i = 0; i < 5; i++) {
      await act(async () => void (await vi.advanceTimersByTimeAsync(1000)));
    }
    expect(request).toHaveBeenCalledTimes(1);
  });
});

describe("useWakeLock", () => {
  it.fails("T14 pausing while the request is in flight does not leak the lock", async () => {
    let resolve!: (s: any) => void;
    const sentinel: any = new EventTarget();
    sentinel.release = vi.fn(async () => {});
    Object.defineProperty(navigator, "wakeLock", {
      value: { request: () => new Promise((r) => (resolve = r)) },
      configurable: true,
    });
    const { rerender } = renderHook(({ enabled }) => useWakeLock({ enabled }), {
      initialProps: { enabled: true },
    });
    rerender({ enabled: false });
    await act(async () => resolve(sentinel));
    expect(sentinel.release).toHaveBeenCalled();
  });
});

describe("ConfigForm", () => {
  const saved = () => ({
    ...cfg(12, 3, 10, 5),
    name: "Saved",
    primaryColor: "#FF6B6B",
  });
  const renderForm = (onStart: any, initialConfig?: any) =>
    render(
      <I18nProvider>
        <ConfigForm initialConfig={initialConfig} onStart={onStart} />
      </I18nProvider>,
    );

  it.fails("T15 keeps the saved colour and structure when reopened", () => {
    const onStart = vi.fn();
    const { container } = renderForm(onStart, saved());
    fireEvent.submit(container.querySelector("form")!);
    const got = onStart.mock.calls[0][0];
    expect(got.primaryColor).toBe("#FF6B6B");
    expect(got.blindStructure.length).toBe(12);
  });

  const structureSelect = () => screen.getByRole("button", { name: /Estrutura de Blinds/ });

  // Waits for the list to close, which proves the Select handled the choice.
  const chooseStructure = async (name: RegExp) => {
    fireEvent.click(structureSelect());
    fireEvent.click(await screen.findByRole("option", { name }));
    await waitFor(() => expect(screen.queryByRole("option")).toBeNull());
  };

  const submitAfterChoosing = async (name: RegExp) => {
    vi.useRealTimers();
    const onStart = vi.fn();
    const { container } = renderForm(onStart);
    await chooseStructure(name);
    fireEvent.submit(container.querySelector("form")!);

    return onStart.mock.calls[0][0];
  };

  // C6 guards T16: `it.fails` accepts any failure, so a broken selector could
  // otherwise pass for bug 6.
  it("C6 choosing Turbo yields its 12 levels", async () => {
    const got = await submitAfterChoosing(/Turbo/);
    expect(got.blindStructure.length).toBe(12);
  });

  it.fails("T16 choosing Turbo yields 10-minute levels, as its label promises", async () => {
    const got = await submitAfterChoosing(/Turbo/);
    expect(got.blindStructure[0].duration).toBe(10);
  });

  it("T18 re-clicking the already selected structure does not crash the form", async () => {
    vi.useRealTimers();
    const onStart = vi.fn();
    const { container } = renderForm(onStart);
    expect(structureSelect().textContent).toContain("Médio");
    await chooseStructure(/Médio/);
    expect(structureSelect().textContent).toContain("Médio");
    fireEvent.submit(container.querySelector("form")!);
    expect(onStart.mock.calls[0][0].blindStructure.length).toBe(20);
  });

  it.fails("T17 a number field can be cleared while typing", () => {
    renderForm(vi.fn());
    const [duration] = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    fireEvent.change(duration, { target: { value: "" } });
    expect(duration.value).toBe("");
  });
});

describe("last level screen", () => {
  const button = (name: string) => screen.getByRole("button", { name });
  const isDisabled = (name: string) => button(name).hasAttribute("disabled");
  const form = () => screen.queryByRole("button", { name: "Iniciar Torneio" });
  const onLastLevel = (over: Record<string, unknown> = {}) =>
    seed({ config: cfg(3, 10), currentLevel: 3, ...over });

  it("shows the last level from its first second, with skip disabled and pause available", () => {
    onLastLevel();
    render(<App />);
    expect(screen.getByText("Último nível")).toBeTruthy();
    expect(isDisabled("Próximo Nível")).toBe(true);
    expect(isDisabled("Pausar")).toBe(false);
    expect(screen.queryByText("Tempo esgotado")).toBeNull();
  });

  it("makes the reset stand out only at 00:00, when it is the only way to end", () => {
    const reset = () => screen.getByRole("button", { name: "Reset" });

    seed({ config: cfg(3, 10), currentLevel: 3 });
    render(<App />);
    expect(reset().className).toContain("button--danger-soft");
    tick(61);
    expect(screen.getByText("Tempo esgotado")).toBeTruthy();
    expect(reset().className).toMatch(/button--danger(\s|$)/);
  });

  it("keeps skip available and does not announce the last level before it", () => {
    seed({ config: cfg(3, 10), currentLevel: 2 });
    render(<App />);
    expect(screen.queryByText("Último nível")).toBeNull();
    expect(isDisabled("Próximo Nível")).toBe(false);
  });

  it("does not announce the last level during a break before it", () => {
    seed({ config: cfg(3, 2), currentLevel: 2, isBreak: true });
    render(<App />);
    expect(screen.queryByText("Último nível")).toBeNull();
    expect(isDisabled("Próximo Nível")).toBe(false);
  });

  it("stops at 00:00 keeping the blinds and showing the time is up", () => {
    onLastLevel();
    render(<App />);
    tick(61);
    expect(screen.getByText("00:00")).toBeTruthy();
    expect(screen.getByText("Tempo esgotado")).toBeTruthy();
    expect(screen.getByText("Último nível")).toBeTruthy();
    expect(screen.getByText("75")).toBeTruthy();
    expect(screen.getByText("150")).toBeTruthy();
    tick(120);
    expect(screen.getByText("00:00")).toBeTruthy();
    expect(screen.getByText("75")).toBeTruthy();
    expect(form()).toBeNull();
  });

  it("disables pause at 00:00 and keeps the reset, which goes back to the form", () => {
    onLastLevel();
    render(<App />);
    tick(61);
    expect(isDisabled("Pausar")).toBe(true);
    expect(isDisabled("Próximo Nível")).toBe(true);
    expect(isDisabled("Reset")).toBe(false);
    fireEvent.click(button("Reset"));
    fireEvent.click(screen.getByRole("button", { name: "Resetar" }));
    expect(form()).toBeTruthy();
  });

  it("keeps the screen on at 00:00", async () => {
    const sentinels: any[] = [];
    const request = vi.fn(async () => {
      const sentinel: any = new EventTarget();
      sentinel.release = vi.fn(async () => {});
      sentinels.push(sentinel);
      return sentinel;
    });
    Object.defineProperty(navigator, "wakeLock", { value: { request }, configurable: true });
    onLastLevel();
    render(<App />);
    for (let i = 0; i < 65; i++) {
      await act(async () => void (await vi.advanceTimersByTimeAsync(1000)));
    }
    expect(screen.getByText("Tempo esgotado")).toBeTruthy();
    expect(sentinels[sentinels.length - 1].release).not.toHaveBeenCalled();
  });

  it("restores the same 00:00 after a refresh, saved in the same format", () => {
    onLastLevel({ history: [] });
    const first = render(<App />);
    tick(61);
    const saved = localStorage.getItem(KEY)!;
    first.unmount();
    tick(600);
    render(<App />);
    expect(screen.getByText("00:00")).toBeTruthy();
    expect(screen.getByText("Tempo esgotado")).toBeTruthy();
    expect(isDisabled("Pausar")).toBe(true);
    tick(5);
    expect(localStorage.getItem(KEY)).toBe(saved);
    expect(Object.keys(JSON.parse(saved)).sort()).toEqual([
      "config",
      "currentLevel",
      "history",
      "isBreak",
      "isRunning",
      "startTime",
      "timeRemaining",
    ]);
  });

  it("ignores a pause at 00:00 even without the button", () => {
    seed({ config: cfg(1, 10) });
    const { result } = renderHook(() => useTournament());
    tick(61);
    act(() => result.current.toggleTournament());
    expect(result.current.state.isRunning).toBe(true);
    expect(result.current.state.timeRemaining).toBe(0);
  });

  it.each([
    ["pt", "Último nível", "Tempo esgotado", "Sem mais intervalos"],
    ["es", "Último nivel", "Tiempo agotado", "No hay más descansos"],
    ["en", "Last level", "Time's up", "No more breaks"],
  ])("has the new texts in %s", (language, lastLevel, timeUp, noMoreBreaks) => {
    localStorage.setItem("pomer-language", language);
    onLastLevel();
    render(<App />);
    tick(61);
    expect(screen.getByText(lastLevel)).toBeTruthy();
    expect(screen.getByText(timeUp)).toBeTruthy();
    expect(screen.getByText(noMoreBreaks)).toBeTruthy();
  });

  // Written by hand from the breaks each structure really has. "-" means no
  // other break will happen; a number is the "next break in N levels" count.
  const none = "-";
  const breakCards: [number, number, (number | string)[]][] = [
    [3, 1, [1, 1, none]],
    [4, 2, [2, 1, none, none]], // second-to-last level used to promise 2 levels
    [5, 2, [2, 1, 2, 1, none]],
    [6, 3, [3, 2, 1, none, none, none]], // last level is a multiple of the interval
    [6, 6, [none, none, none, none, none, none]], // interval equals the level count
    [6, 12, [none, none, none, none, none, none]], // interval is a multiple of it
    [12, 3, [3, 2, 1, 3, 2, 1, 3, 2, 1, none, none, none]],
    [15, 3, [3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, none, none, none]],
    [20, 3, [3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, none, none]],
    [25, 3, [3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, none]],
    [12, 4, [4, 3, 2, 1, 4, 3, 2, 1, none, none, none, none]],
    [12, 5, [5, 4, 3, 2, 1, 5, 4, 3, 2, 1, none, none]],
  ];

  it.each(breakCards)("break card with %i levels and a break every %i", (levels, interval, cards) => {
    expect(cards.length).toBe(levels);
    cards.forEach((card, i) => {
      seed({ config: cfg(levels, interval), currentLevel: i + 1 });
      const view = render(<App />);
      if (card === none) {
        expect(screen.getByText("Sem mais intervalos")).toBeTruthy();
        expect(screen.queryByText(/Duração/)).toBeNull();
        expect(screen.queryByText(/Próximo break/)).toBeNull();
      } else {
        const unit = card === 1 ? "nível" : "níveis";
        expect(screen.getByText(`Próximo break em ${card} ${unit}`)).toBeTruthy();
        expect(screen.queryByText("Sem mais intervalos")).toBeNull();
      }
      view.unmount();
    });
  });

  it("break card says a break is happening during a break", () => {
    seed({ config: cfg(4, 2), currentLevel: 2, isBreak: true });
    render(<App />);
    expect(screen.getByText("Acontecendo")).toBeTruthy();
    expect(screen.queryByText("Sem mais intervalos")).toBeNull();
  });

  // Skipping through every structure: the form never comes back, and the
  // button stops working exactly on the last level.
  const sweep = [12, 15, 20, 25].flatMap((levels) =>
    [1, 2, 3, 4, 5, 6, 7, 10, levels, levels * 2].map((interval) => [levels, interval] as const),
  );

  it.each(sweep)("skipping through %i levels with a break every %i never reaches the form", (levels, interval) => {
    seed({ config: cfg(levels, interval) });
    render(<App />);
    for (let i = 0; i < levels * 2 && !isDisabled("Próximo Nível"); i++) {
      fireEvent.click(button("Próximo Nível"));
      expect(form()).toBeNull();
    }
    const saved = JSON.parse(localStorage.getItem(KEY)!);
    expect(saved.currentLevel).toBe(levels);
    expect(saved.isBreak).toBe(false);
    expect(saved.history.length).toBe(levels - 1);
    expect(screen.getByText("Último nível")).toBeTruthy();
  });

  it.each([
    [1, 1], [2, 2], [3, 3], [3, 1], [5, 2], [6, 3], [6, 12],
  ])("letting %i levels with a break every %i run out never reaches the form", (levels, interval) => {
    seed({ config: cfg(levels, interval) });
    render(<App />);
    for (let second = 0; second < (levels * 2 + 1) * 60; second++) {
      tick(1);
      expect(form()).toBeNull();
    }
    expect(screen.getByText("Tempo esgotado")).toBeTruthy();
  });
});

describe("tournaments saved by older versions", () => {
  const button = (name: string) => screen.getByRole("button", { name });
  const isDisabled = (name: string) => button(name).hasAttribute("disabled");
  const form = () => screen.queryByRole("button", { name: "Iniciar Torneio" });
  const saved = () => JSON.parse(localStorage.getItem(KEY)!);
  const savedLevels = () => saved().history.map((h: { level: number }) => h.level);

  const finished = (level: number, minutesAgo = 0) => ({
    level,
    smallBlind: 25,
    bigBlind: 50,
    startTime: new Date(Date.now() - (minutesAgo + 1) * 60000).toISOString(),
    endTime: new Date(Date.now() - minutesAgo * 60000).toISOString(),
    duration: 1,
  });

  // Older versions recorded the last level before entering the break after it.
  const leftoverBreak = (over: Record<string, unknown> = {}) =>
    seed({
      config: cfg(3, 3),
      currentLevel: 3,
      isBreak: true,
      timeRemaining: 40,
      startTime: new Date(Date.now() - 20000).toISOString(),
      history: [finished(1, 2), finished(2, 1), finished(3)],
      ...over,
    });
  const leftoverBreakPaused = () =>
    leftoverBreak({ isRunning: false, pausedTimeRemaining: 40 });

  it.each([
    ["running", leftoverBreak],
    ["paused", leftoverBreakPaused],
  ])("a break after the last level, %s, opens on the last level at 00:00", (_, seedIt) => {
    seedIt();
    render(<App />);
    expect(form()).toBeNull();
    expect(screen.getByText("00:00")).toBeTruthy();
    expect(screen.getByText("Tempo esgotado")).toBeTruthy();
    expect(screen.getByText("Último nível")).toBeTruthy();
    expect(screen.getByText("75")).toBeTruthy();
    expect(screen.getByText("150")).toBeTruthy();
    expect(isDisabled("Pausar")).toBe(true);
    expect(isDisabled("Próximo Nível")).toBe(true);
    expect(isDisabled("Reset")).toBe(false);
    tick(120);
    expect(screen.getByText("00:00")).toBeTruthy();
    expect(form()).toBeNull();
  });

  it("a duplicated history keeps one entry per level, the first one, in order", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const first = finished(1, 9);
    seed({
      config: cfg(5, 10),
      currentLevel: 3,
      history: [first, finished(1, 7), finished(2, 5), finished(2, 3)],
    });
    render(<App />);
    expect(screen.getAllByText("✓").length).toBe(2);
    expect(errors.mock.calls.filter((c) => String(c[0]).includes("same key"))).toEqual([]);
    expect(savedLevels()).toEqual([1, 2]);
    expect(saved().history[0]).toEqual(first);
  });

  it("a repeated last level leaves the history, which lists finished levels only", () => {
    seed({
      config: cfg(3, 10),
      currentLevel: 3,
      history: [finished(1, 9), finished(2, 7), finished(3, 5), finished(3, 3)],
    });
    render(<App />);
    expect(screen.getAllByText("✓").length).toBe(2);
    expect(savedLevels()).toEqual([1, 2]);
    expect(screen.queryByText("00:00")).toBeNull();
    expect(saved().timeRemaining).toBe(60);
  });

  it.each([
    ["running", leftoverBreak],
    ["paused", leftoverBreakPaused],
  ])("a break after the last level, %s, does not keep the last level in the history", (_, seedIt) => {
    seedIt();
    render(<App />);
    expect(savedLevels()).toEqual([1, 2]);
  });

  it.each([
    ["running", leftoverBreak],
    ["paused", leftoverBreakPaused],
  ])("a corrected break, %s, is stable across refreshes and keeps the saved format", (_, seedIt) => {
    seedIt();
    const first = render(<App />);
    const corrected = localStorage.getItem(KEY)!;
    first.unmount();
    tick(600);
    render(<App />);
    expect(screen.getByText("00:00")).toBeTruthy();
    expect(screen.getByText("Tempo esgotado")).toBeTruthy();
    tick(5);
    expect(localStorage.getItem(KEY)).toBe(corrected);
    expect(Object.keys(JSON.parse(corrected)).sort()).toEqual([
      "config",
      "currentLevel",
      "history",
      "isBreak",
      "isRunning",
      "startTime",
      "timeRemaining",
    ]);
  });

  it("a corrected history is stable across refreshes", () => {
    seed({ config: cfg(5, 10, 20), currentLevel: 3, timeRemaining: 1200, history: [finished(1, 9), finished(1, 7)] });
    const first = render(<App />);
    const corrected = localStorage.getItem(KEY)!;
    first.unmount();
    render(<App />);
    expect(localStorage.getItem(KEY)).toBe(corrected);
    expect(savedLevels()).toEqual([1]);
  });

  const paused = { isRunning: false, timeRemaining: 40, pausedTimeRemaining: 40 };
  const twoFinished = () => [finished(1, 3), finished(2, 1)];

  it.each<[string, () => Record<string, unknown>]>([
    ["a running level", () => ({ config: cfg(5, 10), currentLevel: 3, history: twoFinished() })],
    ["a paused level", () => ({ config: cfg(5, 10), currentLevel: 3, history: twoFinished(), ...paused })],
    ["a running break", () => ({ config: cfg(5, 2), currentLevel: 2, isBreak: true, history: twoFinished() })],
    ["a paused break", () => ({ config: cfg(5, 2), currentLevel: 2, isBreak: true, history: twoFinished(), ...paused })],
    ["the last level", () => ({ config: cfg(3, 3), currentLevel: 3, history: twoFinished() })],
    [
      "the last level at 00:00",
      () => ({
        config: cfg(3, 3),
        currentLevel: 3,
        timeRemaining: 0,
        startTime: new Date(Date.now() - 60000).toISOString(),
        history: twoFinished(),
      }),
    ],
  ])("%s without these problems opens with no change at all", (_, over) => {
    seed(over());
    const before = localStorage.getItem(KEY)!;
    render(<App />);
    expect(form()).toBeNull();
    expect(localStorage.getItem(KEY)).toBe(before);
  });

  it("a tournament that already fell to the form stays there", () => {
    seed({ config: cfg(3, 3), currentLevel: 4, history: twoFinished() });
    render(<App />);
    expect(form()).toBeTruthy();
  });

  it.each([
    ["running", leftoverBreak],
    ["paused", leftoverBreakPaused],
  ])("a correction of a break, %s, plays no alert, at load or on later ticks", (_, seedIt) => {
    seedIt();
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    flushAudio();
    tick(5);
    flushAudio();
    expect(screen.getByText("Tempo esgotado")).toBeTruthy();
    expect(plays).toBe(0);
  });

  it("a correction of the history plays no alert", () => {
    seed({ config: cfg(5, 10), currentLevel: 3, history: [finished(1, 9), finished(1, 7)] });
    render(<App />);
    flushAudio();
    expect(savedLevels()).toEqual([1]);
    expect(plays).toBe(0);
  });
});

// main.tsx uses StrictMode, which runs updaters and effects twice in development.
describe.each([
  ["without StrictMode", Fragment],
  ["under StrictMode", StrictMode],
])("alert %s", (_mode, Wrapper) => {
  const button = (name: string) => screen.getByRole("button", { name });
  const open = () =>
    render(
      <Wrapper>
        <App />
      </Wrapper>,
    );
  const refresh = (view: ReturnType<typeof open>) => {
    view.unmount();

    return open();
  };
  const heard = () => {
    flushAudio();

    return plays;
  };

  it("rings once when a level starts naturally", () => {
    seed({});
    open();
    tick(61);
    expect(heard()).toBe(1);
    expect(screen.getByText("Nível 2")).toBeTruthy();
  });

  it("rings once when a break starts naturally", () => {
    seed({ config: cfg(5, 1) });
    open();
    tick(61);
    expect(heard()).toBe(1);
    expect(screen.getByText("Acontecendo")).toBeTruthy();
  });

  it("rings once when a level starts after a break", () => {
    seed({ config: cfg(5, 1), isBreak: true });
    open();
    tick(61);
    expect(heard()).toBe(1);
    expect(screen.getByText("Nível 2")).toBeTruthy();
  });

  it("rings once per transition across a whole structure", () => {
    seed({ config: cfg(3, 1) });
    open();
    tick(4 * 60 + 10); // level 1, break, level 2, break, then level 3 running
    expect(screen.getByText("Nível 3")).toBeTruthy();
    expect(heard()).toBe(4);
  });

  it("rings once when skipping with the clock running", () => {
    seed({});
    open();
    fireEvent.click(button("Próximo Nível"));
    expect(heard()).toBe(1);
    tick(5);
    expect(heard()).toBe(1);
  });

  it("rings once when skipping with the clock paused", () => {
    seed({});
    open();
    fireEvent.click(button("Pausar"));
    fireEvent.click(button("Próximo Nível"));
    expect(heard()).toBe(1);
    expect(screen.getByText("Nível 2")).toBeTruthy();
    expect(button("Retomar")).toBeTruthy();
  });

  it("rings once when skipping into a break and once more when skipping out of it", () => {
    seed({ config: cfg(5, 1) });
    open();
    fireEvent.click(button("Próximo Nível"));
    expect(heard()).toBe(1);
    expect(screen.getByText("Acontecendo")).toBeTruthy();
    fireEvent.click(button("Próximo Nível"));
    expect(heard()).toBe(2);
    expect(screen.getByText("Nível 2")).toBeTruthy();
  });

  it("rings once on reaching 00:00 on the last level, and never again", () => {
    seed({ config: cfg(3, 10), currentLevel: 3 });
    open();
    tick(61);
    expect(screen.getByText("Tempo esgotado")).toBeTruthy();
    expect(heard()).toBe(1);
    tick(120);
    expect(heard()).toBe(1);
  });

  it.each([
    ["a level running", { currentLevel: 3 }],
    ["a level paused", { currentLevel: 3, isRunning: false, pausedTimeRemaining: 30 }],
    ["a break running", { isBreak: true }],
    ["a break paused", { isBreak: true, isRunning: false, pausedTimeRemaining: 30 }],
    ["the last level", { config: cfg(3, 10), currentLevel: 3 }],
  ])("stays silent on a refresh during %s", (_situation, over) => {
    seed(over);
    const view = open();
    tick(5);
    refresh(view);
    tick(5);
    expect(heard()).toBe(0);
  });

  it("does not replay the alert on a refresh right after a transition", () => {
    seed({});
    const view = open();
    tick(61);
    expect(heard()).toBe(1);
    refresh(view);
    tick(5);
    expect(heard()).toBe(1);
  });

  it("does not replay the alert on a refresh right after a skip", () => {
    seed({});
    const view = open();
    fireEvent.click(button("Próximo Nível"));
    refresh(view); // before the sound's delay ends and before any tick
    tick(5);
    expect(heard()).toBe(1);
  });

  it("does not replay the alert on a refresh at 00:00", () => {
    seed({ config: cfg(3, 10), currentLevel: 3 });
    const view = open();
    tick(61);
    expect(heard()).toBe(1);
    refresh(view);
    tick(5);
    expect(screen.getByText("Tempo esgotado")).toBeTruthy();
    expect(heard()).toBe(1);
  });

  it("stays silent when opening a tournament saved at 00:00", () => {
    seed({
      config: cfg(3, 10),
      currentLevel: 3,
      timeRemaining: 0,
      startTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    });
    open();
    tick(5);
    expect(screen.getByText("Tempo esgotado")).toBeTruthy();
    expect(heard()).toBe(0);
  });

  it("stays silent when starting the tournament", () => {
    const { container } = open();
    fireEvent.submit(container.querySelector("form")!);
    expect(button("Pausar")).toBeTruthy();
    tick(5);
    expect(heard()).toBe(0);
  });

  it("stays silent when pausing and resuming", () => {
    seed({});
    open();
    tick(5);
    fireEvent.click(button("Pausar"));
    tick(5);
    fireEvent.click(button("Retomar"));
    tick(5);
    expect(heard()).toBe(0);
  });

  it("stays silent when the skip button is disabled on the last level", () => {
    seed({ config: cfg(3, 10), currentLevel: 3 });
    open();
    fireEvent.click(button("Próximo Nível"));
    expect(heard()).toBe(0);
  });

  it("keeps the settings test sound button working", () => {
    seed({});
    open();
    fireEvent.click(button("Configurações"));
    fireEvent.click(button("Testar Som"));
    expect(heard()).toBe(1);
  });
});

describe("analytics", () => {
  const button = (name: string) => screen.getByRole("button", { name });
  const track = () => {
    const gtag = vi.fn();
    (window as any).gtag = gtag;
    return () => gtag.mock.calls.filter((c) => c[0] === "event");
  };

  it("sends tournament_started with the tournament name", () => {
    const events = track();
    const { container } = render(<App />);
    fireEvent.submit(container.querySelector("form")!);
    expect(events()).toEqual([
      ["event", "tournament_started", expect.objectContaining({ event_category: "Tournament", event_label: "Torneio Pomer" })],
    ]);
  });

  it("sends tournament_paused and tournament_resumed", () => {
    const events = track();
    seed({});
    render(<App />);
    fireEvent.click(button("Pausar"));
    fireEvent.click(button("Retomar"));
    expect(events().map((c) => [c[1], c[2].event_category])).toEqual([
      ["tournament_paused", "Tournament"],
      ["tournament_resumed", "Tournament"],
    ]);
  });

  it("sends level_skipped with the skipped level", () => {
    const events = track();
    seed({});
    render(<App />);
    fireEvent.click(button("Próximo Nível"));
    expect(events()).toEqual([
      ["event", "level_skipped", expect.objectContaining({ event_category: "Tournament", event_label: "Level 1" })],
    ]);
  });

  it("sends tournament_reset", () => {
    const events = track();
    seed({});
    render(<App />);
    fireEvent.click(button("Reset"));
    fireEvent.click(button("Resetar"));
    expect(events().map((c) => [c[1], c[2].event_category])).toEqual([
      ["tournament_reset", "Tournament"],
    ]);
  });

  it("sends nothing and does not break without gtag", () => {
    seed({});
    render(<App />);
    expect(() => fireEvent.click(button("Pausar"))).not.toThrow();
    expect(button("Retomar")).toBeTruthy();
  });
});

describe("back from an absence", () => {
  const button = (name: string) => screen.getByRole("button", { name });
  const minutesAgo = (minutes: number) =>
    new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const levels = () =>
    JSON.parse(localStorage.getItem(KEY)!).history.map((h: { level: number }) => h.level);
  // Ten-minute levels and five-minute breaks, a break every 2: level 1 ends at
  // 10min, level 2 at 20min, the break at 25min, level 3 at 35min, and level 4,
  // the last one, at 45min.
  const structure = () => cfg(4, 2, 10, 5);
  // The device slept: the time moved on, but no timer fired until now.
  const sleep = (minutes: number) => vi.setSystemTime(Date.now() + minutes * 60 * 1000);

  describe("opening the app", () => {
    it("lands on the right level and remaining time, with the history filled in", () => {
      seed({ config: structure(), startTime: minutesAgo(30) });
      render(<App />);
      expect(screen.getByText("Nível 3")).toBeTruthy();
      expect(screen.getByText("05:00")).toBeTruthy();
      expect(levels()).toEqual([1, 2]);
    });

    it("lands inside a break", () => {
      seed({ config: structure(), startTime: minutesAgo(22) });
      render(<App />);
      expect(screen.getByText("Acontecendo")).toBeTruthy();
      expect(screen.getByText("03:00")).toBeTruthy();
      expect(levels()).toEqual([1, 2]);
    });

    it("corrects a duplicated history before adding the levels that passed", () => {
      const first = {
        level: 1,
        smallBlind: 25,
        bigBlind: 50,
        startTime: "2026-01-01T11:00:00.000Z",
        endTime: "2026-01-01T11:10:00.000Z",
        duration: 10,
      };
      seed({
        config: structure(),
        currentLevel: 2,
        history: [first, first],
        startTime: minutesAgo(12),
      });
      render(<App />);
      expect(screen.getByText("Acontecendo")).toBeTruthy();
      expect(screen.getByText("03:00")).toBeTruthy();
      expect(levels()).toEqual([1, 2]);
    });

    it("stops on the last level at 00:00 when the absence outlasts the tournament", () => {
      seed({ config: structure(), startTime: minutesAgo(600) });
      render(<App />);
      expect(screen.getByText("Tempo esgotado")).toBeTruthy();
      expect(screen.getByText("00:00")).toBeTruthy();
      expect(levels()).toEqual([1, 2, 3]);
    });

    it("leaves a paused tournament where it was", () => {
      seed({
        config: structure(),
        startTime: minutesAgo(600),
        isRunning: false,
        timeRemaining: 120,
        pausedTimeRemaining: 120,
      });
      render(<App />);
      expect(screen.getByText("Nível 1")).toBeTruthy();
      expect(screen.getByText("02:00")).toBeTruthy();
      expect(button("Retomar")).toBeTruthy();
      expect(levels()).toEqual([]);
    });

    it.each([
      ["still after the level began", 3],
      ["to before the level began", -60],
    ])("keeps the level's time when the clock moved backwards %s", (_, minutes) => {
      seed({ config: structure(), startTime: minutesAgo(minutes), timeRemaining: 120 });
      render(<App />);
      expect(screen.getByText("Nível 1")).toBeTruthy();
      expect(screen.getByText("02:00")).toBeTruthy();
      tick(1);
      expect(screen.getByText("01:59")).toBeTruthy();
    });

    it.each([
      ["still after the break began", 1],
      ["to before the break began", -60],
    ])("keeps the break's time when the clock moved backwards %s", (_, minutes) => {
      seed({
        config: structure(),
        currentLevel: 2,
        isBreak: true,
        startTime: minutesAgo(minutes),
        timeRemaining: 120,
      });
      render(<App />);
      expect(screen.getByText("Acontecendo")).toBeTruthy();
      expect(screen.getByText("02:00")).toBeTruthy();
      tick(1);
      expect(screen.getByText("01:59")).toBeTruthy();
    });

    it("keeps the time across a reload after the clock moved backwards while closed", () => {
      seed({ config: structure() });
      const view = render(<App />);
      tick(30);
      view.unmount();
      sleep(-1);
      const reopened = render(<App />);
      expect(screen.getByText("09:30")).toBeTruthy();
      tick(1);
      expect(screen.getByText("09:29")).toBeTruthy();
      reopened.unmount();
      render(<App />);
      expect(screen.getByText("09:29")).toBeTruthy();
    });
  });

  describe("a late tick, without reloading", () => {
    it("crosses every level that passed in a single tick", () => {
      seed({ config: structure() });
      render(<App />);
      sleep(30);
      tick(1);
      expect(screen.getByText("Nível 3")).toBeTruthy();
      expect(screen.getByText("04:59")).toBeTruthy();
      expect(levels()).toEqual([1, 2]);
    });

    it("stops on the last level at 00:00 when the sleep outlasts the tournament", () => {
      seed({ config: structure() });
      render(<App />);
      sleep(600);
      tick(1);
      expect(screen.getByText("Tempo esgotado")).toBeTruthy();
      expect(levels()).toEqual([1, 2, 3]);
    });

    it("leaves a paused tournament where it was", () => {
      seed({ config: structure() });
      render(<App />);
      tick(5);
      fireEvent.click(button("Pausar"));
      sleep(600);
      tick(1);
      expect(screen.getByText("Nível 1")).toBeTruthy();
      expect(screen.getByText("09:55")).toBeTruthy();
      expect(levels()).toEqual([]);
    });

    it.each([
      ["still after the level began", 15 / 60],
      ["to before the level began", 60],
    ])("keeps the time when the clock moved backwards %s", (_, minutes) => {
      seed({ config: structure() });
      render(<App />);
      tick(30);
      sleep(-minutes);
      tick(1);
      expect(screen.getByText("Nível 1")).toBeTruthy();
      expect(screen.getByText("09:30")).toBeTruthy();
      tick(1);
      expect(screen.getByText("09:29")).toBeTruthy();
    });

    it("does not mistake a pause and resume for the clock moving backwards", () => {
      seed({ config: structure() });
      render(<App />);
      tick(30);
      fireEvent.click(button("Pausar"));
      tick(60);
      fireEvent.click(button("Retomar"));
      expect(screen.getByText("09:30")).toBeTruthy();
      tick(1);
      expect(screen.getByText("09:29")).toBeTruthy();
    });
  });

  describe.each([
    ["without StrictMode", Fragment],
    ["under StrictMode", StrictMode],
  ])("alert %s", (_mode, Wrapper) => {
    const open = () =>
      render(
        <Wrapper>
          <App />
        </Wrapper>,
      );
    const heard = () => {
      flushAudio();

      return plays;
    };

    it("rings once when reopening after several transitions, and not again", () => {
      seed({ config: structure(), startTime: minutesAgo(30) });
      const view = open();
      expect(heard()).toBe(1);
      tick(5);
      expect(heard()).toBe(1);
      view.unmount();
      open();
      tick(5);
      expect(heard()).toBe(1);
    });

    it("rings once when reopening after one transition", () => {
      seed({ config: structure(), startTime: minutesAgo(12) });
      open();
      expect(heard()).toBe(1);
    });

    it("rings once when reopening after the last level's time ran out", () => {
      seed({ config: cfg(3, 10), currentLevel: 3, startTime: minutesAgo(5) });
      open();
      expect(screen.getByText("Tempo esgotado")).toBeTruthy();
      expect(heard()).toBe(1);
      tick(5);
      expect(heard()).toBe(1);
    });

    it("rings once when several transitions pass in one late tick", () => {
      seed({ config: structure() });
      open();
      sleep(30);
      tick(1);
      expect(screen.getByText("04:59")).toBeTruthy(); // level 3, five minutes in
      expect(levels()).toEqual([1, 2]);
      expect(heard()).toBe(1);
      tick(5);
      expect(heard()).toBe(1);
    });

    it("stays silent when reopening without a transition", () => {
      seed({ config: structure(), startTime: minutesAgo(5) });
      open();
      tick(5);
      expect(heard()).toBe(0);
    });

    it("stays silent when reopening a paused tournament, however long it was closed", () => {
      seed({
        config: structure(),
        startTime: minutesAgo(600),
        isRunning: false,
        timeRemaining: 120,
        pausedTimeRemaining: 120,
      });
      open();
      tick(5);
      expect(heard()).toBe(0);
    });

    it("stays silent when the clock moved backwards", () => {
      seed({ config: structure(), startTime: minutesAgo(-60) });
      open();
      tick(5);
      expect(heard()).toBe(0);
    });

    it("shows nothing and raises no error when the browser blocks the sound", async () => {
      const blocked = vi.fn(() => Promise.reject(new Error("NotAllowedError")));
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal(
        "Audio",
        class {
          volume = 1; preload = ""; src = "";
          load() {}
          play = blocked;
        },
      );
      seed({ config: structure(), startTime: minutesAgo(30) });
      open();
      await act(async () => void (await vi.advanceTimersByTimeAsync(200)));
      expect(blocked).toHaveBeenCalledTimes(1);
      // jsdom logs its own missing canvas here, so only the sound's error counts.
      // An unhandled rejection would fail the whole run on its own.
      expect(errors.mock.calls.filter((c) => String(c[0]).includes("NotAllowedError"))).toEqual([]);
      expect(screen.getByText("Nível 3")).toBeTruthy();
    });
  });
});

// A refresh in each situation: everything the organizer sees comes back, or moves
// on by exactly the time that passed while closed.
describe("refresh", () => {
  const button = (name: string) => screen.getByRole("button", { name });
  const shows = (text: string) => expect(screen.getByText(text)).toBeTruthy();
  const saved = () => JSON.parse(localStorage.getItem(KEY)!);
  const earlier = {
    level: 1,
    smallBlind: 25,
    bigBlind: 50,
    startTime: "2026-01-01T11:00:00.000Z",
    endTime: "2026-01-01T11:10:00.000Z",
    duration: 10,
  };
  const structure = () => cfg(4, 2, 10, 5);
  const refresh = (view: ReturnType<typeof render>, seconds = 0) => {
    view.unmount();
    vi.setSystemTime(Date.now() + seconds * 1000);

    return render(<App />);
  };

  it("a level running comes back with its time, and moves on with the time closed", () => {
    seed({ config: structure(), currentLevel: 2, history: [earlier] });
    const view = render(<App />);
    tick(30);
    shows("09:30");
    refresh(view, 15);
    shows("Nível 2");
    shows("09:15");
    expect(button("Pausar")).toBeTruthy();
    expect(saved().history).toEqual([earlier]);
  });

  it("a level paused comes back exactly as it was, however long it was closed", () => {
    seed({ config: structure(), currentLevel: 2, history: [earlier] });
    const view = render(<App />);
    tick(30);
    fireEvent.click(button("Pausar"));
    const before = localStorage.getItem(KEY);
    refresh(view, 3600);
    shows("Nível 2");
    shows("09:30");
    expect(localStorage.getItem(KEY)).toBe(before);
    tick(10);
    shows("09:30");
    fireEvent.click(button("Retomar"));
    tick(1);
    shows("09:29");
  });

  it("a break running comes back with its time, and moves on with the time closed", () => {
    seed({ config: structure(), currentLevel: 2, isBreak: true, history: [earlier] });
    const view = render(<App />);
    tick(30);
    shows("04:30");
    refresh(view, 15);
    shows("Acontecendo");
    shows("04:15");
    expect(button("Pausar")).toBeTruthy();
    expect(saved().isBreak).toBe(true);
    expect(saved().history).toEqual([earlier]);
  });

  it("a break paused comes back exactly as it was, however long it was closed", () => {
    seed({ config: structure(), currentLevel: 2, isBreak: true, history: [earlier] });
    const view = render(<App />);
    tick(30);
    fireEvent.click(button("Pausar"));
    const before = localStorage.getItem(KEY);
    refresh(view, 3600);
    shows("Acontecendo");
    shows("04:30");
    expect(localStorage.getItem(KEY)).toBe(before);
    fireEvent.click(button("Retomar"));
    tick(1);
    shows("04:29");
  });

  it.each([
    ["a level", { currentLevel: 2 }],
    ["a break", { currentLevel: 2, isBreak: true }],
  ])("%s paused by an old version resumes from the time on screen", (_, over) => {
    seed({
      config: structure(),
      ...over,
      isRunning: false,
      timeRemaining: 1200,
      pausedTimeRemaining: 299,
    });
    render(<App />);
    shows("20:00");
    expect(saved().pausedTimeRemaining).toBe(1200);
    fireEvent.click(button("Retomar"));
    tick(1);
    shows("19:59");
  });

  it("the last level comes back with its time and without skip", () => {
    seed({ config: structure(), currentLevel: 4, history: [earlier] });
    const view = render(<App />);
    tick(30);
    refresh(view, 15);
    shows("Último nível");
    shows("09:15");
    expect(button("Próximo Nível").hasAttribute("disabled")).toBe(true);
    expect(button("Pausar").hasAttribute("disabled")).toBe(false);
    expect(screen.queryByText("Tempo esgotado")).toBeNull();
  });

  it("the last level at 00:00 comes back the same, with nothing rewritten", () => {
    seed({ config: structure(), currentLevel: 4, history: [earlier] });
    const view = render(<App />);
    tick(601);
    shows("Tempo esgotado");
    const before = localStorage.getItem(KEY);
    refresh(view, 3600);
    shows("00:00");
    shows("Tempo esgotado");
    shows("Último nível");
    expect(button("Pausar").hasAttribute("disabled")).toBe(true);
    expect(button("Próximo Nível").hasAttribute("disabled")).toBe(true);
    expect(localStorage.getItem(KEY)).toBe(before);
  });
});

describe("controls (must pass)", () => {
  it("C1 skipping while running gives the new level its full time", () => {
    const { result } = renderHook(() => useTournament());
    act(() => result.current.startTournament(cfg(5, 10, 20)));
    tick(60);
    act(() => result.current.nextLevel());
    expect(result.current.state.currentLevel).toBe(2);
    expect(result.current.state.timeRemaining).toBe(1200);
  });

  it("C2 pause then resume preserves the remaining time", () => {
    const { result } = renderHook(() => useTournament());
    act(() => result.current.startTournament(cfg(5, 10, 20)));
    tick(60);
    act(() => result.current.toggleTournament());
    tick(300);
    act(() => result.current.toggleTournament());
    tick(1);
    expect(result.current.state.timeRemaining).toBe(1139);
  });

  it("C3 a natural level change rings exactly once", () => {
    seed({});
    render(<App />);
    tick(61);
    flushAudio();
    expect(plays).toBe(1);
  });

  it("C4 with stable callbacks the wake lock is requested once and released on disable", async () => {
    const sentinel: any = new EventTarget();
    sentinel.release = vi.fn(async () => {});
    const request = vi.fn(async () => sentinel);
    Object.defineProperty(navigator, "wakeLock", { value: { request }, configurable: true });
    const { rerender } = renderHook(({ enabled }) => useWakeLock({ enabled }), {
      initialProps: { enabled: true },
    });
    await act(async () => {});
    rerender({ enabled: true });
    await act(async () => {});
    expect(request).toHaveBeenCalledTimes(1);
    rerender({ enabled: false });
    expect(sentinel.release).toHaveBeenCalled();
  });

  it("C5 a mid-structure break does not end the tournament", () => {
    seed({ config: cfg(5, 2), currentLevel: 2, isBreak: true });
    render(<App />);
    tick(62);
    expect(screen.queryByRole("button", { name: "Iniciar Torneio" })).toBeNull();
    expect(screen.getByRole("button", { name: "Próximo Nível" })).toBeTruthy();
  });
});
