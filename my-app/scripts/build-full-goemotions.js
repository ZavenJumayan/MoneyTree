

const fs = require("fs");
const path = require("path");

const FILES = [
    "../data/goemotions-train.tsv",
    "../data/goemotions-dev.tsv",
    "../data/goemotions-test.tsv",
];


const OUTPUT = path.join(__dirname, "../data/goemotions-words-full.txt");


const EMOTION_LABELS = [
    "admiration", "amusement", "anger", "annoyance", "approval", "caring",
    "confusion", "curiosity", "desire", "disappointment", "disapproval",
    "disgust", "embarrassment", "excitement", "fear", "gratitude", "grief",
    "joy", "love", "nervousness", "optimism", "pride", "realization",
    "relief", "remorse", "sadness", "surprise", "neutral"
];


const GOEMOTIONS_TO_MOOD = {
    excitement: "adventure", joy: "adventure", love: "adventure", pride: "adventure",
    amusement: "adventure", approval: "adventure", gratitude: "adventure", optimism: "adventure",
    relief: "relax", caring: "relax", admiration: "relax", desire: "relax",
    anger: "angry/stressed", annoyance: "angry/stressed", disapproval: "angry/stressed",
    disgust: "angry/stressed", fear: "angry/stressed", nervousness: "angry/stressed",
    embarrassment: "angry/stressed", grief: "angry/stressed",
    sadness: "sad", disappointment: "sad", remorse: "sad", confusion: "sad",
    neutral: "neutral", surprise: "neutral", curiosity: "neutral", realization: "neutral",
};

// Average VAD for each mood
const MOOD_VAD = {
    "adventure": { valence: 0.78, arousal: 0.80, dominance: 0.62 },
    "relax": { valence: 0.75, arousal: 0.30, dominance: 0.55 },
    "angry/stressed": { valence: 0.20, arousal: 0.75, dominance: 0.40 },
    "sad": { valence: 0.20, arousal: 0.35, dominance: 0.35 },
    "neutral": { valence: 0.50, arousal: 0.50, dominance: 0.50 },
};

function cleanWords(text) {
    return text
        .toLowerCase()
        .replace(/[\p{P}\p{S}]/gu, " ")
        .split(/\s+/)
        .filter(w => w.length > 2);
}

function processFile(filePath, stats) {
    if (!fs.existsSync(filePath)) return;
    const lines = fs.readFileSync(filePath, "utf8").split("\n");

    for (const line of lines) {
        const parts = line.split("\t");
        if (parts.length < 2) continue;
        const text = parts[0];

// Convert numeric emotion IDs to emotion names
        const emotionIds = parts[1].split(",").map(x => x.trim());
        const emotions = emotionIds
            .map(id => EMOTION_LABELS[parseInt(id)])
            .filter(Boolean);

        const moods = new Set();
        for (const e of emotions) {
            const mood = GOEMOTIONS_TO_MOOD[e.trim()];
            if (mood) moods.add(mood);
        }

        const words = cleanWords(text);
        for (const w of words) {
            if (!stats[w]) stats[w] = {};
            for (const mood of moods) {
                stats[w][mood] = (stats[w][mood] || 0) + 1;
            }
        }
    }
}

(async () => {
    console.log("🔄 Building full GoEmotions lexicon...");
    const stats = {};

    for (const f of FILES) processFile(path.resolve(__dirname, f), stats);


    const lines = [];
    for (const [word, moodCounts] of Object.entries(stats)) {
        let total = 0, bestMood = null, max = 0;
        for (const [m, c] of Object.entries(moodCounts)) {
            total += c;
            if (c > max) { max = c; bestMood = m; }
        }
        if (!bestMood) continue;

        const vad = MOOD_VAD[bestMood];
        lines.push(`${word}\t${vad.valence}\t${vad.arousal}\t${vad.dominance}`);
    }

    fs.writeFileSync(OUTPUT, lines.join("\n"));
    console.log(`✅ Wrote ${lines.length.toLocaleString()} entries to ${OUTPUT}`);
})();
