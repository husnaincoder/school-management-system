export default function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-2 text-sm text-slate-500 sm:flex-row">
                <span>© {new Date().getFullYear()} School Management System Designed and Developed by <a href="#" target="_blank" className="text-indigo-600 hover:text-indigo-700">TechLape & Muhammad Javed Iqbal</a> All rights reserved.</span>
            </div>
        </footer>
    );
}
