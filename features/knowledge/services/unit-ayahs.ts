import { readFile, stat } from "fs/promises";
import path from "path";

export type CurriculumAyah = {
  id: string;
  unit: number;
  number?: number;
  arabic: string;
  meaning: string | null;
  ref?: string | null;
};

export type CurriculumUnitAyahs = {
  unit: number;
  ayahCount: number;
  withMeaning?: number;
  ayahs: CurriculumAyah[];
};

type UnitAyahsFile = {
  version: number;
  totalAyahs: number;
  withMeaning?: number;
  units: CurriculumUnitAyahs[];
};

function unitAyahsPath(): string {
  return path.join(process.cwd(), "data", "curriculum", "unit-ayahs.json");
}

let normalizedCache: {
  totalAyahs: number;
  withMeaning: number;
  units: CurriculumUnitAyahs[];
} | null = null;
let normalizedFromMtime = -1;

export async function loadUnitAyahs(): Promise<{
  totalAyahs: number;
  withMeaning: number;
  units: CurriculumUnitAyahs[];
}> {
  try {
    const filePath = unitAyahsPath();
    const mtimeMs = (await stat(filePath)).mtimeMs;
    if (normalizedCache && normalizedFromMtime === mtimeMs) {
      return normalizedCache;
    }

    const file = JSON.parse(await readFile(filePath, "utf8")) as UnitAyahsFile;
    const units = (file.units ?? []).map((unit) => {
      const seen = new Set<string>();
      const ayahs: CurriculumAyah[] = [];
      for (const [index, ayah] of (unit.ayahs ?? []).entries()) {
        const baseId = ayah.id || `u${unit.unit}-ayah-${index + 1}`;
        let id = baseId;
        if (seen.has(id)) {
          id = `${baseId}-${index + 1}`;
        }
        seen.add(id);
        ayahs.push({
          ...ayah,
          id,
          unit: Number(ayah.unit ?? unit.unit),
          number: ayah.number ?? index + 1,
        });
      }
      return {
        ...unit,
        unit: Number(unit.unit),
        ayahCount: ayahs.length,
        ayahs,
      };
    });
    const result = {
      totalAyahs: file.totalAyahs ?? 0,
      withMeaning:
        file.withMeaning ??
        units.reduce(
          (sum, unit) =>
            sum + unit.ayahs.filter((ayah) => Boolean(ayah.meaning)).length,
          0,
        ),
      units,
    };
    normalizedCache = result;
    normalizedFromMtime = mtimeMs;
    return result;
  } catch {
    return { totalAyahs: 0, withMeaning: 0, units: [] };
  }
}

/** Home / progress only needs ayah ids — avoid shipping Arabic text in RSC. */
export async function loadUnitAyahIdIndex(): Promise<
  Array<{ unit: number; ayahIds: string[] }>
> {
  const { units } = await loadUnitAyahs();
  return units.map((unit) => ({
    unit: unit.unit,
    ayahIds: unit.ayahs.map((a) => a.id),
  }));
}
