import React, { useState } from 'react';

interface PDFToolsProps {
    pdfId: number;
    chapterId: number | null;
}

const API_URL = 'http://localhost:8080/api/pdf/process';

export const PDFTools: React.FC<PDFToolsProps> = ({ pdfId, chapterId }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [bookContext, setBookContext] = useState(false);

    const handleChapterSummary = async () => {
        if (!chapterId) return;
        setLoading(true);
        setResult(null);
        try {
            // Mock API call
            console.log(`POST ${API_URL}/chapter/summary?pdfId=${pdfId}&chapterId=${chapterId}&bookContext=${bookContext}`);

            // Simulating a delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            setResult(`Chapter summary created successfully! (Context: ${bookContext ? 'Book' : 'Chapter only'})`);
        } catch (error) {
            console.error(error);
            setResult('Error creating chapter summary.');
        } finally {
            setLoading(false);
        }
    };

    const handleBookSummary = async () => {
        setLoading(true);
        setResult(null);
        try {
            // Mock API call
            console.log(`POST ${API_URL}/book/summary?pdfId=${pdfId}`);

            // Simulating a delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            setResult('Book summary created successfully!');
        } catch (error) {
            console.error(error);
            setResult('Error creating book summary.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkIdeas = async () => {
        if (!chapterId) return;
        setLoading(true);
        setResult(null);
        try {
            // Mock API call
            console.log(`POST ${API_URL}/chapter/ideas?pdfId=${pdfId}&chapterId=${chapterId}`);

            // Simulating a delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            setResult('Key ideas in the chapter have been marked!');
        } catch (error) {
            console.error(error);
            setResult('Error marking ideas in the chapter.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkExamples = async () => {
        if (!chapterId) return;
        setLoading(true);
        setResult(null);
        try {
            // Mock API call
            console.log(`POST ${API_URL}/chapter/examples?pdfId=${pdfId}&chapterId=${chapterId}`);

            // Simulating a delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            setResult('Examples in the chapter have been marked!');
        } catch (error) {
            console.error(error);
            setResult('Error marking examples in the chapter.');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessContext = async () => {
        if (!chapterId) return;
        setLoading(true);
        setResult(null);
        try {
            // Mock API call
            console.log(`POST ${API_URL}/chapter/context?pdfId=${pdfId}&chapterId=${chapterId}&bookContext=${bookContext}`);

            // Simulating a delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            setResult(`Context processing complete! (Context: ${bookContext ? 'Book' : 'Chapter only'})`);
        } catch (error) {
            console.error(error);
            setResult('Error processing context.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md mt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">PDF Tools</h3>

            {/* Feature 1: Chapter Summary */}
            <div className="mb-6 p-4 border rounded-md bg-gray-50">
                <h4 className="font-medium text-gray-700 mb-2">Chapter Summary</h4>
                <div className="flex items-center gap-4 mb-3">
                    <label className="flex items-center text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={bookContext}
                            onChange={(e) => setBookContext(e.target.checked)}
                            className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        Include Book Context
                    </label>
                </div>
                <button
                    onClick={handleChapterSummary}
                    disabled={loading || !chapterId}
                    className={`w-full py-2 px-4 rounded font-medium text-white 
                        ${loading || !chapterId
                            ? 'bg-blue-300 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'}`}
                >
                    {loading ? 'Processing...' : 'Create Summary'}
                </button>
                {!chapterId && <p className="text-xs text-amber-600 mt-2">Please navigate to a chapter to use this tool.</p>}
            </div>

            {/* Feature 2: Book Summary */}
            <div className="mb-6 p-4 border rounded-md bg-gray-50">
                <h4 className="font-medium text-gray-700 mb-2">Book Summary</h4>
                <p className="text-xs text-gray-500 mb-3">Create a comprehensive summary of the entire book.</p>
                <button
                    onClick={handleBookSummary}
                    disabled={loading}
                    className={`w-full py-2 px-4 rounded font-medium text-white 
                        ${loading
                            ? 'bg-purple-300 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-300'}`}
                >
                    {loading ? 'Processing...' : 'Create Book Summary'}
                </button>
            </div>

            {/* Feature 3: Mark Ideas */}
            <div className="mb-6 p-4 border rounded-md bg-gray-50">
                <h4 className="font-medium text-gray-700 mb-2">Mark Ideas</h4>
                <p className="text-xs text-gray-500 mb-3">Highlight key ideas within the current chapter.</p>
                <button
                    onClick={handleMarkIdeas}
                    disabled={loading || !chapterId}
                    className={`w-full py-2 px-4 rounded font-medium text-white 
                        ${loading || !chapterId
                            ? 'bg-amber-300 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-600 focus:ring-4 focus:ring-amber-300'}`}
                >
                    {loading ? 'Processing...' : 'Mark Ideas'}
                </button>
                {!chapterId && <p className="text-xs text-amber-600 mt-2">Please navigate to a chapter to use this tool.</p>}
            </div>

            {/* Feature 4: Mark Examples */}
            <div className="mb-6 p-4 border rounded-md bg-gray-50">
                <h4 className="font-medium text-gray-700 mb-2">Mark Examples</h4>
                <p className="text-xs text-gray-500 mb-3">Highlight examples within the current chapter.</p>
                <button
                    onClick={handleMarkExamples}
                    disabled={loading || !chapterId}
                    className={`w-full py-2 px-4 rounded font-medium text-white 
                        ${loading || !chapterId
                            ? 'bg-teal-300 cursor-not-allowed'
                            : 'bg-teal-500 hover:bg-teal-600 focus:ring-4 focus:ring-teal-300'}`}
                >
                    {loading ? 'Processing...' : 'Mark Examples'}
                </button>
                {!chapterId && <p className="text-xs text-amber-600 mt-2">Please navigate to a chapter to use this tool.</p>}
            </div>

            {/* Feature 5: Process Context */}
            <div className="mb-6 p-4 border rounded-md bg-gray-50">
                <h4 className="font-medium text-gray-700 mb-2">Process Context</h4>
                <div className="flex items-center gap-4 mb-3">
                    <label className="flex items-center text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={bookContext}
                            onChange={(e) => setBookContext(e.target.checked)}
                            className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        Include Book Context
                    </label>
                </div>
                <button
                    onClick={handleProcessContext}
                    disabled={loading || !chapterId}
                    className={`w-full py-2 px-4 rounded font-medium text-white 
                        ${loading || !chapterId
                            ? 'bg-indigo-300 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300'}`}
                >
                    {loading ? 'Processing...' : 'Process Context'}
                </button>
                {!chapterId && <p className="text-xs text-amber-600 mt-2">Please navigate to a chapter to use this tool.</p>}
            </div>

            {/* Results Display */}
            {result && (
                <div className="mt-4 p-3 bg-green-50 text-green-800 rounded border border-green-200 text-sm">
                    {result}
                </div>
            )}
        </div>
    );
};
