export { default as apiClient, resolveApiRootBaseUrl } from './core/client';
export { getApiErrorMessage } from './core/helpers';

export {
    clearAuthToken,
    getAuthToken,
    isAuthenticated,
    loginUser,
    registerUser,
    setAuthToken,
} from './features/auth';
export type { LoginRequest, RegisterRequest } from './features/auth';

export {
    deletePdf,
    fetchAllPdfs,
    fetchAllJobs,
    fetchPdf,
    fetchQueueJob,
    uploadPdf,
} from './features/pdf';
export type { QueueJob } from './features/pdf';

export {
    fetchChapter,
    fetchChapters,
    fetchPageSentences,
    fetchSentencesInRanges,
} from './features/chapters';

export {
    createBookSummary,
    createChapterSummary,
    createIdeaExplanation,
    createIdeasExplanations,
    deleteChapterSummary,
    deleteIdea,
    deleteIdeaExplanation,
    fetchIdea,
    fetchIdeaArguments,
    fetchIdeaExplanation,
    fetchIdeaExplanations,
    fetchIdeasByChapterId,
    getChapterSummary,
    getSummaryByChapterId,
    markExamples,
    markKeyIdeas,
    processChapterContext,
    updateIdeaExplanation,
} from './features/ai';
export type {
    ChapterSummaryDispatchResult,
    IdeaExplanationDispatchResult,
    IdeaExtractionDispatchResult,
    IdeasExplanationDispatchResult,
} from './features/ai';

export {
    deleteChatResponse,
    fetchChat,
    fetchChatResponsesForChapter,
    fetchExplanation,
    updateChatResponse,
} from './features/chat';
export type { ChatDispatchResult, PDFChatRequest } from './features/chat';
