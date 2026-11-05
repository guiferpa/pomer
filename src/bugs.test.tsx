// Each test asserts the CORRECT behaviour. `it.fails` marks a bug still open:
// when the bug is fixed the test turns red until the marker is removed.
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
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

const seed = (over: Record<string, unknown>) =>
  localStorage.setItem(
    KEY,
    JSON.stringify({
      config: cfg(5, 10),
      currentLevel: 1,
      timeRemaining: 60,
      isRunning: true,
      isBreak: false,
      history: [],
      startTime: new Date().toISOString(),
      ...over,
    }),
  );

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

  it.fails("T3 last level finishing does not repeat it forever", () => {
    const { result } = renderHook(() => useTournament());
    act(() => result.current.startTournament(cfg(2, 10)));
    tick(60 * 4 + 5);
    const levels = result.current.state.history.map((h) => h.level);
    expect(new Set(levels).size).toBe(levels.length);
  });

  it.fails("T4 currentLevel never goes past the structure when the last level ends in a break", () => {
    const { result } = renderHook(() => useTournament());
    act(() => result.current.startTournament(cfg(3, 3)));
    tick(60 * 3 + 60 + 10);
    expect(result.current.state.currentLevel).toBeLessThanOrEqual(3);
  });

  it.fails("T5 reopening after 2.25 levels of absence catches up instead of skipping one level", () => {
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

  it.fails("T7 manual skip plays the sound once", () => {
    seed({});
    render(<App />);
    fireEvent.click(nextBtn());
    flushAudio();
    expect(plays).toBe(1);
  });

  it.fails("T8 reloading mid-tournament does not ring", () => {
    seed({ currentLevel: 3 });
    render(<App />);
    flushAudio();
    expect(plays).toBe(0);
  });

  it.fails("T9 a break starting naturally rings", () => {
    seed({ config: cfg(5, 1) });
    render(<App />);
    tick(61);
    flushAudio();
    expect(plays).toBeGreaterThanOrEqual(1);
  });

  it.fails("T10 ending the last level + break does not silently drop to the config form", () => {
    seed({ config: cfg(3, 3), currentLevel: 3, isBreak: true });
    render(<App />);
    tick(62);
    expect(screen.queryByRole("button", { name: "Iniciar Torneio" })).toBeNull();
  });

  it.fails("T11 no duplicate React keys in the history after the last level repeats", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    seed({ config: cfg(2, 10), currentLevel: 2 });
    render(<App />);
    tick(125);
    const dup = errors.mock.calls.filter((c) => String(c[0]).includes("same key"));
    expect(dup.length).toBe(0);
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
