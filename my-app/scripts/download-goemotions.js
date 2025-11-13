// Script to download and process GoEmotions dataset
// Run with: node scripts/download-goemotions.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const GOEMOTIONS_URL = 'https://raw.githubusercontent.com/google-research/google-research/master/goemotions/data/train.tsv';
const OUTPUT_PATH = path.join(__dirname, '../data/goemotions-words.txt');
const GOEMOTION_LABELS = [
    "admiration","amusement","anger","annoyance","approval","caring",
    "confusion","curiosity","desire","disappointment","disapproval",
    "disgust","embarrassment","excitement","fear","gratitude","grief",
    "joy","love","nervousness","optimism","pride","realization",
    "relief","remorse","sadness","surprise","neutral"
];
// Map GoEmotions 27 categories to our 5 mood categories
const GOEMOTIONS_TO_MOOD = {
    // Adventure (high valence + high arousal)
    'excitement': 'adventure',
    'joy': 'adventure',
    'love': 'adventure',
    'pride': 'adventure',
    'amusement': 'adventure',
    'approval': 'adventure',
    'gratitude': 'adventure',
    'optimism': 'adventure',

    // Relax (high valence + low arousal)
    'relief': 'relax',
    'caring': 'relax',
    'admiration': 'relax',
    'desire': 'relax',

    // Angry/Stressed (low valence + high arousal)
    'anger': 'angry/stressed',
    'annoyance': 'angry/stressed',
    'disapproval': 'angry/stressed',
    'disgust': 'angry/stressed',
    'fear': 'angry/stressed',
    'nervousness': 'angry/stressed',
    'embarrassment': 'angry/stressed',
    'grief': 'angry/stressed',

    // Sad (low valence + low arousal)
    'sadness': 'sad',
    'disappointment': 'sad',
    'remorse': 'sad',
    'confusion': 'sad',

    // Neutral
    'neutral': 'neutral',
    'surprise': 'neutral',
    'curiosity': 'neutral',
    'realization': 'neutral',
};

// Estimated VAD scores for each mood category
const MOOD_VAD = {
    'adventure': { valence: 0.75, arousal: 0.75, dominance: 0.60 },
    'relax': { valence: 0.75, arousal: 0.25, dominance: 0.55 },
    'angry/stressed': { valence: 0.15, arousal: 0.75, dominance: 0.40 },
    'sad': { valence: 0.15, arousal: 0.25, dominance: 0.30 },
    'neutral': { valence: 0.50, arousal: 0.50, dominance: 0.50 },
};

function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        console.log(`Downloading GoEmotions dataset from ${url}...`);
        const file = fs.createWriteStream(outputPath);

        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded to ${outputPath}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(outputPath, () => {});
            reject(err);
        });
    });
}

function extractWordsFromText(text) {
    // Simple word extraction (same as tokenizer)
    return text
        .toLowerCase()
        .replace(/[\p{P}\p{S}]/gu, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2); // Filter out very short words
}

function processGoEmotions(inputPath, outputPath) {
    const data = fs.readFileSync(inputPath, 'utf8');
    const lines = data.split('\n');

    const wordMoodCounts = {}; // word -> { mood -> count }
    let processed = 0;

    for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.split('\t');
        if (parts.length < 3) continue;

        const text = parts[0];
        const emotions = parts[1].split(',').map(id => GOEMOTION_LABELS[parseInt(id)]);

        const words = extractWordsFromText(text);
        const moods = new Set();

        // Map emotions to moods
        for (const emotion of emotions) {
            const mood = GOEMOTIONS_TO_MOOD[emotion.trim()];
            if (mood) moods.add(mood);
        }

        // Count words for each mood
        for (const word of words) {
            if (!wordMoodCounts[word]) {
                wordMoodCounts[word] = {};
            }
            for (const mood of moods) {
                wordMoodCounts[word][mood] = (wordMoodCounts[word][mood] || 0) + 1;
            }
        }

        processed++;
        if (processed % 1000 === 0) {
            console.log(`Processed ${processed} lines...`);
        }
    }

    // Generate lexicon entries
    const lexiconEntries = [];
    for (const [word, moodCounts] of Object.entries(wordMoodCounts)) {
        // Find the most common mood for this word
        let maxMood = null;
        let maxCount = 0;
        let totalCount = 0;

        for (const [mood, count] of Object.entries(moodCounts)) {
            totalCount += count;
            if (count > maxCount) {
                maxCount = count;
                maxMood = mood;
            }
        }

        // Only include words with strong association (at least 3 occurrences, >50% of occurrences)
        if (maxCount >= 2 && maxCount / totalCount > 0.25 && maxMood) {
            const vad = MOOD_VAD[maxMood];
            lexiconEntries.push({
                word,
                mood: maxMood,
                valence: vad.valence,
                arousal: vad.arousal,
                dominance: vad.dominance,
                confidence: maxCount / totalCount,
            });
        }
    }

    // Write to output file in NRC VAD format
    const output = lexiconEntries
        .sort((a, b) => b.confidence - a.confidence)
        .map(e => `${e.word}\t${e.valence}\t${e.arousal}\t${e.dominance}`)
        .join('\n');

    fs.writeFileSync(outputPath, output);
    console.log(`\nExtracted ${lexiconEntries.length} words from GoEmotions dataset`);
    console.log(`Written to ${outputPath}`);
}

async function main() {
    const inputPath = path.join(__dirname, '../data/goemotions-train.tsv');

    try {
        // Download if not exists
        if (!fs.existsSync(inputPath)) {
            await downloadFile(GOEMOTIONS_URL, inputPath);
        } else {
            console.log('GoEmotions dataset already downloaded');
        }

        // Process and extract words
        processGoEmotions(inputPath, OUTPUT_PATH);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();

