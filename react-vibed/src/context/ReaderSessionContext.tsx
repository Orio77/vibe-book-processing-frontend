import { createContext, useContext, type ReactNode } from 'react';
import type { ParsedOfflineBundle } from '@/types/offlineBundle';
import type { MutableOfflineBookPayload } from '@/types/offlineLibrary';

export type ReaderSession =
    | { readonly mode: 'online'; readonly pdfId: string }
    | {
          readonly mode: 'offline';
          readonly exportId: string;
          readonly bundle: ParsedOfflineBundle;
          /** Last page from storage when this session opened; used to restore reading position once. */
          readonly initialLastPage: number;
          readonly patchBook: (recipe: (draft: MutableOfflineBookPayload) => void) => void;
          readonly setLastPage: (page: number) => void;
          readonly flushOfflineSave: () => Promise<void>;
      };

export const ReaderSessionContext = createContext<ReaderSession | null>(null);

export function ReaderSessionProvider({
    session,
    children,
}: {
    readonly session: ReaderSession;
    readonly children: ReactNode;
}) {
    return (
        <ReaderSessionContext.Provider value={session}>
            {children}
        </ReaderSessionContext.Provider>
    );
}

export function useReaderSession(): ReaderSession {
    const ctx = useContext(ReaderSessionContext);
    if (!ctx) {
        throw new Error('useReaderSession must be used within a reader session (online or offline).');
    }
    return ctx;
}

export function useIsOfflineReader(): boolean {
    const ctx = useContext(ReaderSessionContext);
    return ctx?.mode === 'offline';
}

export function useReaderSessionOptional(): ReaderSession | null {
    return useContext(ReaderSessionContext);
}
