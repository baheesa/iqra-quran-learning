import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AyahsIcon,
  BookmarkIcon,
  BookIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DuasIcon,
  FontMinusIcon,
  FontPlusIcon,
  HomeIcon,
  LearnedIcon,
  MineIcon,
  MoonIcon,
  RulesIcon,
  SearchIcon,
  SkipIcon,
  SunIcon,
  TranslateIcon,
  TrashIcon,
  WordsIcon,
} from "./lib/icons";
import {
  composeWordMeaning,
  isPunctuationToken,
} from "./lib/meanings";
import {
  exactHitsForToken,
  pickCanonicalFormMeaning,
} from "./lib/form-meaning";
import {
  highlightSearchText,
  tokenMatchesArabicForm,
  tokenMatchesSearch,
} from "./lib/highlight";
import { HighlightedText } from "./lib/HighlightedText";
import { TappableArabicText } from "./lib/TappableArabicText";
import {
  buildMatchList,
  findHitForArabicToken,
  findHitInAyah,
  suggestSearchForms,
  type AyahCard,
  type MatchItem,
  type SearchHit,
} from "./lib/quran-search";
import { KEYS, loadIds, loadJson, saveIds, saveJson } from "./lib/storage";
import {
  clearTappedWords,
  listTappedWords,
  recordTappedWord,
  removeTappedWord,
  type TappedWordRecord,
} from "./lib/tapped-words";
import type {
  CurriculumAyah,
  Dua,
  JourneyAyah,
  JuzInfo,
  LearnerRule,
  QuranPage,
  Screen,
  SurahInfo,
  VocabWord,
} from "./lib/types";
import "./styles.css";

const PAGE_COUNT = 604;
type Theme = "light" | "dark";

const DUA_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "morning-evening", label: "Morning" },
  { id: "home-chores", label: "Home" },
  { id: "worship", label: "Worship" },
  { id: "travel", label: "Travel" },
  { id: "quranic", label: "Quranic" },
] as const;

type ProgressFilter = "all" | "todo" | "done";

type WordTip = {
  id: string;
  arabic: string;
  meaning: string | null;
  ayahId: string;
};

type TipPlace = "above" | "below";

type FocusTarget = {
  ayahId: string;
  wordId?: string;
};

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed ${path}`);
  return res.json() as Promise<T>;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const next = [...items];
  let s = seed || 1;
  for (let i = next.length - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const a = next[i]!;
    next[i] = next[j]!;
    next[j] = a;
  }
  return next;
}

function loadTheme(): Theme {
  const saved = localStorage.getItem(KEYS.theme);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="chips" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          className={value === opt.id ? "chip active" : "chip"}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Nav({
  screen,
  setScreen,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
}) {
  const items: Array<{
    id: Screen;
    label: string;
    icon: ReactNode;
  }> = [
    { id: "home", label: "Home", icon: <HomeIcon /> },
    { id: "quran", label: "Quran", icon: <BookIcon size={20} /> },
    { id: "mywords", label: "Mine", icon: <MineIcon /> },
    { id: "duas", label: "Duas", icon: <DuasIcon /> },
    { id: "words", label: "Words", icon: <WordsIcon /> },
    { id: "ayahs", label: "Ayahs", icon: <AyahsIcon /> },
    { id: "rules", label: "Qawaid", icon: <RulesIcon /> },
  ];
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-inner">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={screen === item.id ? "active" : ""}
            aria-current={screen === item.id ? "page" : undefined}
            onClick={() => setScreen(item.id)}
          >
            <span className="glyph" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [page, setPage] = useState(1);
  const [fontPx, setFontPx] = useState(26);
  const [quranPage, setQuranPage] = useState<QuranPage | null>(null);
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);
  const [juzIndex, setJuzIndex] = useState<JuzInfo[]>([]);
  const [wbw, setWbw] = useState<Record<string, string>>({});
  const [wordTip, setWordTip] = useState<WordTip | null>(null);
  const [vocab, setVocab] = useState<VocabWord[]>([]);
  const [ayahs, setAyahs] = useState<CurriculumAyah[]>([]);
  const [rules, setRules] = useState<LearnerRule[]>([]);
  const [duas, setDuas] = useState<Dua[]>([]);
  const [journey, setJourney] = useState<JourneyAyah[]>([]);
  const [journeyIndex, setJourneyIndex] = useState(0);
  const [learnedWords, setLearnedWords] = useState<Set<string>>(() =>
    loadIds(KEYS.learnedWords),
  );
  const [learnedAyahs, setLearnedAyahs] = useState<Set<string>>(() =>
    loadIds(KEYS.learnedAyahs),
  );
  const [memorizedDuas, setMemorizedDuas] = useState<Set<string>>(() =>
    loadIds(KEYS.memorizedDuas),
  );
  const [learnedRules, setLearnedRules] = useState<Set<string>>(() =>
    loadIds(KEYS.learnedRules),
  );
  const [visited, setVisited] = useState<number[]>(() =>
    loadJson<number[]>(KEYS.visitedPages, []),
  );
  const [bookmarks, setBookmarks] = useState<number[]>(() =>
    loadJson<number[]>(KEYS.bookmarks, []),
  );
  const [focusUnit, setFocusUnit] = useState<number | "all">(() => {
    const raw = localStorage.getItem(KEYS.focusUnit);
    if (!raw || raw === "all") return "all";
    const n = Number(raw);
    return Number.isFinite(n) ? n : "all";
  });
  const [flipped, setFlipped] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [unitFilter, setUnitFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [wordsProgress, setWordsProgress] = useState<ProgressFilter>("todo");
  const [ayahsProgress, setAyahsProgress] = useState<ProgressFilter>("todo");
  const [duasProgress, setDuasProgress] = useState<ProgressFilter>("all");
  const [duaCategory, setDuaCategory] = useState<string>("all");
  const [duaJuz, setDuaJuz] = useState<number | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [searchIndex, setSearchIndex] = useState<Record<string, SearchHit[]>>(
    {},
  );
  const [ayahCards, setAyahCards] = useState<Record<string, AyahCard>>({});
  const [matchItems, setMatchItems] = useState<MatchItem[]>([]);
  const [matchQuery, setMatchQuery] = useState("");
  const [matchMode, setMatchMode] = useState<"arabic" | "urdu" | "both">(
    "arabic",
  );
  const [quranQuery, setQuranQuery] = useState("");
  const [ayahQuery, setAyahQuery] = useState("");
  const [showQuranSearch, setShowQuranSearch] = useState(false);
  const [rulesUnit, setRulesUnit] = useState<number | "all">("all");
  const [rulesQuery, setRulesQuery] = useState("");
  const [rulesProgress, setRulesProgress] = useState<ProgressFilter>("todo");
  const [showRuleExamples, setShowRuleExamples] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [myWords, setMyWords] = useState<TappedWordRecord[]>(() =>
    listTappedWords(),
  );
  const [myWordsQuery, setMyWordsQuery] = useState("");
  const [debouncedQuranQuery, setDebouncedQuranQuery] = useState("");
  const [searchReady, setSearchReady] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [openAyahMeanings, setOpenAyahMeanings] = useState<Set<string>>(
    () => new Set(),
  );
  const [tipAnchor, setTipAnchor] = useState<DOMRect | null>(null);
  const [tipPos, setTipPos] = useState<{
    top: number;
    left: number;
    place: TipPlace;
    arrowX: number;
    maxWidth: number;
  } | null>(null);
  const pendingTipRef = useRef<WordTip | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const searchLoadRef = useRef<Promise<void> | null>(null);
  const searchIndexRef = useRef<Record<string, SearchHit[]>>({});
  const wbwRef = useRef<Record<string, string>>({});
  wbwRef.current = wbw;
  searchIndexRef.current = searchIndex;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedQuranQuery(quranQuery),
      180,
    );
    return () => window.clearTimeout(t);
  }, [quranQuery]);

  function ensureSearchData(): Promise<void> {
    if (searchReady) return Promise.resolve();
    if (searchLoadRef.current) return searchLoadRef.current;
    setSearchLoading(true);
    searchLoadRef.current = Promise.all([
      fetchJson<{ forms?: Record<string, SearchHit[]> }>(
        "./data/quran/word-search-index.json",
      ).catch(() => ({ forms: {} })),
      fetchJson<{ ayahs?: Record<string, AyahCard> }>(
        "./data/quran/ayah-cards.json",
      ).catch(() => ({ ayahs: {} })),
    ])
      .then(([idx, cards]) => {
        const forms = idx.forms ?? {};
        searchIndexRef.current = forms;
        setSearchIndex(forms);
        setAyahCards(cards.ayahs ?? {});
        setSearchReady(true);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setSearchLoading(false));
    return searchLoadRef.current;
  }

  useEffect(() => {
    const pos = loadJson<{ page?: number } | null>(KEYS.readingPosition, null);
    if (pos?.page && pos.page >= 1 && pos.page <= PAGE_COUNT) setPage(pos.page);

    Promise.all([
      fetchJson<SurahInfo[]>("./data/quran/surahs.json"),
      fetchJson<JuzInfo[]>("./data/quran/juz-index.json"),
      fetchJson<{ meanings?: Record<string, string> }>(
        "./data/quran/wbw-urdu.json",
      ),
      fetchJson<{ units: Array<{ unit: number; words: VocabWord[] }> }>(
        "./data/curriculum/unit-vocabulary.json",
      ),
      fetchJson<{
        units: Array<{ unit: number; ayahs: CurriculumAyah[] }>;
      }>("./data/curriculum/unit-ayahs.json"),
      fetchJson<{ rules?: LearnerRule[] } | LearnerRule[]>(
        "./data/curriculum/learner-rules.json",
      ),
      fetchJson<{ duas: Dua[] }>("./data/duas/daily-duas.json"),
      fetchJson<{ ayahs: JourneyAyah[] }>("./data/curriculum/journey-ayahs.json"),
    ])
      .then(([s, j, w, v, a, r, d, ja]) => {
        setSurahs(s);
        setJuzIndex(j);
        setWbw(w.meanings ?? {});
        setVocab(
          v.units.flatMap((u) => u.words.map((word) => ({ ...word, unit: u.unit }))),
        );
        setAyahs(
          a.units.flatMap((u) =>
            u.ayahs.map((ay, i) => ({
              ...ay,
              unit: u.unit,
              id: ay.id || `u${u.unit}-a-${i + 1}`,
            })),
          ),
        );
        setRules(Array.isArray(r) ? r : (r.rules ?? []));
        setDuas(d.duas ?? []);
        setJourney((ja.ayahs ?? []).filter((x) => x.arabic && x.urdu));
      })
      .catch((e: Error) => setError(e.message));

    const idle = window.setTimeout(() => {
      void ensureSearchData();
    }, 2200);
    return () => window.clearTimeout(idle);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setWordTip(null);
    setTipAnchor(null);
    fetchJson<QuranPage>(`./data/quran/by-page/${page}.json`)
      .then((data) => {
        if (cancelled) return;
        setQuranPage(data);
        const pending = pendingTipRef.current;
        pendingTipRef.current = null;
        if (pending) setWordTip(pending);
        if (pending?.meaning) {
          const rec = recordTappedWord({
            arabic: pending.arabic,
            meaning: pending.meaning,
            page,
            ayahId: pending.ayahId,
          });
          setMyWords((prev) => [
            rec,
            ...prev.filter((x) => x.id !== rec.id),
          ]);
        }
        saveJson(KEYS.readingPosition, {
          page,
          juz: data.juz,
          updatedAt: new Date().toISOString(),
        });
        setVisited((prev) => {
          if (prev.includes(page)) return prev;
          const next = [...prev, page].sort((a, b) => a - b);
          saveJson(KEYS.visitedPages, next);
          return next;
        });
      })
      .catch((e: Error) => setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    if (!quranPage || !focusTarget) return;
    const ayahEl = document.querySelector<HTMLElement>(
      `[data-ayah-id="${CSS.escape(focusTarget.ayahId)}"]`,
    );
    const wordEl = focusTarget.wordId
      ? document.querySelector<HTMLElement>(
          `[data-word-id="${CSS.escape(focusTarget.wordId)}"]`,
        )
      : null;
    (wordEl ?? ayahEl)?.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = window.setTimeout(() => setFocusTarget(null), 9000);
    return () => window.clearTimeout(t);
  }, [quranPage, focusTarget]);

  useLayoutEffect(() => {
    if (!wordTip || !tipAnchor || !tipRef.current) {
      setTipPos(null);
      return;
    }

    const place = () => {
      const el = tipRef.current;
      if (!el || !tipAnchor) return;

      const pad = 12;
      const topBar = 64;
      const vv = window.visualViewport;
      const vw = vv?.width ?? window.innerWidth;
      const vh = vv?.height ?? window.innerHeight;
      const ox = vv?.offsetLeft ?? 0;
      const oy = vv?.offsetTop ?? 0;

      const maxWidth = Math.max(120, Math.min(vw - pad * 2, 28 * 16));
      el.style.maxWidth = `${maxWidth}px`;

      const tipW = el.offsetWidth;
      const tipH = el.offsetHeight;
      const anchorCenterX = tipAnchor.left + tipAnchor.width / 2;

      let left = anchorCenterX - tipW / 2;
      const minLeft = ox + pad;
      const maxLeft = ox + vw - tipW - pad;
      left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft));

      const above = tipAnchor.top - tipH - 12;
      const placeBelow = above < oy + topBar + pad;
      let top = placeBelow ? tipAnchor.bottom + 12 : above;
      top = Math.min(Math.max(top, oy + pad), oy + vh - tipH - pad);

      const arrowX = Math.min(
        Math.max(anchorCenterX - left, 14),
        Math.max(14, tipW - 14),
      );

      setTipPos({
        top,
        left,
        place: placeBelow ? "below" : "above",
        arrowX,
        maxWidth,
      });
    };

    place();
    // Re-measure after wrap / font metrics settle.
    const raf1 = window.requestAnimationFrame(() => {
      place();
      window.requestAnimationFrame(place);
    });
    return () => window.cancelAnimationFrame(raf1);
  }, [wordTip, tipAnchor]);

  useEffect(() => {
    if (journey.length === 0) return;
    const id = window.setInterval(() => {
      setJourneyIndex((i) => (i + 1) % journey.length);
    }, 9000);
    return () => window.clearInterval(id);
  }, [journey.length]);

  const units = useMemo(
    () => [...new Set(vocab.map((w) => w.unit))].sort((a, b) => a - b),
    [vocab],
  );

  const deck = useMemo(() => {
    const pool = vocab.filter((w) => {
      if (!w.meaning?.trim()) return false;
      if (learnedWords.has(w.id)) return false;
      if (focusUnit !== "all" && w.unit !== focusUnit) return false;
      return true;
    });
    return seededShuffle(
      pool,
      hashSeed(`${todayKey()}:${String(focusUnit)}`),
    ).slice(0, 12);
  }, [vocab, learnedWords, focusUnit]);

  const card = deck[cardIndex % Math.max(deck.length, 1)];
  const quranicDuas = useMemo(
    () => duas.filter((d) => d.category === "quranic"),
    [duas],
  );
  const ja = journey[journeyIndex];

  function markWord(id: string) {
    setLearnedWords((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveIds(KEYS.learnedWords, next);
      return next;
    });
  }

  function toggleSet(
    key: "words" | "ayahs" | "duas" | "rules",
    id: string,
  ) {
    if (key === "words") {
      setLearnedWords((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        saveIds(KEYS.learnedWords, next);
        return next;
      });
      return;
    }
    if (key === "ayahs") {
      setLearnedAyahs((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        saveIds(KEYS.learnedAyahs, next);
        return next;
      });
      return;
    }
    if (key === "rules") {
      setLearnedRules((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        saveIds(KEYS.learnedRules, next);
        return next;
      });
      return;
    }
    setMemorizedDuas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveIds(KEYS.memorizedDuas, next);
      return next;
    });
  }

  function toggleBookmark() {
    setBookmarks((prev) => {
      const next = prev.includes(page)
        ? prev.filter((p) => p !== page)
        : [...prev, page].sort((a, b) => a - b);
      saveJson(KEYS.bookmarks, next);
      return next;
    });
  }

  function setFocus(u: number | "all") {
    setFocusUnit(u);
    localStorage.setItem(KEYS.focusUnit, String(u));
    setCardIndex(0);
    setFlipped(false);
  }

  const ayahPageById = useMemo(() => {
    const map = new Map<string, number>();
    for (const [id, card] of Object.entries(ayahCards)) {
      map.set(id, card.p);
    }
    return map;
  }, [ayahCards]);

  function findPageForAyah(ayahId: string): number | null {
    return ayahPageById.get(ayahId) ?? null;
  }

  function closeWordTip() {
    setWordTip(null);
    setTipAnchor(null);
  }

  function openWordTip(
    word: { id: string; arabic: string },
    ayahId: string,
    prev?: { arabic: string; id: string } | null,
    next?: { arabic: string; id: string } | null,
    anchorEl?: HTMLElement | null,
    pageOverride?: number,
  ) {
    if (isPunctuationToken(word.arabic)) return;
    const raw = wbw[word.id]?.trim() || null;
    if (!raw) return;
    const prevUr = prev ? wbw[prev.id]?.trim() || null : null;
    const nextUr = next ? wbw[next.id]?.trim() || null : null;
    const meaning = composeWordMeaning(
      word.arabic,
      raw,
      prev?.arabic ?? null,
      prevUr,
      next?.arabic ?? null,
      nextUr,
    );
    if (!meaning) return;
    const rec = recordTappedWord({
      arabic: word.arabic,
      meaning,
      page: pageOverride ?? page,
      ayahId,
    });
    setMyWords((prevList) => [
      rec,
      ...prevList.filter((x) => x.id !== rec.id),
    ]);
    setWordTip({
      id: word.id,
      arabic: word.arabic,
      meaning,
      ayahId,
    });
    setTipAnchor(anchorEl?.getBoundingClientRect() ?? null);
  }

  function openMatchTokenTip(
    token: string,
    ayahId: string,
    pageNum: number,
    el: HTMLElement,
  ) {
    if (isPunctuationToken(token)) return;
    const hit = findHitInAyah(token, ayahId, searchIndex);
    if (!hit) return;
    openWordTip(
      { id: hit.w, arabic: hit.ar || token },
      ayahId,
      null,
      null,
      el,
      pageNum,
    );
  }

  function openListTokenTip(
    token: string,
    ref: string | null | undefined,
    pageNum: number | null | undefined,
    el: HTMLElement,
    fallbackMeaning?: string | null,
  ) {
    if (isPunctuationToken(token)) return;
    void ensureSearchData().then(() => {
      const index = searchIndexRef.current;
      const scoped = Boolean(ref?.trim());

      // Qawaid / unscoped: form consensus — never first Quran hit alone.
      if (!scoped) {
        const exact = exactHitsForToken(token, index);
        const canonical = pickCanonicalFormMeaning(
          token,
          exact,
          wbwRef.current,
        );
        if (canonical) {
          setWordTip({
            id: exact[0]?.w ?? `form:${token}`,
            arabic: token,
            meaning: canonical,
            ayahId: "",
          });
          setTipAnchor(el.getBoundingClientRect());
          return;
        }
        const fb = fallbackMeaning?.trim();
        if (!fb) return;
        setWordTip({
          id: `fb:${token}`,
          arabic: token,
          meaning: fb,
          ayahId: "",
        });
        setTipAnchor(el.getBoundingClientRect());
        return;
      }

      const hit = findHitForArabicToken(token, ref, index);
      if (hit) {
        const raw = wbwRef.current[hit.w]?.trim() || null;
        if (raw) {
          openWordTip(
            { id: hit.w, arabic: hit.ar || token },
            hit.a,
            null,
            null,
            el,
            pageNum ?? hit.p,
          );
          return;
        }
      }
      const fb = fallbackMeaning?.trim();
      if (!fb) return;
      setWordTip({
        id: `fb:${token}`,
        arabic: token,
        meaning: fb,
        ayahId: ref ?? "",
      });
      setTipAnchor(el.getBoundingClientRect());
    });
  }

  useEffect(() => {
    if (
      screen === "ayahs" ||
      screen === "duas" ||
      screen === "matches" ||
      screen === "rules"
    ) {
      void ensureSearchData();
    }
  }, [screen]);

  function openMatchInQuran(m: MatchItem) {
    setFocusTarget({
      ayahId: m.ayahId,
      wordId: m.matchedWordId,
    });
    setPage(m.page);
    setScreen("quran");
    setShowQuranSearch(false);
    closeWordTip();
  }

  function toggleAyahMeaning(ayahId: string) {
    void ensureSearchData();
    setOpenAyahMeanings((prev) => {
      const next = new Set(prev);
      if (next.has(ayahId)) next.delete(ayahId);
      else next.add(ayahId);
      return next;
    });
  }

  const matchPreview = useMemo(() => {
    if (!debouncedQuranQuery.trim()) {
      return { items: [] as MatchItem[], mode: "arabic" as const };
    }
    return buildMatchList(debouncedQuranQuery, searchIndex, ayahCards, 60);
  }, [debouncedQuranQuery, searchIndex, ayahCards]);

  const searchSuggestions = useMemo(() => {
    const q = quranQuery.trim();
    if (q.length < 1 || q.length > 24) return [] as string[];
    return suggestSearchForms(q, searchIndex, 8);
  }, [quranQuery, searchIndex]);

  function openMatchesPage(
    items: MatchItem[],
    query: string,
    mode: "arabic" | "urdu" | "both",
  ) {
    setMatchItems(items);
    setMatchQuery(query.trim());
    setMatchMode(mode);
    setShowQuranSearch(false);
    closeWordTip();
    setScreen("matches");
  }

  const filteredWords = vocab
    .filter((w) => (unitFilter === "all" ? true : w.unit === unitFilter))
    .filter((w) => {
      if (wordsProgress === "todo" && learnedWords.has(w.id)) return false;
      if (wordsProgress === "done" && !learnedWords.has(w.id)) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        w.arabic.includes(search.trim()) ||
        w.meaning.toLowerCase().includes(q) ||
        w.id.includes(q)
      );
    })
    .slice(0, 250);

  const filteredAyahs = ayahs
    .filter((a) => (unitFilter === "all" ? true : a.unit === unitFilter))
    .filter((a) => {
      if (ayahsProgress === "todo" && learnedAyahs.has(a.id)) return false;
      if (ayahsProgress === "done" && !learnedAyahs.has(a.id)) return false;
      if (!ayahQuery.trim()) return true;
      const q = ayahQuery.trim().toLowerCase();
      return (
        a.arabic.includes(ayahQuery.trim()) ||
        (a.meaning ?? "").toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    })
    .slice(0, 150);

  const filteredDuas = duas
    .filter((d) => {
      if (duaCategory !== "all" && d.category !== duaCategory) return false;
      if (
        duaCategory === "quranic" &&
        duaJuz !== "all" &&
        d.juz !== duaJuz
      ) {
        return false;
      }
      if (duasProgress === "todo" && memorizedDuas.has(d.id)) return false;
      if (duasProgress === "done" && !memorizedDuas.has(d.id)) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        d.arabic.includes(search.trim()) ||
        (d.urdu ?? "").toLowerCase().includes(q) ||
        (d.occasion ?? "").toLowerCase().includes(q)
      );
    });

  const duasInScope = useMemo(
    () =>
      duas.filter((d) =>
        duaCategory === "all" ? true : d.category === duaCategory,
      ),
    [duas, duaCategory],
  );
  const memorizedInScope = useMemo(
    () => duasInScope.filter((d) => memorizedDuas.has(d.id)).length,
    [duasInScope, memorizedDuas],
  );

  const filteredMyWords = useMemo(() => {
    const q = myWordsQuery.trim().toLowerCase();
    if (!q) return myWords;
    return myWords.filter(
      (w) =>
        w.arabic.includes(myWordsQuery.trim()) ||
        (w.meaning ?? "").toLowerCase().includes(q),
    );
  }, [myWords, myWordsQuery]);

  const filteredRules = useMemo(() => {
    const q = rulesQuery.trim().toLowerCase();
    return rules
      .filter((r) => (rulesUnit === "all" ? true : r.unit === rulesUnit))
      .filter((r) => {
        if (rulesProgress === "todo" && learnedRules.has(r.id)) return false;
        if (rulesProgress === "done" && !learnedRules.has(r.id)) return false;
        return true;
      })
      .filter((r) => {
        if (!q) return true;
        const hay = `${r.title} ${r.definition ?? ""} ${r.explanation ?? ""}`.toLowerCase();
        return hay.includes(q) || r.title.includes(rulesQuery.trim());
      });
  }, [rules, rulesUnit, rulesQuery, rulesProgress, learnedRules]);

  const rulesInScope = useMemo(
    () =>
      rules.filter((r) => (rulesUnit === "all" ? true : r.unit === rulesUnit)),
    [rules, rulesUnit],
  );
  const learnedRulesInScope = useMemo(
    () => rulesInScope.filter((r) => learnedRules.has(r.id)).length,
    [rulesInScope, learnedRules],
  );

  return (
    <div
      className="app-shell"
      data-theme={theme}
      onClick={() => {
        if (wordTip) closeWordTip();
      }}
    >
      {wordTip ? (
        <div
          ref={tipRef}
          className={
            tipPos?.place === "below" ? "tip tip-fixed tip-below" : "tip tip-fixed"
          }
          role="tooltip"
          style={
            tipPos
              ? {
                  top: tipPos.top,
                  left: tipPos.left,
                  maxWidth: tipPos.maxWidth,
                  visibility: "visible",
                  ["--tip-arrow-x" as string]: `${tipPos.arrowX}px`,
                }
              : {
                  top: 0,
                  left: 0,
                  maxWidth: "min(92vw, 28rem)",
                  visibility: "hidden",
                }
          }
          onClick={(e) => e.stopPropagation()}
        >
          <span className="tip-line">
            <span className="tip-ur">{wordTip.meaning || "—"}</span>
          </span>
        </div>
      ) : null}
      <header className="topbar" onClick={(e) => e.stopPropagation()}>
        <div className="topbar-side" aria-hidden />
        <div className="brand-lockup" aria-label="اقرا — پڑھو، پہچانو، سمجھو">
          <img
            className="brand-mark"
            src="./icon.png"
            alt=""
            width={40}
            height={40}
          />
          <span className="brand-lockup-text">
            <span className="brand-name">اقرا</span>
            <span className="brand-tag">پڑھو · پہچانو · سمجھو</span>
          </span>
        </div>
        <div className="topbar-side topbar-actions">
          <button
            type="button"
            className="icon-btn"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <div className="content">
        {error ? <div className="card">Error: {error}</div> : null}

        {screen === "home" ? (
          <>
            <button
              type="button"
              className="continue-btn"
              onClick={() => setScreen("quran")}
            >
              <span className="continue-icon" aria-hidden>
                <BookIcon size={22} />
              </span>
              <span className="continue-copy">
                <strong>Continue reading</strong>
                <span>Page {page}</span>
              </span>
              <span className="continue-chevron" aria-hidden>
                ›
              </span>
            </button>

            <div className="quick-row">
              <button
                type="button"
                className="quick-tile"
                onClick={() => setScreen("mywords")}
              >
                <strong>My words</strong>
                <span>{myWords.length} saved</span>
              </button>
              <button
                type="button"
                className="quick-tile"
                onClick={() => setScreen("duas")}
              >
                <strong>Duas</strong>
                <span>
                  {memorizedDuas.size}/{quranicDuas.length} memorized
                </span>
              </button>
            </div>

            <div className="card">
              <h2>Units</h2>
              <p className="section-note">Focus for Recognize practice</p>
              <div className="unit-grid">
                <button
                  type="button"
                  className={
                    focusUnit === "all" ? "unit-all active" : "unit-all"
                  }
                  onClick={() => setFocus("all")}
                >
                  All
                </button>
                {units.map((u) => (
                  <button
                    key={u}
                    type="button"
                    className={focusUnit === u ? "active" : ""}
                    onClick={() => setFocus(u)}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="home-split">
              <div className="card">
                <h2>Recognize</h2>
                <p className="section-note">
                  Focus: {focusUnit === "all" ? "All units" : `Unit ${focusUnit}`}
                </p>
                {card ? (
                  <>
                    <button
                      type="button"
                      className="recognize-card"
                      onClick={() => setFlipped((v) => !v)}
                    >
                      <div className="ar" style={{ fontSize: 28 }}>
                        {card.arabic}
                      </div>
                      {flipped ? (
                        <div className="ur">{card.meaning}</div>
                      ) : (
                        <div className="muted">Tap for Urdu</div>
                      )}
                    </button>
                    <div className="actions-bar">
                      <button
                        type="button"
                        className="icon-btn"
                        title="Skip"
                        aria-label="Skip"
                        onClick={() => {
                          setFlipped(false);
                          setCardIndex((i) => i + 1);
                        }}
                      >
                        <SkipIcon />
                      </button>
                      <button
                        type="button"
                        className="icon-btn primary"
                        title="I know this"
                        aria-label="I know this"
                        onClick={() => {
                          markWord(card.id);
                          setFlipped(false);
                          setCardIndex((i) => i + 1);
                        }}
                      >
                        <LearnedIcon active />
                      </button>
                      <span className="muted">
                        {(cardIndex % Math.max(deck.length, 1)) + 1}/
                        {deck.length || 0}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="muted">No cards left for this focus.</p>
                )}
              </div>

              <div className="card">
                <h2>Progress</h2>
                <div className="progress-row">
                  <div className="progress-meta">
                    <span>Pages</span>
                    <span>
                      {visited.length}/{PAGE_COUNT}
                    </span>
                  </div>
                  <div className="progress">
                    <span
                      style={{ width: `${(visited.length / PAGE_COUNT) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="progress-row">
                  <div className="progress-meta">
                    <span>Words</span>
                    <span>
                      {learnedWords.size}/{vocab.length || 1}
                    </span>
                  </div>
                  <div className="progress">
                    <span
                      style={{
                        width: `${(learnedWords.size / Math.max(vocab.length, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="progress-row">
                  <div className="progress-meta">
                    <span>My words</span>
                    <span>{myWords.length}</span>
                  </div>
                  <div className="progress">
                    <span
                      style={{
                        width: `${Math.min(100, (myWords.length / 50) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="progress-row">
                  <div className="progress-meta">
                    <span>Duas</span>
                    <span>
                      {memorizedDuas.size}/{quranicDuas.length || 1}
                    </span>
                  </div>
                  <div className="progress">
                    <span
                      style={{
                        width: `${(memorizedDuas.size / Math.max(quranicDuas.length, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {ja ? (
              <div className="card">
                <div className="actions-bar" style={{ justifyContent: "space-between" }}>
                  <h2 style={{ margin: 0 }}>From the Quran</h2>
                  <div className="actions-bar">
                    <button
                      type="button"
                      className="btn icon"
                      aria-label="Previous"
                      onClick={() =>
                        setJourneyIndex(
                          (i) => (i - 1 + journey.length) % journey.length,
                        )
                      }
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="btn icon"
                      aria-label="Next"
                      onClick={() => setJourneyIndex((i) => (i + 1) % journey.length)}
                    >
                      ›
                    </button>
                  </div>
                </div>
                <p className="muted">
                  {ja.surahNameEnglish ?? `Surah ${ja.surahId}`} · {ja.id}
                  {ja.page ? ` · p.${ja.page}` : ""}
                </p>
                <p className="ar" style={{ fontSize: 24 }}>
                  {ja.arabic}
                </p>
                <p className="ur">{ja.urdu}</p>
                {ja.page ? (
                  <button
                    type="button"
                    className="icon-btn primary"
                    title="Open this ayah in the Quran"
                    aria-label="Open in Quran"
                    onClick={() => {
                      setPage(ja.page!);
                      setScreen("quran");
                    }}
                  >
                    <BookIcon />
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        {screen === "quran" ? (
          <div className="card">
            <div className="quran-tools">
              <button
                type="button"
                className="btn icon"
                disabled={page <= 1}
                aria-label="Previous page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              <input
                className="page-input"
                type="number"
                min={1}
                max={PAGE_COUNT}
                value={page}
                aria-label="Page number"
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (n >= 1 && n <= PAGE_COUNT) setPage(n);
                }}
              />
              <button
                type="button"
                className="btn icon"
                disabled={page >= PAGE_COUNT}
                aria-label="Next page"
                onClick={() => setPage((p) => Math.min(PAGE_COUNT, p + 1))}
              >
                ›
              </button>
              <select
                className="chip"
                style={{ paddingRight: 28 }}
                value={quranPage?.juz ?? 1}
                aria-label="Juz"
                onChange={(e) => {
                  const juz = Number(e.target.value);
                  const hit = juzIndex.find((j) => j.juz === juz);
                  if (hit?.startPage) setPage(hit.startPage);
                }}
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                  <option key={j} value={j}>
                    Juz {j}
                  </option>
                ))}
              </select>
              <div className="font-stepper" role="group" aria-label="حجمِ خط">
                <button
                  type="button"
                  className="font-step"
                  title="چھوٹا خط"
                  aria-label="Decrease font size"
                  onClick={() => setFontPx((n) => Math.max(18, n - 2))}
                >
                  <FontMinusIcon size={18} />
                </button>
                <span className="font-step-value">{fontPx}</span>
                <button
                  type="button"
                  className="font-step"
                  title="بڑا خط"
                  aria-label="Increase font size"
                  onClick={() => setFontPx((n) => Math.min(40, n + 2))}
                >
                  <FontPlusIcon size={18} />
                </button>
              </div>
              <button
                type="button"
                className={bookmarks.includes(page) ? "icon-btn active" : "icon-btn"}
                title="Bookmark this page to reopen later"
                aria-label={
                  bookmarks.includes(page) ? "Remove bookmark" : "Bookmark page"
                }
                onClick={toggleBookmark}
              >
                <BookmarkIcon active={bookmarks.includes(page)} />
              </button>
              <button
                type="button"
                className={showQuranSearch ? "icon-btn active" : "icon-btn"}
                title="Search a word in the mushaf"
                aria-label="Search Quran"
                onClick={() => {
                  setShowQuranSearch((v) => {
                    const next = !v;
                    if (next) void ensureSearchData();
                    return next;
                  });
                }}
              >
                <SearchIcon />
              </button>
            </div>

            {showQuranSearch ? (
              <div
                className="quran-search-inline"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  className="search"
                  placeholder="Search Arabic or Urdu…"
                  value={quranQuery}
                  onChange={(e) => setQuranQuery(e.target.value)}
                  dir="auto"
                  autoFocus
                />
                {searchLoading ? (
                  <p className="section-note">Loading search…</p>
                ) : null}
                {searchSuggestions.length > 0 &&
                quranQuery.trim().length >= 1 ? (
                  <div className="search-suggest" role="listbox">
                    {searchSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="search-suggest-item ar"
                        role="option"
                        onClick={() => setQuranQuery(s)}
                      >
                        <HighlightedText text={s} query={quranQuery} />
                      </button>
                    ))}
                  </div>
                ) : null}
                {debouncedQuranQuery.trim().length >= 2 ||
                debouncedQuranQuery.trim().includes(" ") ? (
                  <div>
                    <div
                      className="actions-bar"
                      style={{ justifyContent: "space-between", marginTop: 8 }}
                    >
                      <p className="quran-search-meta" style={{ margin: 0 }}>
                        {matchPreview.items.length === 0
                          ? "No matches"
                          : `${matchPreview.items.length} ayah${matchPreview.items.length === 1 ? "" : "s"} · ${matchPreview.mode === "urdu" ? "Urdu" : matchPreview.mode === "both" ? "Arabic + Urdu" : "Arabic"}`}
                      </p>
                      {matchPreview.items.length > 0 ? (
                        <button
                          type="button"
                          className="btn primary"
                          onClick={() =>
                            openMatchesPage(
                              matchPreview.items,
                              debouncedQuranQuery,
                              matchPreview.mode,
                            )
                          }
                        >
                          View all
                        </button>
                      ) : null}
                    </div>
                    {matchPreview.items.length === 0 ? null : (
                      <div className="quran-search-results">
                        {matchPreview.items.slice(0, 12).map((m) => (
                          <button
                            key={m.ayahId}
                            type="button"
                            className="search-hit"
                            onClick={() => openMatchInQuran(m)}
                          >
                            <span className="ar" style={{ fontSize: 16 }}>
                              <HighlightedText
                                text={
                                  (m.matchedArabic ?? m.arabic.slice(0, 42)) +
                                  (!m.matchedArabic && m.arabic.length > 42
                                    ? "…"
                                    : "")
                                }
                                query={debouncedQuranQuery}
                              />
                            </span>
                            <span className="muted">
                              {m.ayahId} · p.{m.page}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="section-note">
                    Arabic word/phrase or Urdu meaning (e.g. زمین، رحمن)
                  </p>
                )}
              </div>
            ) : null}

            <p className="section-note">
              Tap a word for its tip · Page {page} · Juz {quranPage?.juz ?? "—"} ·{" "}
              {(quranPage?.surahIds ?? [])
                .map((id) => surahs.find((s) => s.id === id)?.nameEnglish ?? id)
                .join(", ")}
            </p>
            <div
              className="mushaf ar"
              style={{ fontSize: fontPx }}
              onClick={(e) => {
                if (e.target === e.currentTarget) closeWordTip();
              }}
            >
              {(quranPage?.ayahs ?? []).map((ayah) => {
                const ayahFocused = focusTarget?.ayahId === ayah.id;
                const meaningOpen = openAyahMeanings.has(ayah.id);
                const ayahUr = ayahCards[ayah.id]?.ur;
                return (
                  <div
                    key={ayah.id}
                    className={
                      ayahFocused ? "ayah-block ayah-focus" : "ayah-block"
                    }
                    data-ayah-id={ayah.id}
                  >
                    <p className="ayah-line" style={{ margin: "0 0 6px" }}>
                      {ayah.words.map((w, wi) => {
                        if (isPunctuationToken(w.arabic)) {
                          return (
                            <span
                              key={w.id}
                              className="word-chip"
                              style={{ cursor: "default" }}
                            >
                              {w.arabic}
                            </span>
                          );
                        }
                        const prev = ayah.words
                          .slice(0, wi)
                          .reverse()
                          .find((x) => !isPunctuationToken(x.arabic));
                        const next = ayah.words
                          .slice(wi + 1)
                          .find((x) => !isPunctuationToken(x.arabic));
                        const active = wordTip?.id === w.id;
                        const marked =
                          focusTarget?.ayahId === ayah.id &&
                          focusTarget.wordId === w.id;
                        return (
                          <span
                            key={w.id}
                            className="word-wrap"
                            data-word-id={w.id}
                          >
                            <span
                              role="button"
                              tabIndex={0}
                              className={[
                                "word-chip",
                                active ? "active" : "",
                                marked ? "word-focus" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (active) closeWordTip();
                                else
                                  openWordTip(
                                    w,
                                    ayah.id,
                                    prev ?? null,
                                    next ?? null,
                                    e.currentTarget,
                                  );
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  if (active) closeWordTip();
                                  else
                                    openWordTip(
                                      w,
                                      ayah.id,
                                      prev ?? null,
                                      next ?? null,
                                      e.currentTarget,
                                    );
                                }
                              }}
                            >
                              {w.arabic}
                            </span>
                          </span>
                        );
                      })}{" "}
                      <sup className="muted">{ayah.ayahNumber}</sup>
                    </p>
                    <div className="ayah-tools">
                      <button
                        type="button"
                        className={
                          meaningOpen ? "icon-btn tiny active" : "icon-btn tiny"
                        }
                        title={
                          meaningOpen
                            ? "Hide ayah Urdu"
                            : "Show ayah Urdu"
                        }
                        aria-label={
                          meaningOpen
                            ? "Hide ayah Urdu"
                            : "Show ayah Urdu"
                        }
                        aria-pressed={meaningOpen}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAyahMeaning(ayah.id);
                        }}
                      >
                        <TranslateIcon active={meaningOpen} size={16} />
                      </button>
                    </div>
                    {meaningOpen ? (
                      <p className="ur ayah-running">
                        {ayahUr?.trim()
                          ? ayahUr
                          : searchLoading || !searchReady
                            ? "Loading…"
                            : "No connected meaning for this ayah yet."}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {screen === "matches" ? (
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <div
              className="actions-bar"
              style={{ justifyContent: "space-between" }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Search matches</h2>
                <p className="section-note" style={{ margin: "4px 0 0" }}>
                  “{matchQuery}” · {matchItems.length} ayah
                  {matchItems.length === 1 ? "" : "s"}
                  {matchMode === "urdu"
                    ? " · Urdu"
                    : matchMode === "both"
                      ? " · Arabic + Urdu"
                      : " · Arabic"}
                  {" · tap Arabic words for tips"}
                </p>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setScreen("quran");
                  setShowQuranSearch(true);
                  void ensureSearchData();
                }}
              >
                Back
              </button>
            </div>
            {matchItems.length === 0 ? (
              <div className="empty-state">
                <p>No matches for this search.</p>
              </div>
            ) : (
              matchItems.map((m) => (
                <article key={m.ayahId} className="list-item match-card">
                  <div className="match-meta">
                    <span>{m.ayahId}</span>
                    <span>p.{m.page}</span>
                  </div>
                  <p className="ar match-ar">
                    {m.arabic.split(/(\s+)/u).map((tok, i) => {
                      if (!tok.trim()) {
                        return <span key={`s-${i}`}>{tok}</span>;
                      }
                      if (isPunctuationToken(tok)) {
                        return (
                          <span key={`p-${i}`} className="match-punct">
                            {tok}
                          </span>
                        );
                      }
                      const marked =
                        tokenMatchesArabicForm(tok, m.matchedArabic) ||
                        tokenMatchesSearch(tok, matchQuery);
                      return (
                        <button
                          key={`w-${i}-${tok}`}
                          type="button"
                          className={
                            marked
                              ? "match-word search-mark"
                              : "match-word"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            openMatchTokenTip(
                              tok,
                              m.ayahId,
                              m.page,
                              e.currentTarget,
                            );
                          }}
                        >
                          {tok}
                        </button>
                      );
                    })}
                  </p>
                  {m.urdu ? (
                    <p className="ur match-ur">
                      {highlightSearchText(m.urdu, matchQuery).map((part, i) =>
                        part.hit ? (
                          <mark key={i} className="search-mark">
                            {part.text}
                          </mark>
                        ) : (
                          <span key={i}>{part.text}</span>
                        ),
                      )}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="icon-btn primary"
                    title="Open in Quran"
                    aria-label="Open in Quran"
                    onClick={() => openMatchInQuran(m)}
                  >
                    <BookIcon />
                  </button>
                </article>
              ))
            )}
          </div>
        ) : null}

        {screen === "mywords" ? (
          <div className="card">
            <div className="actions-bar" style={{ justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0 }}>My words</h2>
                <p className="section-note" style={{ margin: "4px 0 0" }}>
                  Words you tap while reading — review them here.
                </p>
              </div>
              {myWords.length > 0 ? (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    if (window.confirm("Clear all saved words?")) {
                      clearTappedWords();
                      setMyWords([]);
                    }
                  }}
                >
                  Clear
                </button>
              ) : null}
            </div>
            <input
              className="search"
              placeholder="Search your words…"
              value={myWordsQuery}
              onChange={(e) => setMyWordsQuery(e.target.value)}
              dir="auto"
            />
            <p className="section-note" style={{ marginTop: 10 }}>
              {filteredMyWords.length} word
              {filteredMyWords.length === 1 ? "" : "s"}
            </p>
            {filteredMyWords.length === 0 ? (
              <div className="empty-state">
                <p>No words saved yet.</p>
                <p className="muted">
                  Open the Quran and tap any word to collect it here.
                </p>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setScreen("quran")}
                >
                  Open Quran
                </button>
              </div>
            ) : (
              filteredMyWords.map((w) => (
                <div key={w.id} className="list-item">
                  <div className="ar" style={{ fontSize: 26 }}>
                    <HighlightedText text={w.arabic} query={myWordsQuery} />
                  </div>
                  <div className="ur">
                    <HighlightedText
                      text={w.meaning || "—"}
                      query={myWordsQuery}
                    />
                  </div>
                  <div className="actions-bar" style={{ justifyContent: "space-between" }}>
                    <span className="muted">
                      {w.tapCount}×
                      {w.lastPage != null ? ` · p.${w.lastPage}` : ""}
                      {w.lastAyahId ? ` · ${w.lastAyahId}` : ""}
                    </span>
                    <div className="actions-bar">
                      {w.lastPage != null ? (
                        <button
                          type="button"
                          className="icon-btn primary"
                          title="Open in Quran"
                          aria-label="Open in Quran"
                          onClick={() => {
                            setPage(w.lastPage!);
                            setScreen("quran");
                          }}
                        >
                          <BookIcon />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="icon-btn"
                        title="Remove"
                        aria-label="Remove word"
                        onClick={() => {
                          removeTappedWord(w.id);
                          setMyWords(listTappedWords());
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}

        {screen === "words" ? (
          <div className="card">
            <Chips
              value={wordsProgress}
              onChange={(id) => setWordsProgress(id as ProgressFilter)}
              options={[
                { id: "todo", label: "To learn" },
                { id: "done", label: "Learned" },
                { id: "all", label: "All" },
              ]}
            />
            <div style={{ height: 8 }} />
            <Chips
              value={String(unitFilter)}
              onChange={(id) =>
                setUnitFilter(id === "all" ? "all" : Number(id))
              }
              options={[
                { id: "all", label: "All" },
                ...units.map((u) => ({ id: String(u), label: `Unit ${u}` })),
              ]}
            />
            <div style={{ height: 10 }} />
            <input
              className="search"
              placeholder="Search Arabic or meaning"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {filteredWords.map((w) => (
              <div key={w.id} className="list-item">
                <div className="ar" style={{ fontSize: 24 }}>
                  <HighlightedText text={w.arabic} query={search} />
                </div>
                <div className="ur">
                  <HighlightedText text={w.meaning} query={search} />
                </div>
                <button
                  type="button"
                  className={
                    learnedWords.has(w.id)
                      ? "icon-btn learned active"
                      : "icon-btn learned"
                  }
                  title={learnedWords.has(w.id) ? "Learned" : "Mark learned"}
                  aria-label={
                    learnedWords.has(w.id) ? "Learned" : "Mark learned"
                  }
                  onClick={() => toggleSet("words", w.id)}
                >
                  <LearnedIcon active={learnedWords.has(w.id)} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {screen === "ayahs" ? (
          <div className="card">
            <Chips
              value={ayahsProgress}
              onChange={(id) => setAyahsProgress(id as ProgressFilter)}
              options={[
                { id: "todo", label: "To learn" },
                { id: "done", label: "Familiar" },
                { id: "all", label: "All" },
              ]}
            />
            <div style={{ height: 8 }} />
            <Chips
              value={String(unitFilter)}
              onChange={(id) =>
                setUnitFilter(id === "all" ? "all" : Number(id))
              }
              options={[
                { id: "all", label: "All" },
                ...units.map((u) => ({ id: String(u), label: `Unit ${u}` })),
              ]}
            />
            <div style={{ height: 10 }} />
            <input
              className="search"
              placeholder="Search Arabic or meaning…"
              value={ayahQuery}
              onChange={(e) => setAyahQuery(e.target.value)}
              dir="auto"
            />
            {filteredAyahs.map((a) => {
              const mushafPage = a.ref ? findPageForAyah(a.ref) : null;
              return (
                <div key={a.id} className="list-item">
                  <div className="ar" style={{ fontSize: 22 }}>
                    <TappableArabicText
                      arabic={a.arabic}
                      query={ayahQuery}
                      onTokenClick={(tok, el) =>
                        openListTokenTip(
                          tok,
                          a.ref ?? null,
                          a.ref ? findPageForAyah(a.ref) : null,
                          el,
                          a.meaning,
                        )
                      }
                    />
                  </div>
                  {a.meaning ? (
                    <div className="ur">
                      <HighlightedText text={a.meaning} query={ayahQuery} />
                    </div>
                  ) : (
                    <div className="muted">Meaning not available</div>
                  )}
                  <div className="actions-bar">
                    <button
                      type="button"
                      className={
                        learnedAyahs.has(a.id)
                          ? "icon-btn learned active"
                          : "icon-btn learned"
                      }
                      title={
                        learnedAyahs.has(a.id)
                          ? "Marked familiar"
                          : "Mark familiar"
                      }
                      aria-label={
                        learnedAyahs.has(a.id)
                          ? "Marked familiar"
                          : "Mark familiar"
                      }
                      onClick={() => toggleSet("ayahs", a.id)}
                    >
                      <LearnedIcon active={learnedAyahs.has(a.id)} />
                    </button>
                    {mushafPage ? (
                      <button
                        type="button"
                        className="icon-btn primary"
                        title="Open in Quran"
                        aria-label="Open in Quran"
                        onClick={() => {
                          setPage(mushafPage);
                          setScreen("quran");
                        }}
                      >
                        <BookIcon />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {screen === "rules" ? (
          <div className="card">
            <div className="actions-bar" style={{ justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0 }}>Qawaid</h2>
                <p className="section-note" style={{ margin: "4px 0 0" }}>
                  Short patterns — mark learned, then return to the Quran.
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                title={showRuleExamples ? "Hide examples" : "Show examples"}
                aria-label={showRuleExamples ? "Hide examples" : "Show examples"}
                onClick={() => setShowRuleExamples((v) => !v)}
              >
                {showRuleExamples ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </button>
            </div>
            <Chips
              value={rulesProgress}
              onChange={(id) => setRulesProgress(id as ProgressFilter)}
              options={[
                { id: "todo", label: "To learn" },
                { id: "done", label: "Learned" },
                { id: "all", label: "All" },
              ]}
            />
            <div style={{ height: 8 }} />
            <Chips
              value={String(rulesUnit)}
              onChange={(id) =>
                setRulesUnit(id === "all" ? "all" : Number(id))
              }
              options={[
                { id: "all", label: "All units" },
                ...units.map((u) => ({ id: String(u), label: `Unit ${u}` })),
              ]}
            />
            <div style={{ height: 10 }} />
            <input
              className="search"
              placeholder="Search title or explanation…"
              value={rulesQuery}
              onChange={(e) => setRulesQuery(e.target.value)}
              dir="auto"
            />
            <p className="section-note" style={{ marginTop: 10 }}>
              Learned {learnedRulesInScope}/{rulesInScope.length} · showing{" "}
              {filteredRules.length}
            </p>
            {filteredRules.length === 0 ? (
              <div className="empty-state">
                <p>No qawaid in this filter.</p>
              </div>
            ) : (
              filteredRules.map((r) => {
                const known = learnedRules.has(r.id);
                const examples = r.examples ?? [];
                return (
                  <article key={r.id} className="list-item rule-card">
                    <div className="rule-head">
                      <span className="rule-unit">Unit {r.unit}</span>
                      <h3 className="rule-title">
                        <HighlightedText text={r.title} query={rulesQuery} />
                      </h3>
                    </div>
                    <p className="rule-body">
                      <HighlightedText
                        text={r.definition || r.explanation || ""}
                        query={rulesQuery}
                      />
                    </p>
                    {showRuleExamples && examples.length > 0 ? (
                      <div className="rule-examples">
                        {examples.map((ex, i) => {
                          const arabic =
                            typeof ex === "string" ? ex : ex.arabic;
                          const meaning =
                            typeof ex === "string" ? null : ex.meaning;
                          return (
                            <div key={i} className="rule-example">
                              <div className="ar" style={{ fontSize: 18 }}>
                                <TappableArabicText
                                  arabic={arabic}
                                  query={rulesQuery}
                                  onTokenClick={(tok, el) =>
                                    openListTokenTip(
                                      tok,
                                      null,
                                      null,
                                      el,
                                      meaning,
                                    )
                                  }
                                />
                              </div>
                              {meaning ? (
                                <div className="ur">
                                  <HighlightedText
                                    text={meaning}
                                    query={rulesQuery}
                                  />
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className={
                        known ? "icon-btn learned active" : "icon-btn learned"
                      }
                      title={known ? "Learned" : "Mark learned"}
                      aria-label={known ? "Learned" : "Mark learned"}
                      onClick={() => toggleSet("rules", r.id)}
                    >
                      <LearnedIcon active={known} />
                    </button>
                  </article>
                );
              })
            )}
          </div>
        ) : null}

        {screen === "duas" ? (
          <div className="card">
            <Chips
              value={duaCategory}
              onChange={setDuaCategory}
              options={[...DUA_CATEGORIES]}
            />
            <div style={{ height: 8 }} />
            <Chips
              value={duasProgress}
              onChange={(id) => setDuasProgress(id as ProgressFilter)}
              options={[
                { id: "todo", label: "To learn" },
                { id: "done", label: "Memorized" },
                { id: "all", label: "All" },
              ]}
            />
            {duaCategory === "quranic" ? (
              <>
                <div style={{ height: 8 }} />
                <Chips
                  value={String(duaJuz)}
                  onChange={(id) =>
                    setDuaJuz(id === "all" ? "all" : Number(id))
                  }
                  options={[
                    { id: "all", label: "All juz" },
                    ...Array.from({ length: 30 }, (_, i) => ({
                      id: String(i + 1),
                      label: `Juz ${i + 1}`,
                    })),
                  ]}
                />
              </>
            ) : null}
            <div style={{ height: 10 }} />
            <input
              className="search"
              placeholder="Search duas"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <p className="section-note" style={{ marginTop: 10 }}>
              Memorized {memorizedInScope}/{duasInScope.length} in this category
            </p>
            {filteredDuas.length === 0 ? (
              <div className="empty-state">
                <p>No duas in this filter.</p>
                <p className="muted">
                  Use Mark memorized on a dua, then filter To learn / Memorized.
                </p>
              </div>
            ) : (
              filteredDuas.map((d) => {
                const known = memorizedDuas.has(d.id);
                return (
                  <div key={d.id} className="list-item">
                    <div className="muted">
                      <HighlightedText
                        text={`${d.occasion || d.category}${d.juz ? ` · juz ${d.juz}` : ""}`}
                        query={search}
                      />
                    </div>
                    <div className="ar" style={{ fontSize: 22 }}>
                      <TappableArabicText
                        arabic={d.arabic}
                        query={search}
                        onTokenClick={(tok, el) =>
                          openListTokenTip(
                            tok,
                            d.ref ?? null,
                            d.page ?? null,
                            el,
                            d.urdu,
                          )
                        }
                      />
                    </div>
                    {d.urdu ? (
                      <div className="ur">
                        <HighlightedText text={d.urdu} query={search} />
                      </div>
                    ) : null}
                    <div className="actions-bar">
                      <button
                        type="button"
                        className={
                          known ? "icon-btn learned active" : "icon-btn learned"
                        }
                        title={known ? "Memorized" : "Mark memorized"}
                        aria-label={known ? "Memorized" : "Mark memorized"}
                        onClick={() => toggleSet("duas", d.id)}
                      >
                        <LearnedIcon active={known} />
                      </button>
                      {d.page ? (
                        <button
                          type="button"
                          className="icon-btn primary"
                          title="Open in Quran"
                          aria-label="Open in Quran"
                          onClick={() => {
                            setPage(d.page!);
                            setScreen("quran");
                          }}
                        >
                          <BookIcon />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      <Nav screen={screen} setScreen={setScreen} />
    </div>
  );
}
