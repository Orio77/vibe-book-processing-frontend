import type { OfflineLlmSettings } from './settings';

export class LlmRequestError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = 'LlmRequestError';
        this.status = status;
    }
}

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

function trimTrailingSlash(url: string): string {
    return url.replace(/\/+$/, '');
}

/**
 * OpenAI-compatible chat completions (POST .../chat/completions).
 * May fail in the browser due to provider CORS; use a local proxy or desktop shell if needed.
 */
export async function completeChat(
    settings: OfflineLlmSettings,
    messages: ChatMessage[],
): Promise<string> {
    const key = settings.apiKey.trim();
    if (!key) {
        throw new LlmRequestError('Add an API key in Offline LLM settings.');
    }

    const base = trimTrailingSlash(settings.baseUrl);
    const url = `${base}/chat/completions`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: settings.model,
            messages,
            temperature: 0.4,
        }),
    });

    if (!res.ok) {
        let detail = res.statusText;
        try {
            const body = (await res.json()) as { error?: { message?: string } };
            if (body.error?.message) detail = body.error.message;
        } catch {
            try {
                const t = await res.text();
                if (t) detail = t.slice(0, 500);
            } catch {
                /* ignore */
            }
        }
        throw new LlmRequestError(detail || `HTTP ${res.status}`, res.status);
    }

    const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
        throw new LlmRequestError('Empty response from model.');
    }
    return text;
}

/** Offline explain/query: mirrors server-side “whole chapter + selection” scope. */
export interface OfflineLlmReaderContext {
    readonly bookTitle: string;
    readonly chapterTitle: string;
    readonly chapterStartPage?: number;
    readonly chapterEndPage?: number;
    /** Full chapter plain text from the pack (pages in chapter range). */
    readonly fullChapterText: string;
}

function buildExcerptBlock(sentences: { sentenceId: number; sentenceContent: string }[]): string {
    return sentences
        .map((s, i) => `[${i + 1}] (sentence id ${s.sentenceId}) ${s.sentenceContent}`)
        .join('\n\n');
}

function formatOfflineChapterPreamble(ctx: OfflineLlmReaderContext): string {
    const pages =
        ctx.chapterStartPage != null && ctx.chapterEndPage != null
            ? `\nChapter pages in this edition: ${ctx.chapterStartPage}–${ctx.chapterEndPage}.`
            : '';
    const body = ctx.fullChapterText.trim();
    const chapterBlock = body.length > 0
        ? body
        : '(No chapter body was found in the pack for this page range.)';

    return `Book: ${ctx.bookTitle}\nChapter: ${ctx.chapterTitle}${pages}

---
Full chapter text (use as primary context, like the online reader backend):

${chapterBlock}

---`;
}

export async function explainSentences(
    settings: OfflineLlmSettings,
    sentences: { sentenceId: number; sentenceContent: string }[],
    readerContext?: OfflineLlmReaderContext,
): Promise<string> {
    const block = buildExcerptBlock(sentences);
    const head = readerContext ? `${formatOfflineChapterPreamble(readerContext)}\n\n` : '';
    return completeChat(settings, [
        {
            role: 'system',
            content:
                'You explain passages from a book chapter. The user sends the full chapter text plus numbered excerpts they selected. Ground your explanation in the full chapter; pay special attention to the selected excerpts.',
        },
        {
            role: 'user',
            content: `${head}Explain the following selected excerpts in light of the full chapter above:\n\n${block}`,
        },
    ]);
}

export async function answerQueryWithContext(
    settings: OfflineLlmSettings,
    query: string,
    sentences: { sentenceId: number; sentenceContent: string }[],
    readerContext?: OfflineLlmReaderContext,
): Promise<string> {
    const block = buildExcerptBlock(sentences);
    const head = readerContext ? `${formatOfflineChapterPreamble(readerContext)}\n\n` : '';
    const focus = sentences.length > 0
        ? `The reader highlighted these sentences as optional focus:\n\n${block}\n\n`
        : '';
    return completeChat(settings, [
        {
            role: 'system',
            content:
                'You answer questions about a book chapter. The user sends the full chapter text. Use it as the main source of truth. If numbered excerpts are provided, treat them as the reader’s focus but still use the whole chapter when needed.',
        },
        {
            role: 'user',
            content: `${head}Question: ${query}\n\n${focus}Answer using the full chapter text above.`,
        },
    ]);
}

export async function generateIdeaExplanation(
    settings: OfflineLlmSettings,
    ideaTitle: string,
    argumentsTexts: string[],
): Promise<string> {
    const argsBlock = argumentsTexts.length
        ? `Arguments:\n${argumentsTexts.map((t, i) => String(i + 1) + '. ' + t).join('\n')}`
        : 'No arguments were stored for this idea.';
    return completeChat(settings, [
        {
            role: 'system',
            content: 'You write short, clear explanations of ideas from nonfiction or literature.',
        },
        {
            role: 'user',
            content: `Explain this idea briefly (2–4 short paragraphs):\n\nTitle: ${ideaTitle}\n\n${argsBlock}`,
        },
    ]);
}
