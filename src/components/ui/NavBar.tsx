import { NavLink } from 'react-router-dom';
import { Home, Upload, BookOpen, FolderOpen } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

const mobileTabClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 min-h-14 max-w-[34%] px-1 text-[11px] font-medium transition-colors touch-manipulation active:opacity-80 ${isActive
        ? 'text-blue-700'
        : 'text-slate-600'
    }`;

export interface NavBarProps {
    readonly hideMobileTabs?: boolean;
}

export function NavBar({ hideMobileTabs = false }: NavBarProps) {
    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-[60] border-b border-slate-200 bg-white/80 pt-[env(safe-area-inset-top,0px)] shadow-sm backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
                    <div className="flex h-14 min-h-14 items-center justify-between gap-2 sm:h-16 sm:min-h-16">
                        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-8 sm:flex-initial">
                            <div className="flex min-w-0 items-center gap-2">
                                <div className="shrink-0 rounded-lg bg-blue-600 p-1.5">
                                    <BookOpen className="h-5 w-5 text-white" />
                                </div>
                                <span className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-xl">
                                    <span className="sm:hidden">Books</span>
                                    <span className="hidden sm:inline">BookProcessing</span>
                                </span>
                            </div>
                            <div className="hidden min-w-0 sm:flex sm:space-x-2 md:space-x-3">
                                <NavLink to={ROUTES.HOME} end className={navLinkClass}>
                                    <Home className="mr-2 h-4 w-4" />
                                    Library
                                </NavLink>
                                <NavLink to={ROUTES.UPLOAD} className={navLinkClass}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload PDF
                                </NavLink>
                                <NavLink to={ROUTES.READ_OFFLINE} className={navLinkClass}>
                                    <FolderOpen className="mr-2 h-4 w-4" />
                                    Offline library
                                </NavLink>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div
                aria-hidden
                className="h-[calc(3.5rem+env(safe-area-inset-top,0px))] shrink-0 sm:h-[calc(4rem+env(safe-area-inset-top,0px))]"
            />

            {!hideMobileTabs && (
                <nav
                    className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] backdrop-blur-md sm:hidden"
                    aria-label="Primary"
                >
                    <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
                        <NavLink to={ROUTES.HOME} end className={mobileTabClass}>
                            <Home className="h-6 w-6 shrink-0" aria-hidden />
                            Library
                        </NavLink>
                        <NavLink to={ROUTES.UPLOAD} className={mobileTabClass}>
                            <Upload className="h-6 w-6 shrink-0" aria-hidden />
                            Upload
                        </NavLink>
                        <NavLink to={ROUTES.READ_OFFLINE} className={mobileTabClass}>
                            <FolderOpen className="h-6 w-6 shrink-0" aria-hidden />
                            Offline
                        </NavLink>
                    </div>
                </nav>
            )}
        </>
    );
}
