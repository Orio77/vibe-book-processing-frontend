import { NavLink } from 'react-router-dom';
import { Home, Upload, BookOpen, FolderOpen } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

export function NavBar() {
    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-8">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-slate-900">
                                BookProcessing
                            </span>
                        </div>
                        <div className="hidden sm:flex sm:space-x-2">
                            <NavLink to={ROUTES.HOME} end className={navLinkClass}>
                                <Home className="w-4 h-4 mr-2" />
                                Library
                            </NavLink>
                            <NavLink to={ROUTES.UPLOAD} className={navLinkClass}>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload PDF
                            </NavLink>
                            <NavLink to={ROUTES.READ_OFFLINE} className={navLinkClass}>
                                <FolderOpen className="w-4 h-4 mr-2" />
                                Offline library
                            </NavLink>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
