import { unzipSync, strFromU8 } from 'fflate';
import type {
    Chapter,
    ChapterSummary,
    IdeaArgumentDTO,
    IdeaExplanationDTO,
    IdeaWithSentences,
    PDFChatResponse,
    Sentence,
} from '@/types';
import {
    OFFLINE_BUNDLE_SCHEMA_VERSION,
    OFFLINE_BUNDLE_SCHEMA_VERSION_LEGACY,
    type OfflineBookPayload,
    type OfflineBundleManifest,
    type ParsedOfflineBundle,
} from '@/types/offlineBundle';
import { buildParsedBundleFromBook } from './bundleFromBook';

const SUPPORTED_OFFLINE_SCHEMA_VERSIONS = new Set<number>([
    OFFLINE_BUNDLE_SCHEMA_VERSION,
    OFFLINE_BUNDLE_SCHEMA_VERSION_LEGACY,
]);

const MANIFEST = 'manifest.json';
const BOOK = 'book.json';

function parseJson<T>(raw: string, label: string): T {
    try {
        return JSON.parse(raw) as T;
    } catch {
        throw new Error(`Invalid JSON in ${label}`);
    }
}

function normalizeNumericRecord<T>(rec: Record<string, unknown> | undefined): Record<number, T> {
    if (!rec || typeof rec !== 'object') return {};
    const out: Record<number, T> = {};
    for (const [k, v] of Object.entries(rec)) {
        const n = Number(k);
        if (!Number.isFinite(n)) continue;
        out[n] = v as T;
    }
    return out;
}

function sentencesByPageFromWire(raw: unknown): Record<number, Sentence[]> {
    if (!raw || typeof raw !== 'object') return {};
    const rec = raw as Record<string, unknown>;
    const out: Record<number, Sentence[]> = {};
    for (const [k, v] of Object.entries(rec)) {
        const page = Number(k);
        if (!Number.isFinite(page) || !Array.isArray(v)) continue;
        out[page] = v as Sentence[];
    }
    return out;
}

export function parseOfflineBundleZip(arrayBuffer: ArrayBuffer): ParsedOfflineBundle {
    let unzipped: Record<string, Uint8Array>;
    try {
        unzipped = unzipSync(new Uint8Array(arrayBuffer));
    } catch {
        throw new Error('Could not read ZIP file.');
    }

    const manifestBytes = unzipped[MANIFEST];
    const bookBytes = unzipped[BOOK];
    if (!manifestBytes?.length) {
        throw new Error(`Missing ${MANIFEST} in bundle.`);
    }
    if (!bookBytes?.length) {
        throw new Error(`Missing ${BOOK} in bundle.`);
    }

    const manifest = parseJson<OfflineBundleManifest>(strFromU8(manifestBytes), MANIFEST);
    if (!SUPPORTED_OFFLINE_SCHEMA_VERSIONS.has(manifest.schemaVersion)) {
        throw new Error(
            `Unsupported bundle version ${manifest.schemaVersion}. This app supports versions ${[...SUPPORTED_OFFLINE_SCHEMA_VERSIONS].join(', ')}.`,
        );
    }

    const bookWire = parseJson<Record<string, unknown>>(strFromU8(bookBytes), BOOK);
    const pdf = bookWire.pdf as OfflineBookPayload['pdf'];
    const chapters = bookWire.chapters as Chapter[];
    if (!pdf || !Array.isArray(chapters)) {
        throw new Error('Invalid book.json: missing pdf or chapters.');
    }

    const book: OfflineBookPayload = {
        pdf,
        chapters,
        sentencesByPage: sentencesByPageFromWire(bookWire.sentencesByPage),
        summariesByChapterId: normalizeNumericRecord<ChapterSummary[]>(
            bookWire.summariesByChapterId as Record<string, unknown>,
        ),
        ideasByChapterId: normalizeNumericRecord<IdeaWithSentences[]>(
            bookWire.ideasByChapterId as Record<string, unknown>,
        ),
        ideaArgumentsByIdeaId: normalizeNumericRecord<IdeaArgumentDTO[]>(
            bookWire.ideaArgumentsByIdeaId as Record<string, unknown>,
        ),
        ideaExplanationsByIdeaId: normalizeNumericRecord<IdeaExplanationDTO[]>(
            bookWire.ideaExplanationsByIdeaId as Record<string, unknown>,
        ),
        chatResponsesByChapterId: normalizeNumericRecord<PDFChatResponse[]>(
            bookWire.chatResponsesByChapterId as Record<string, unknown>,
        ),
    };

    return buildParsedBundleFromBook(manifest, book);
}
