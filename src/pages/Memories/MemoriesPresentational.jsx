import {
  Calendar,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
function MemoriesPresentational({
  openLightbox,
  closeLightbox,
  navigateMemory,
  selectedMemory,
  searchTerm,
  setSearchTerm,
  filteredMemories,
  isUploading,
  handleFileUpload,
  formatDate,
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-[64px] min-h-screen text-white">
      {/* Header */}
      <div className="bg-gray sticky top-[64px] z-40 border-b border-gray-700 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-4xl font-bold text-transparent">
                {t("My Memories")}
              </h1>
              <p className="mt-1 text-gray-300">
                Capturing life's beautiful moments
              </p>
            </div>
            <label
              className="flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-white shadow-lg transition-all duration-300 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl"
              onClick={handleFileUpload}
            >
              <Upload size={20} />
              {isUploading ? "Uploading..." : "Add Memories"}
              {/* <input
               type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />  */}
            </label>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus:ring-primary bg-main w-full rounded-full border border-gray-600 py-3 pr-4 pl-10 text-white placeholder-gray-400 backdrop-blur-sm focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        <p className="mb-6 text-gray-300">
          {filteredMemories.length}{" "}
          {filteredMemories.length === 1 ? "memory" : "memories"} found
        </p>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMemories.map((memory, index) => (
            <div
              key={memory.id}
              className="group bg-main/80 relative cursor-pointer overflow-hidden rounded-2xl shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-purple-500/20"
              onClick={() => openLightbox(memory)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={memory.url}
                  alt={memory.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-4">
                <h3 className="mb-2 line-clamp-1 font-semibold text-white">
                  {memory.name}
                </h3>
                <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
                  <Calendar size={14} />
                  <span>{formatDate(memory.date)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMemories.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            <Search size={64} className="mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400">
              No memories found
            </h3>
            <p className="mt-2 text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-main relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/20 p-2 text-white hover:bg-black/40"
            >
              <X size={24} />
            </button>
            <button
              onClick={() => navigateMemory("prev")}
              className="absolute top-1/2 left-4 z-10 -translate-y-1/2 transform rounded-full bg-black/20 p-2 text-white hover:bg-black/40"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => navigateMemory("next")}
              className="absolute top-1/2 right-4 z-10 -translate-y-1/2 transform rounded-full bg-black/20 p-2 text-white hover:bg-black/40"
            >
              <ChevronRight size={24} />
            </button>

            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-2/3">
                <img
                  src={selectedMemory.url}
                  alt={selectedMemory.name}
                  className="h-64 w-full object-cover lg:h-96"
                />
              </div>
              <div className="p-6 lg:w-1/3">
                <h2 className="mb-4 text-2xl font-bold text-white">
                  {selectedMemory.name}
                </h2>
                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar size={18} />
                    <span>{formatDate(selectedMemory.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin size={18} />
                    <span>{selectedMemory.location}</span>
                  </div>
                </div>
                <p className="mb-6 text-gray-300">
                  {selectedMemory.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default MemoriesPresentational;
