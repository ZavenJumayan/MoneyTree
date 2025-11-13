import fs from "fs";
import path from "path";

export interface VAD {
    valence: number;
    arousal: number;
    dominance: number;
}

interface LexiconEntry {
    valence: number;
    arousal: number;
    dominance: number;
}

let vadLexicon: Record<string, LexiconEntry> | null = null;


const FALLBACK_LEXICON: Record<string, LexiconEntry> = {
    happy: { valence: 0.85, arousal: 0.55, dominance: 0.62 },
    joy: { valence: 0.88, arousal: 0.60, dominance: 0.60 },
    excited: { valence: 0.80, arousal: 0.85, dominance: 0.65 },
    calm: { valence: 0.70, arousal: 0.25, dominance: 0.55 },
    relaxed: { valence: 0.78, arousal: 0.30, dominance: 0.60 },
    angry: { valence: 0.10, arousal: 0.85, dominance: 0.55 },
    stressed: { valence: 0.20, arousal: 0.80, dominance: 0.40 },
    sad: { valence: 0.15, arousal: 0.30, dominance: 0.35 },
    depressed: { valence: 0.10, arousal: 0.20, dominance: 0.30 },
    bored: { valence: 0.30, arousal: 0.15, dominance: 0.45 },
    adventure: { valence: 0.75, arousal: 0.75, dominance: 0.60 },
    fear: { valence: 0.10, arousal: 0.80, dominance: 0.30 },
    anxious: { valence: 0.20, arousal: 0.75, dominance: 0.35 },
    love: { valence: 0.90, arousal: 0.60, dominance: 0.65 },
};


function normalizeVAD(value: number): number {
    return (value + 1) / 2;
}

function loadLexiconFile(filePath: string, skipHeader: boolean = false): number {
    let loadedCount = 0;
    try {
        const data = fs.readFileSync(filePath, "utf8");
        const lines = data.split("\n");
        const startLine = skipHeader ? 1 : 0;

        for (let i = startLine; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (!trimmed) continue;

            const parts = trimmed.split("\t");
            if (parts.length < 3) continue;
            const term = parts[0];
            const val = parts[1];
            const ar = parts[2];
            const dom = parts[3] ?? "0.5";

            // Parse values (can be -1..1 or 0..1 scale)
            const valNum = parseFloat(val);
            const arNum = parseFloat(ar);
            const domNum = parseFloat(dom);

            if (isNaN(valNum) || isNaN(arNum) || isNaN(domNum)) continue;


            const normalizedVal = (valNum < 0 || valNum > 1) ? normalizeVAD(valNum) : valNum;
            const normalizedAr = (arNum < 0 || arNum > 1) ? normalizeVAD(arNum) : arNum;
            const normalizedDom = (domNum < 0 || domNum > 1) ? normalizeVAD(domNum) : domNum;

            vadLexicon![term.toLowerCase()] = {
                valence: normalizedVal,
                arousal: normalizedAr,
                dominance: normalizedDom,
            };
            loadedCount++;
        }
    } catch (error) {
        console.warn(`Failed to load lexicon file ${filePath}:`, error);
    }
    return loadedCount;
}

function loadLexicon(): Record<string, LexiconEntry> {
    if (vadLexicon) return vadLexicon;

    vadLexicon = { ...FALLBACK_LEXICON }; // Start with fallback for better coverage


    const nrcPath = path.join(process.cwd(), "data", "NRC-VAD-Lexicon-v2.1.txt");
    const nrcCount = loadLexiconFile(nrcPath, true); // Skip header


    const goemotionsPath = path.join(process.cwd(), "data", "goemotions-words-full.txt");
    const goemotionsCount = loadLexiconFile(goemotionsPath, false); // No header

    console.log(`Loaded lexicons: NRC VAD (${nrcCount} entries), GoEmotions (${goemotionsCount} entries)`);
    console.log(`Total lexicon entries: ${Object.keys(vadLexicon).length}`);

    return vadLexicon;
}

function classifyMood(vad: VAD): string {
    const moodCentroids: Record<string, VAD> = {
        happy:     { valence: 0.85, arousal: 0.65, dominance: 0.70 },
        sad:       { valence: 0.20, arousal: 0.25, dominance: 0.30 },
        angry:     { valence: 0.20, arousal: 0.85, dominance: 0.75 },
        fear:      { valence: 0.15, arousal: 0.85, dominance: 0.25 },
        relaxed:   { valence: 0.75, arousal: 0.35, dominance: 0.60 },
        adventure: { valence: 0.75, arousal: 0.80, dominance: 0.65 },
        love:      { valence: 0.90, arousal: 0.60, dominance: 0.70 },
        stressed:  { valence: 0.25, arousal: 0.80, dominance: 0.45 },
        bored:     { valence: 0.35, arousal: 0.20, dominance: 0.40 },
        neutral:   { valence: 0.50, arousal: 0.50, dominance: 0.50 },
    };

    let bestMood = "neutral";
    let minDistance = Infinity;

    for (const [mood, ref] of Object.entries(moodCentroids)) {
        const distance = Math.sqrt(
            (vad.valence - ref.valence) ** 2 +
            (vad.arousal - ref.arousal) ** 2 +
            (vad.dominance - ref.dominance) ** 2
        );

        if (distance < minDistance) {
            minDistance = distance;
            bestMood = mood;
        }
    }

    // Optional: log distances for debugging / tuning
    console.log("VAD distances:", Object.fromEntries(
        Object.entries(moodCentroids).map(([m, ref]) => [
            m,
            Math.sqrt(
                (vad.valence - ref.valence) ** 2 +
                (vad.arousal - ref.arousal) ** 2 +
                (vad.dominance - ref.dominance) ** 2
            ).toFixed(3),
        ])
    ));

    return bestMood;
}


export async function analyzeMood(tokens: string[]): Promise<{ mood: string; vad: VAD }> {
    const lex = loadLexicon();
    let sumV = 0,
        sumA = 0,
        sumD = 0,
        count = 0;

    const matchedTokens: string[] = [];

    for (const t of tokens) {
        const entry = lex[t];
        if (entry) {
            // Weight emotional words more strongly
            const isEmotional = entry.valence < 0.4 || entry.valence > 0.6 || entry.arousal > 0.6;

            if (["tired", "sleepy", "exhausted", "quiet", "peace"].includes(t)) {
                entry.valence = Math.min(entry.valence + 0.1, 1);
                entry.arousal = Math.max(entry.arousal - 0.2, 0);
            }

            const weight = isEmotional ? 2 : 1;

            sumV += entry.valence * weight;
            sumA += entry.arousal * weight;
            sumD += entry.dominance * weight;
            count += weight;

            matchedTokens.push(t);
        }
    }


    // Log for debugging
    if (count === 0) {
        console.log("No tokens matched in lexicon. Input tokens:", tokens);
        console.log("Lexicon size:", Object.keys(lex).length);
    }

    // Return normalized VAD scores (0..1 scale)
    // If no tokens matched, return neutral midpoint (0.5, 0.5, 0.5)
    const vad: VAD = count
        ? {
            valence: sumV / count,
            arousal: sumA / count,
            dominance: sumD / count,
        }
        : { valence: 0.5, arousal: 0.5, dominance: 0.5 };

    const mood = classifyMood(vad);

    // Debug logging
    console.log("Mood Analysis:", {
        inputTokens: tokens,
        matchedTokens,
        matchedCount: count,
        vad,
        mood,
    });

    return { mood, vad };
}
