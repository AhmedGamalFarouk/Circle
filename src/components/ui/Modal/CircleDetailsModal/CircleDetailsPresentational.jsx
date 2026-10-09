import ModalHeading from "../ModalHeading/ModalHeading";
import { X, Edit3, Save, Trash2, Loader2 } from "lucide-react";
import customSelectStyles from "../CreateCircleModal/customSelectStyles";
import Select from "react-select";

export default function CircleDetailsPresentational({
    t,
    selectedCircle,
    onClose,
    nameRef,
    descRef,
    selectedInterests,
    setSelectedInterests,
    filteredInterests,
    search,
    setSearch,
    handleSave,
    isLoading,
    isEditing,
    setIsEditing,
    circleTypeOptions,
    circleType,
    setCircleType,
    expireDate,
    setExpireDate,
    circlePrivacyOptions,
    setCirclePrivacy,
    circlePrivacy,
    fileInputRef,
    handleImageUpload,
    uploadedImage,
    removeImage,
    isOwner,
    isAdmin
}) {
    const inputStyles = `w-full rounded-md bg-inputsBg px-4 py-2 text-sm text-text-100
    shadow-inner focus:outline-none focus:ring-3 focus:ring-[var(--color-secondary)]
    placeholder-text-500 transition`;
    const textareaStyles = `${inputStyles} min-h-[100px] resize-y`;

    return (
        <div className="mx-auto max-w-3xl  rounded-2xl">
            <ModalHeading title={isEditing ? t("Edit circle details") : t("Circle Details")} onClose={onClose} />
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-texte-300 mb-2 block text-sm font-medium">
                            {t("Circle Name")}
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                defaultValue={selectedCircle.circleName}
                                ref={nameRef}
                                className={inputStyles}
                                placeholder={t("Circle Name")}
                            />
                        ) : (
                            <div className="text-lg font-bold">{selectedCircle.circleName}</div>
                        )}
                    </div>

                    <div>
                        <label className="text-texte-300 mb-2 block text-sm font-medium">
                            {t("Circle Type")}
                        </label>
                        {isEditing ? (
                            <Select
                                options={circleTypeOptions}
                                styles={customSelectStyles}
                                placeholder="Select type..."
                                value={
                                    circleTypeOptions.find(opt => opt.value === circleType) || null
                                }
                                onChange={(opt) => setCircleType(opt ? opt.value : "")}
                                isClearable
                            />
                        ) : (
                            <div className="text-lg text-primary">{t(selectedCircle.circleType === "flash" ? "flash" : "permenent")}</div>
                        )}
                    </div>
                </div>

                {circleType === "flash" && (
                    <div className="mb-2">
                        <label htmlFor="expireDate" className="text-text mb-1 block text-sm font-medium">
                            {t("Expire Date")} *
                        </label>
                        <input
                            type="date"
                            className={inputStyles}
                            value={expireDate || ""}
                            onChange={(e) => setExpireDate(e.target.value)}
                            min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                        />
                    </div>
                )}

                <div>
                    <label className="text-texte-300 mb-2 block text-sm font-medium">
                        {t("Circle Privacy")}
                    </label>
                    {isEditing ? (
                        <Select
                            options={circlePrivacyOptions}
                            styles={customSelectStyles}
                            placeholder="Select privacy..."
                            value={
                                circlePrivacyOptions.find(opt => opt.value === circlePrivacy) || null
                            }
                            onChange={(opt) => setCirclePrivacy(opt ? opt.value : "")}
                            isClearable
                        />
                    ) : (
                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${selectedCircle.circlePrivacy === "public"
                            ? "bg-green-900/30 text-green-400"
                            : "bg-purple-900/30 text-purple-400"
                            }`}>
                            {t(selectedCircle.circlePrivacy === "private" ? "private" : "public")}
                        </span>
                    )}
                </div>

                <div>
                    <label className="text-texte-300 mb-2 block text-sm font-medium">
                        {t("Description")}
                    </label>
                    {isEditing ? (
                        <textarea
                            placeholder="What's this circle about?"
                            className={textareaStyles}
                            defaultValue={selectedCircle.description}
                            ref={descRef}
                        />
                    ) : (
                        <div className="text-texte-300 leading-relaxed bg-texte-800/50 p-4 rounded-xl">
                            {selectedCircle.description || t("No description provided")}
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-texte-300 block text-sm font-medium">
                            {t("Interests")}
                        </label>
                        {isEditing && (
                            <span className="text-xs text-texte-500">
                                {t("Selected")}: {selectedInterests.length}
                            </span>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t("Search interests...")}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full rounded-xl bg-texte-800 px-4 py-3 text-texte-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary transition pl-10"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 min-h-[60px] max-h-[120px] overflow-y-auto p-1">
                                {filteredInterests.slice(0, 10).map(interest => (
                                    <button
                                        key={interest.value}
                                        type="button"
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedInterests.includes(interest.value)
                                            ? "bg-primary text-text"
                                            : "bg-texte-700 text-texte-300 hover:bg-texte-600"
                                            }`}
                                        onClick={() => {
                                            setSelectedInterests(prev =>
                                                prev.includes(interest.value)
                                                    ? prev.filter(i => i !== interest.value)
                                                    : [...prev, interest.value]
                                            );
                                        }}
                                    >
                                        {interest.label}
                                    </button>
                                ))}

                                {filteredInterests.length === 0 && (
                                    <div className="text-sm text-texte-500 italic w-full text-center py-2">
                                        {t("No interests found")}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {selectedCircle.interests.length > 0 ? (
                                selectedCircle.interests.map((interest, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 text-primary text-xs"
                                    >
                                        {interest}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-texte-500 italic">
                                    {t("No interests added")}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Image Upload */}
                <div className="mb-2">
                    <label htmlFor="circleImages" className="text-text mb-1 block text-sm font-medium">
                        {t("Circle Image")}
                    </label>

                    {isEditing && (
                        <>
                            {/* Show uploaded image preview if exists, else show current image */}
                            <div className="mt-3 flex justify-center">
                                {uploadedImage ? (
                                    <img
                                        src={uploadedImage.preview}
                                        alt="Preview"
                                        className="border-primary max-h-48 w-auto mx-auto rounded-lg border-2 object-cover block"
                                    />
                                ) : selectedCircle.imageUrl ? (
                                    <img
                                        src={selectedCircle.imageUrl}
                                        alt="Circle"
                                        className="border-primary max-h-48 w-auto mx-auto rounded-lg border-2 object-cover block"
                                    />
                                ) : (
                                    <div className="text-xs text-text-400">{t("No image uploaded")}</div>
                                )}
                            </div>
                            {/* Upload Area */}
                            <div
                                className={`${inputStyles} hover:bg-main-700 flex min-h-[100px] cursor-pointer flex-col items-center justify-center transition-colors`}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    id="circle-images"
                                    accept="image/*"
                                    name="circleImages"
                                    onChange={handleImageUpload}
                                />
                                <svg
                                    className="text-primary mb-2 h-8 w-8"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    ></path>
                                </svg>
                                <p className="text-primary text-center text-sm">
                                    {t("Click to upload")}
                                </p>
                                <p className="mt-1 text-xs text-text-400">
                                    {t("Supports JPG, PNG (Max 5MB each)")}
                                </p>
                            </div>
                            {/* Remove button for uploaded image */}
                            {uploadedImage && (
                                <button
                                    type="button"
                                    onClick={() => removeImage()}
                                    className="mt-2 px-3 py-1 rounded bg-red-500 text-text text-xs"
                                >
                                    {t("Remove Image")}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-between border-t border-texte-700 mt-4">
                <div />
                <div className="flex gap-3 justify-end">
                    {isEditing ? (
                        <>
                            <button
                                type="button"
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-text hover:opacity-90 transition-opacity flex items-center gap-2"
                                onClick={handleSave}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        {t("Saving...")}
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        {t("Save Changes")}
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        (isOwner || isAdmin) && (
                            <button
                                type="button"
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary/80 to-secondary/80 text-text hover:opacity-90 transition-opacity flex items-center gap-2"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit3 size={16} />
                                {t("Edit Circle")}
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
