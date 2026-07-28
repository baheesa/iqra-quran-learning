"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUiLocale } from "@/features/i18n/locale-context";
import { OfflineIndicator } from "@/features/auth/components/OfflineIndicator";
import {
  learnedArabicFormsFromIds,
  loadLearnedWordIds,
} from "@/features/knowledge/components/curriculum-filters";
import { QuranPageView } from "@/features/reading/components/QuranPage";
import { QuranSearchPanel } from "@/features/reading/components/QuranSearchPanel";
import {
  ReadingToolbar,
  type QuranFontScale,
} from "@/features/reading/components/ReadingToolbar";
import { SearchMatchesView } from "@/features/reading/components/SearchMatchesView";
import { WordMeaningTooltip } from "@/features/reading/components/WordMeaningTooltip";
import { QURAN_PAGE_COUNT } from "@/features/reading/constants";
import {
  buildMatchList,
  findHitInAyah,
  suggestSearchForms,
  type AyahCard,
  type MatchItem,
  type SearchHit,
} from "@/features/reading/lib/quran-search";
import { createBookmarkService } from "@/features/reading/services/bookmark-service";
import { createProgressService } from "@/features/reading/services/progress-service";
import { createReadingService } from "@/features/reading/services/reading-service";
import { createTappedWordsService } from "@/features/reading/services/tapped-words-service";
import { normalizeArabic } from "@/features/teacher/domain/arabic";
import { createBrowserLocalStorage } from "@/lib/storage/adapter";
import type {
  BookmarkRecord,
  JuzInfo,
  QuranPageData,
  SelectedWordInfo,
  SurahInfo,
} from "@/types/quran";

type QuranReaderProps = {
  initialPage: number;
  /** When true, resume last saved page if available. */
  resumeFromStorage?: boolean;
  surahs: SurahInfo[];
  juzIndex: JuzInfo[];
  /** Curriculum word id → arabic (for mushaf learned tint). */
  wordFormById?: Record<string, string>;
};

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type FocusTarget = {
  ayahId: string;
  wordId?: string;
};

type MatchTip = {
  wordId: string;
  arabic: string;
  anchor: HTMLElement;
};

export function QuranReader({
  initialPage,
  resumeFromStorage = true,
  surahs,
  juzIndex,
  wordFormById = {},
}: QuranReaderProps) {
  const { t } = useUiLocale();
  const storage = useMemo(() => createBrowserLocalStorage(), []);
  const readingService = useMemo(() => {
    const progress = createProgressService(storage);
    const bookmarks = createBookmarkService(storage);
    return createReadingService({ progress, bookmarks });
  }, [storage]);
  const tappedWords = useMemo(
    () => createTappedWordsService(storage),
    [storage],
  );

  const [pageNumber, setPageNumber] = useState(initialPage);
  const [page, setPage] = useState<QuranPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<SelectedWordInfo | null>(
    null,
  );
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [fontScale, setFontScale] = useState<QuranFontScale>(1);
  const [learnedForms, setLearnedForms] = useState<Set<string>>(new Set());

  const [showSearch, setShowSearch] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [quranQuery, setQuranQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<Record<string, SearchHit[]>>(
    {},
  );
  const [ayahCards, setAyahCards] = useState<Record<string, AyahCard>>({});
  const [searchReady, setSearchReady] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [matchItems, setMatchItems] = useState<MatchItem[]>([]);
  const [matchQuery, setMatchQuery] = useState("");
  const [matchMode, setMatchMode] = useState<"arabic" | "urdu" | "both">(
    "arabic",
  );
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [openAyahUrdu, setOpenAyahUrdu] = useState<Set<string>>(
    () => new Set(),
  );
  const [matchTip, setMatchTip] = useState<MatchTip | null>(null);
  const searchLoadRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("quran.reading.fontScale");
      if (raw === "0" || raw === "1" || raw === "2") {
        setFontScale(Number(raw) as QuranFontScale);
      }
      const ids = loadLearnedWordIds();
      setLearnedForms(learnedArabicFormsFromIds(ids, wordFormById));
    } catch {
      // ignore
    }
  }, [wordFormById]);

  useEffect(() => {
    const tmr = window.setTimeout(() => setDebouncedQuery(quranQuery), 180);
    return () => window.clearTimeout(tmr);
  }, [quranQuery]);

  const ensureSearchData = useCallback((): Promise<void> => {
    if (searchReady) return Promise.resolve();
    if (searchLoadRef.current) return searchLoadRef.current;
    setSearchLoading(true);
    searchLoadRef.current = Promise.all([
      fetch("/api/v1/quran/search-index").then((r) => r.json()),
      fetch("/api/v1/quran/ayah-cards").then((r) => r.json()),
    ])
      .then(([idxPayload, cardsPayload]) => {
        const forms =
          (idxPayload as ApiSuccess<{ forms?: Record<string, SearchHit[]> }>)
            .data?.forms ?? {};
        const ayahs =
          (cardsPayload as ApiSuccess<{ ayahs?: Record<string, AyahCard> }>)
            .data?.ayahs ?? {};
        setSearchIndex(forms);
        setAyahCards(ayahs);
        setSearchReady(true);
      })
      .catch(() => {
        setError("Search data could not load");
      })
      .finally(() => setSearchLoading(false));
    return searchLoadRef.current;
  }, [searchReady]);

  useEffect(() => {
    const idle = window.setTimeout(() => {
      void ensureSearchData();
    }, 2500);
    return () => window.clearTimeout(idle);
  }, [ensureSearchData]);

  const isFormLearned = useCallback(
    (arabic: string) => {
      const key = normalizeArabic(arabic);
      return Boolean(key && learnedForms.has(key));
    },
    [learnedForms],
  );

  function handleFontScaleChange(scale: QuranFontScale) {
    setFontScale(scale);
    try {
      localStorage.setItem("quran.reading.fontScale", String(scale));
    } catch {
      // ignore
    }
  }

  const loadPage = useCallback(
    async (nextPage: number) => {
      if (nextPage < 1 || nextPage > QURAN_PAGE_COUNT) {
        return;
      }

      setIsLoading(true);
      setError(null);
      setSelectedWord(null);
      setMatchTip(null);

      try {
        const response = await fetch(`/api/v1/quran/page/${nextPage}`);
        const payload = (await response.json()) as
          | ApiSuccess<QuranPageData>
          | { success: false; error: { message: string } };

        if (!response.ok || !payload.success) {
          throw new Error(
            !payload.success ? payload.error.message : "صفحہ لوڈ نہیں ہو سکا",
          );
        }

        setPage(payload.data);
        setPageNumber(payload.data.page);
        readingService.rememberPage(payload.data);
        setIsBookmarked(readingService.isBookmarked(payload.data.page));
        setBookmarks(readingService.listBookmarks());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "صفحہ لوڈ نہیں ہو سکا",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [readingService],
  );

  useEffect(() => {
    const saved = resumeFromStorage ? readingService.resumePosition() : null;
    const startPage = saved?.page ?? initialPage;
    void loadPage(startPage);
    // Intentionally run once on mount for the entry route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!page || !focusTarget) return;
    const ayahEl = document.querySelector<HTMLElement>(
      `[data-ayah-id="${CSS.escape(focusTarget.ayahId)}"]`,
    );
    const wordEl = focusTarget.wordId
      ? document.querySelector<HTMLElement>(
          `[data-word-id="${CSS.escape(focusTarget.wordId)}"]`,
        )
      : null;
    (wordEl ?? ayahEl)?.scrollIntoView({ block: "center", behavior: "smooth" });
    const tmr = window.setTimeout(() => setFocusTarget(null), 9000);
    return () => window.clearTimeout(tmr);
  }, [page, focusTarget]);

  useEffect(() => {
    if (!selectedWord && !matchTip) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("[data-quran-word='true']")) return;
      if (target?.closest?.("[role='tooltip']")) return;
      setSelectedWord(null);
      setMatchTip(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [selectedWord, matchTip]);

  const handleMeaningResolved = useCallback(
    (info: SelectedWordInfo, meaning: string | null) => {
      tappedWords.record({
        arabic: info.arabic,
        meaning,
        surahId: info.surahId,
        ayahNumber: info.ayahNumber,
        page: info.page,
      });
    },
    [tappedWords],
  );

  const matchPreview = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return { items: [] as MatchItem[], mode: "arabic" as const };
    }
    return buildMatchList(debouncedQuery, searchIndex, ayahCards, 60);
  }, [debouncedQuery, searchIndex, ayahCards]);

  const searchSuggestions = useMemo(() => {
    const q = quranQuery.trim();
    if (q.length < 1 || q.length > 24) return [] as string[];
    return suggestSearchForms(q, searchIndex, 8);
  }, [quranQuery, searchIndex]);

  const ayahUrduById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [id, card] of Object.entries(ayahCards)) {
      map[id] = card.ur;
    }
    return map;
  }, [ayahCards]);

  const currentSurahId = page?.ayahs[0]?.surahId ?? 1;
  const currentSurah =
    surahs.find((surah) => surah.id === currentSurahId) ?? surahs[0];

  function handleToggleBookmark() {
    if (!page || !currentSurah) {
      return;
    }

    const result = readingService.toggleBookmark(
      page,
      `${currentSurah.nameArabic} — صفحہ ${page.page}`,
    );
    setIsBookmarked(result.bookmarked);
    setBookmarks(result.bookmarks);
  }

  function openMatchInQuran(m: MatchItem) {
    setFocusTarget({ ayahId: m.ayahId, wordId: m.matchedWordId });
    setShowMatches(false);
    setShowSearch(false);
    setMatchTip(null);
    setSelectedWord(null);
    void loadPage(m.page);
  }

  function openMatchesPage() {
    setMatchItems(matchPreview.items);
    setMatchQuery(debouncedQuery.trim());
    setMatchMode(matchPreview.mode);
    setShowSearch(false);
    setShowMatches(true);
    setSelectedWord(null);
    setMatchTip(null);
  }

  function toggleAyahUrdu(ayahId: string) {
    void ensureSearchData();
    setOpenAyahUrdu((prev) => {
      const next = new Set(prev);
      if (next.has(ayahId)) next.delete(ayahId);
      else next.add(ayahId);
      return next;
    });
  }

  function handleMatchWordTip(
    token: string,
    ayahId: string,
    _page: number,
    el: HTMLElement,
  ) {
    const hit = findHitInAyah(token, ayahId, searchIndex);
    if (!hit) return;
    setSelectedWord(null);
    setMatchTip({
      wordId: hit.w,
      arabic: hit.ar || token,
      anchor: el,
    });
  }

  if (showMatches) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-5 md:px-6 md:py-6">
        {matchTip ? (
          <WordMeaningTooltip
            wordId={matchTip.wordId}
            arabic={matchTip.arabic}
            anchorEl={matchTip.anchor}
            onResolved={() => undefined}
          />
        ) : null}
        <SearchMatchesView
          query={matchQuery}
          items={matchItems}
          mode={matchMode}
          onBack={() => {
            setShowMatches(false);
            setShowSearch(true);
            setMatchTip(null);
            void ensureSearchData();
          }}
          onOpen={openMatchInQuran}
          onWordTip={handleMatchWordTip}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-5 md:px-6 md:py-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted text-xs tracking-wide uppercase">
            {t("reading.subtitle")}
          </p>
          <h1 className="text-primary text-xl tracking-tight md:text-2xl">
            {t("reading.title")}
          </h1>
        </div>
        {currentSurah ? (
          <p
            className="font-quran text-muted hidden text-sm sm:block"
            dir="rtl"
            lang="ar"
          >
            {currentSurah.nameArabic}
            <span className="text-border mx-1.5 font-ui">·</span>
            <span className="font-ui text-xs">Juz {page?.juz ?? 1}</span>
          </p>
        ) : null}
      </header>

      <OfflineIndicator />

      <ReadingToolbar
        surahs={surahs}
        juzIndex={juzIndex}
        currentJuz={page?.juz ?? 1}
        currentSurahId={currentSurahId}
        page={pageNumber}
        isLoading={isLoading}
        isBookmarked={isBookmarked}
        fontScale={fontScale}
        searchOpen={showSearch}
        onSelectPage={(next) => void loadPage(next)}
        onPrevious={() => void loadPage(pageNumber - 1)}
        onNext={() => void loadPage(pageNumber + 1)}
        onToggleBookmark={handleToggleBookmark}
        onFontScaleChange={handleFontScaleChange}
        onToggleSearch={() => {
          setShowSearch((v) => {
            const next = !v;
            if (next) void ensureSearchData();
            return next;
          });
        }}
      />

      {showSearch ? (
        <QuranSearchPanel
          query={quranQuery}
          onQueryChange={setQuranQuery}
          suggestions={searchSuggestions}
          loading={searchLoading}
          previewItems={matchPreview.items}
          previewMode={matchPreview.mode}
          onPickSuggestion={setQuranQuery}
          onOpenMatch={openMatchInQuran}
          onViewAll={openMatchesPage}
        />
      ) : null}

      {error ? (
        <p className="border-warning/40 bg-warning/10 rounded-xl border px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      {isLoading && !page ? (
        <p className="text-muted py-16 text-center text-sm">Loading page…</p>
      ) : null}

      {page ? (
        <QuranPageView
          page={page}
          surahs={surahs}
          selectedWordId={selectedWord?.id ?? null}
          focusedAyahId={focusTarget?.ayahId ?? null}
          focusedWordId={focusTarget?.wordId ?? null}
          openAyahUrduIds={openAyahUrdu}
          ayahUrduById={ayahUrduById}
          fontScale={fontScale}
          isFormLearned={isFormLearned}
          onSelectWord={setSelectedWord}
          onMeaningResolved={handleMeaningResolved}
          onToggleAyahUrdu={toggleAyahUrdu}
        />
      ) : null}

      <BookmarksList
        bookmarks={bookmarks}
        onOpen={(pageToOpen) => void loadPage(pageToOpen)}
        onRemove={(pageToRemove) => {
          const bookmarkService = createBookmarkService(storage);
          bookmarkService.remove(pageToRemove);
          setBookmarks(bookmarkService.list());
          if (pageNumber === pageToRemove) {
            setIsBookmarked(false);
          }
        }}
      />
    </div>
  );
}

function BookmarksList({
  bookmarks,
  onOpen,
  onRemove,
}: {
  bookmarks: BookmarkRecord[];
  onOpen: (page: number) => void;
  onRemove: (page: number) => void;
}) {
  if (bookmarks.length === 0) {
    return null;
  }

  return (
    <section className="border-border bg-surface/60 rounded-2xl border p-4">
      <h2 className="text-primary mb-3 text-base">Bookmarks</h2>
      <ul className="space-y-2">
        {bookmarks.map((bookmark) => (
          <li
            key={bookmark.id}
            className="border-border bg-surface flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm"
          >
            <button
              type="button"
              className="text-start"
              onClick={() => onOpen(bookmark.page)}
            >
              {bookmark.title}
            </button>
            <button
              type="button"
              className="text-muted hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-lg"
              onClick={() => onRemove(bookmark.page)}
              title="Remove bookmark"
              aria-label="Remove bookmark"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
