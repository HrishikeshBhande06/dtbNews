const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Groq = require('groq-sdk');

// Initialize the official Groq SDK
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const outputPath = path.join(__dirname, '../content/generated/today.json');

async function runPipeline() {
    try {
        console.log("Starting automation: Fetching today's tech news...");

        // Fetching tech headlines
        const newsResponse = await axios.get('https://newsapi.org/v2/top-headlines', {
            params: {
                apiKey: process.env.NEWS_API_KEY,
                category: 'technology',
                language: 'en',
                pageSize: 10
            }
        });

        const rawArticles = newsResponse.data.articles || [];
        if (rawArticles.length === 0) {
            console.log("No new tech articles found. Pipeline exiting early.");
            return;
        }

        console.log(`Successfully fetched ${rawArticles.length} articles. Processing summaries on Groq...`);
        const processedArticles = [];

        for (let i = 0; i < rawArticles.length; i++) {
            const article = rawArticles[i];
            if (!article.title || !article.description) continue;

            const prompt = `
            Analyze this technology news item:
            Title: ${article.title}
            Description: ${article.description}

            Return exactly a clean JSON object containing these keys:
            {
              "summary": "A 2-sentence summary of the news.",
              "whyItMatters": "1-sentence detailing the impact on software developers or the tech industry.",
              "category": "Choose exactly one: AI, Web Dev, Mobile, Cloud, Security, or DevOps"
            }
            Return ONLY raw valid JSON text. Do not wrap it in markdown code blocks like \`\`\`json. Do not include introductory text or markdown formatting.
            `;

            try {
                // Using a fast, free-tier optimized text model on Groq
                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: 'You are a strict technical analyzer that outputs pure JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    model: 'openai/gpt-oss-20b', 
                    temperature: 0.1, // low temperature to ensure strict JSON adherence
                });

                const rawText = chatCompletion.choices[0]?.message?.content?.trim() || "";
                const cleanJson = JSON.parse(rawText);

                processedArticles.push({
                    id: `art-${Date.now()}-${i}`,
                    title: article.title,
                    source: article.source.name || "Tech Source",
                    url: article.url,
                    summary: cleanJson.summary,
                    whyItMatters: cleanJson.whyItMatters,
                    category: cleanJson.category,
                    publishedAt: article.publishedAt || new Date().toISOString()
                });

            } catch (aiError) {
                console.error(`Groq AI analysis failed for item ${i}. Applying safety fallback...`);
                // Fallback handling from your SDLC guidelines
                processedArticles.push({
                    id: `art-${Date.now()}-${i}`,
                    title: article.title,
                    source: article.source.name || "Tech Source",
                    url: article.url,
                    summary: article.description,
                    whyItMatters: "Direct pipeline title digest fallback applied.",
                    category: "General Tech",
                    publishedAt: article.publishedAt || new Date().toISOString()
                });
            }
        }

        const dailyBrief = {
            date: new Date().toISOString().split('T')[0],
            articles: processedArticles
        };

        fs.writeFileSync(outputPath, JSON.stringify(dailyBrief, null, 2));
        console.log("Success! today.json has been generated cleanly via Groq LPU engine.");

    } catch (error) {
        console.error("Critical pipeline automation error:", error.message);
    }
}

runPipeline();