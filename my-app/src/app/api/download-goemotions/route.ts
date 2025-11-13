import { NextResponse } from "next/server";
import https from "https";
import fs from "fs";
import path from "path";

// GoEmotions emotion to mood mapping
const GOEMOTIONS_TO_MOOD: Record<string, { mood: string; vad: { v: number; a: number; d: number } }> = {
    // Adventure
    'excitement': { mood: 'adventure', vad: { v: 0.75, a: 0.75, d: 0.60 } },
    'joy': { mood: 'adventure', vad: { v: 0.85, a: 0.60, d: 0.60 } },
    'love': { mood: 'adventure', vad: { v: 0.90, a: 0.60, d: 0.65 } },
    'pride': { mood: 'adventure', vad: { v: 0.75, a: 0.50, d: 0.70 } },
    'amusement': { mood: 'adventure', vad: { v: 0.80, a: 0.55, d: 0.60 } },
    
    // Relax
    'relief': { mood: 'relax', vad: { v: 0.70, a: -0.30, d: 0.50 } },
    'caring': { mood: 'relax', vad: { v: 0.75, a: 0.20, d: 0.55 } },
    'admiration': { mood: 'relax', vad: { v: 0.75, a: 0.30, d: 0.60 } },
    
    // Angry/Stressed
    'anger': { mood: 'angry/stressed', vad: { v: 0.10, a: 0.85, d: 0.55 } },
    'annoyance': { mood: 'angry/stressed', vad: { v: 0.20, a: 0.70, d: 0.40 } },
    'disapproval': { mood: 'angry/stressed', vad: { v: 0.15, a: 0.60, d: 0.35 } },
    'disgust': { mood: 'angry/stressed', vad: { v: 0.05, a: 0.75, d: 0.30 } },
    'fear': { mood: 'angry/stressed', vad: { v: 0.10, a: 0.80, d: 0.30 } },
    'nervousness': { mood: 'angry/stressed', vad: { v: 0.20, a: 0.75, d: 0.35 } },
    
    // Sad
    'sadness': { mood: 'sad', vad: { v: 0.15, a: 0.30, d: 0.35 } },
    'disappointment': { mood: 'sad', vad: { v: 0.20, a: -0.20, d: -0.40 } },
    'grief': { mood: 'sad', vad: { v: 0.10, a: 0.40, d: 0.20 } },
    'remorse': { mood: 'sad', vad: { v: 0.15, a: 0.25, d: 0.20 } },
};

function normalizeVAD(value: number): number {
    return (value + 1) / 2;
}

export async function POST(req: Request) {
    try {
        const GOEMOTIONS_URL = 'https://raw.githubusercontent.com/google-research/google-research/master/goemotions/data/train.tsv';
        const outputPath = path.join(process.cwd(), 'data', 'goemotions-words.txt');
        
        // Download GoEmotions dataset
        const data = await new Promise<string>((resolve, reject) => {
            https.get(GOEMOTIONS_URL, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to download: ${res.statusCode}`));
                    return;
                }
                
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });
        
        // Process dataset
        const lines = data.split('\n');
        const wordMoodCounts: Record<string, Record<string, number>> = {};
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            const parts = line.split('\t');
            if (parts.length < 3) continue;
            
            const text = parts[0];
            const emotions = parts[1].split(',');
            
            // Extract words
            const words = text
                .toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 2);
            
            // Count words per mood
            for (const emotion of emotions) {
                const trimmed = emotion.trim();
                const mapping = GOEMOTIONS_TO_MOOD[trimmed];
                if (!mapping) continue;
                
                for (const word of words) {
                    if (!wordMoodCounts[word]) {
                        wordMoodCounts[word] = {};
                    }
                    if (!wordMoodCounts[word][mapping.mood]) {
                        wordMoodCounts[word][mapping.mood] = 0;
                    }
                    wordMoodCounts[word][mapping.mood]++;
                }
            }
        }
        
        // Generate lexicon entries
        const entries: string[] = [];
        for (const [word, moodCounts] of Object.entries(wordMoodCounts)) {
            // Find dominant mood
            let maxMood = '';
            let maxCount = 0;
            let totalCount = 0;
            
            for (const [mood, count] of Object.entries(moodCounts)) {
                totalCount += count;
                if (count > maxCount) {
                    maxCount = count;
                    maxMood = mood;
                }
            }
            
            // Only include words with strong association
            if (maxCount >= 3 && maxCount / totalCount > 0.5 && maxMood) {
                const mapping = Object.values(GOEMOTIONS_TO_MOOD).find(m => m.mood === maxMood);
                if (mapping) {
                    const vad = mapping.vad;
                    entries.push(`${word}\t${normalizeVAD(vad.v)}\t${normalizeVAD(vad.a)}\t${normalizeVAD(vad.d)}`);
                }
            }
        }
        
        // Write to file
        fs.writeFileSync(outputPath, entries.join('\n'));
        
        return NextResponse.json({
            success: true,
            message: `Downloaded and processed GoEmotions dataset`,
            entries: entries.length,
        });
        
    } catch (error) {
        console.error('Error downloading GoEmotions:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

