// libs
import { motion as Motion } from "framer-motion";
import { Link } from "react-router";
import { ChevronDown, User, Settings, LogOut, Globe, Moon, Sun, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
export default function UserDropdownPresentational({
    user,
    userId,
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,
    toggleDropdown,
    currentLang,
    handleLanguageChange,
    handleLogout,
    darkMode,
    handleToggleDark
}) {
    const { t } = useTranslation()
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="text-primary hover:bg-primary/10 flex items-center space-x-2 rounded-lg bg-inputsBg px-3 py-2 transition-all duration-200 border border-text/10"
                aria-label="User menu"
            >
                {/* User avatar */}
                <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
                    <span className="text-sm font-bold text-text">{(user && user.charAt(0).toUpperCase()) || ""}</span>
                </div>

                <ChevronDown
                    className={`text-primary h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
            </button>

            {/* Dropdown Menu */}
            <Motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{
                    opacity: isDropdownOpen ? 1 : 0,
                    y: isDropdownOpen ? 5 : -10,
                    scale: isDropdownOpen ? 1 : 0.95
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`bg-main absolute top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-text/10 shadow-lg ltr:right-0 rtl:left-0 ${isDropdownOpen ? "pointer-events-auto" : "pointer-events-none"}`}
            >
                {/* User info header */}
                <div className="px-4 py-3 border-b border-text/10">
                    <p className="text-sm font-medium text-text truncate">
                        {user || "Guest User"}
                    </p>
                    <p className="text-xs text-text-400 truncate">
                        {user ? "Premium Account" : "Sign in to access features"}
                    </p>
                </div>

                {/* Dropdown items in new order */}
                <div className="py-1 flex flex-col gap-1">
                    {/* Profile (static) */}
                    <Link
                        to={`/profile/${userId}`}
                        className="hover:bg-primary/10 flex items-center px-4 py-3 text-sm text-text transition-colors gap-x-3"
                        onClick={() => setIsDropdownOpen(false)}
                    >
                        <User className="w-4 h-4" />
                        {t("Profile")}
                    </Link>

                    {/* Language toggle switcher */}
                    <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-x-3">
                            <Globe className="w-4 h-4 text-text" />
                            <span className="text-sm text-text">
                                {currentLang === "ar" ? "العربية" : "English"}
                            </span>
                        </div>
                        <button
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${currentLang === "ar"
                                ? "bg-primary/60"
                                : "bg-secondary/60"
                                }`}
                            onClick={() => handleLanguageChange(currentLang === "ar" ? "en" : "ar")}
                            aria-label="Toggle language"
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-main shadow transition-transform duration-200 ${currentLang === "ar"
                                    ? "translate-x-6"
                                    : "translate-x-0"
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Dark/Light mode toggle switcher */}
                    <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-x-3">
                            {darkMode ? (
                                <Moon className="w-4 h-4 text-text" />
                            ) : (
                                <Sun className="w-4 h-4 text-text" />
                            )}
                            <span className="text-sm text-text">
                                {darkMode ? t("Dark Mode") : t("Light Mode")}
                            </span>
                        </div>
                        <button
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${darkMode
                                ? "bg-primary/60"
                                : "bg-secondary/60"
                                }`}
                            onClick={handleToggleDark} // <-- use this instead of toggleDark
                            aria-label="Toggle theme"
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-main shadow transition-transform duration-200 ${darkMode
                                    ? "translate-x-6"
                                    : "translate-x-0"
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Logout (static) */}
                    <button
                        onClick={handleLogout}
                        className="hover:bg-primary/10 w-full flex items-center px-4 py-3 ltr:text-left rtl:text-right text-sm text-text transition-colors gap-x-3"
                        type="button"
                    >
                        <LogOut className="w-4 h-4" />
                        {t("Logout")}
                    </button>

                    <Link
                        to="/account/delete"
                        className="hover:bg-red-500/10 flex items-center px-4 py-3 text-sm text-red-500 transition-colors gap-x-3"
                        onClick={() => setIsDropdownOpen(false)}
                    >
                        <Trash2 className="w-4 h-4" />
                        {t("Delete account")}
                    </Link>
                </div>
            </Motion.div>
        </div>
    );
}