//libs
// eslint-disable-next-line no-unused-vars
import Select, { components } from "react-select";
import { Loader } from "lucide-react";
import ModalHeading from "../ModalHeading/ModalHeading";
import Chip from '@mui/material/Chip';

export default function CreateCircleModalPresentional({
  t,
  register,
  handleSubmit,
  circlePrivacyOptions,
  setCirclePrivacy,
  circleType,
  setCircleType,
  expireDate,
  setExpireDate,
  selectedMembers,
  setSelectedMembers,
  selectedInterests,
  setSelectedInterests,
  filteredInterests,
  search,
  setSearch,
  fileInputRef,
  uploadedImage,
  handleImageUpload,
  removeImage,
  memberOptions,
  circleTypeOptions,
  inputStyles,
  textareaStyles,
  customStyles,
  errors,
  isLoading,
  closeModal,
  membersKey,
}) {

  return (
    <form className="mx-auto max-w-3xl space-y-6" onSubmit={handleSubmit}>
      <ModalHeading onClose={closeModal} title={t("Create Circle")} />
      <div className="mb-0">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-2">
          <div>
            <label htmlFor="circleName" className="text-text mb-1 block text-sm font-medium">
              {t("Circle Name")} *
            </label>
            <input
              type="text"
              placeholder={t("enter circle name")}
              name="circleName"
              className={inputStyles}
              {...register("circleName")}
            />
            {errors?.circleName && (
              <span className="text-red-500 text-xs mt-1 block">{errors.circleName}</span>
            )}
          </div>

          <div>
            <label htmlFor="circleType" className="text-text mb-1 block text-sm font-medium">
              {t("Circle Type")} *
            </label>
            <Select
              options={circleTypeOptions}
              styles={customStyles}
              placeholder={t("select type...")}
              name="circleType"
              value={
                circleTypeOptions.find(
                  (option) => option.value === circleType,
                ) || null
              }
              onChange={(selectedOption) =>
                setCircleType(selectedOption ? selectedOption.value : "")
              }
              isClearable
            />
            {errors?.circleType && (
              <span className="text-red-500 text-xs mt-1 block">{errors.circleType}</span>
            )}
          </div>
        </div>

        {/* Expire Date - Only show for Flash circles */}
        {circleType === "flash" && (
          <div className="mb-2">
            <label htmlFor="expireDate" className="text-text mb-1 block text-sm font-medium">
              {t("Expire Date")} *
            </label>
            <input
              type="date"
              className={inputStyles}
              value={expireDate}
              onChange={(e) => setExpireDate(e.target.value)}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow's date
            />
            {errors?.expireDate && (
              <span className="text-red-500 text-xs mt-1 block">{errors.expireDate}</span>
            )}
          </div>
        )}

        <div className="mb-2">
          <label htmlFor="privacy" className="text-text mb-1 block text-sm font-medium">
            {t("Circle Privacy")}
          </label>
          <Select
            options={circlePrivacyOptions}
            styles={customStyles}
            placeholder={t("select circle privacy...")}
            name="circlePrivacy"
            onChange={(selectedOption) =>
              setCirclePrivacy(selectedOption ? selectedOption.value : "")
            }
            isClearable
          />
          {errors?.circlePrivacy && (
            <span className="text-red-500 text-xs mt-1 block">{errors.circlePrivacy}</span>
          )}
        </div>
        <div className="mb-0">
          <label htmlFor="description" className="text-text mb-1 block text-sm font-medium">
            {t("Description")}
          </label>
          <textarea
            placeholder="what's this circle about?"
            className={textareaStyles}
            name="description"
            {...register("description")}
            rows={3}
          />
          {errors?.description && (
            <span className="text-red-500 text-xs mt-1 block">{errors.description}</span>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="mb-2">
        <label className="text-text mb-1 block text-sm font-medium">
          {t("Members")}
        </label>
        <Select
          isMulti
          key={membersKey}
          options={memberOptions}
          value={selectedMembers}
          styles={customStyles}
          onChange={newValue => {
            setSelectedMembers([
              ...newValue.filter(m => !m.isFixed),
              ...selectedMembers.filter(m => m.isFixed)
            ]);
          }}
          components={{
            MultiValueRemove: props =>
              props.data.isFixed ? null : <components.MultiValueRemove {...props} />
          }}
        />
        {errors?.members && (
          <span className="text-red-500 text-xs mt-1 block">{errors.members}</span>
        )}
      </div>

      {/* Interests */}
      <div className="mb-2">
        <label className="text-text mb-1 block text-sm font-medium">
          {t("Interests")}
        </label>
        <div>
          <input
            type="text"
            placeholder={t("Search interests...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`${inputStyles} ${'mb-2'}`}
          />
          <div className="flex flex-wrap gap-2">
            {[
              ...filteredInterests.filter(interest => selectedInterests.includes(interest.value)),
              ...filteredInterests.filter(interest => !selectedInterests.includes(interest.value)).slice(0, 10 - filteredInterests.filter(interest => selectedInterests.includes(interest.value)).length)
            ].slice(0, 10).map(interest => (
              <Chip
                key={interest.value}
                label={interest.label}
                color={"primary"}
                variant={selectedInterests.includes(interest.value) ? "filled" : "outlined"}
                onClick={() => {
                  setSelectedInterests(prev =>
                    prev.includes(interest.value)
                      ? prev.filter(i => i !== interest.value)
                      : [...prev, interest.value]
                  );
                  setSearch("");
                }}
              />
            ))}
            {selectedInterests
              .filter(sel => !filteredInterests.some(interest => interest.value === sel))
              .map(sel => (
                <Chip
                  key={sel}
                  label={sel}
                  color={"primary"}
                  variant="filled"
                  onClick={() => {
                    setSelectedInterests(prev => prev.filter(i => i !== sel));
                  }}
                />
              ))}
          </div>
        </div>
        {errors?.interests && (
          <span className="text-red-500 text-xs mt-1 block">{errors.interests}</span>
        )}
      </div>


      {/* Image Upload */}
      <div className="mb-2">
        <label htmlFor="circleImages" className="text-text mb-1 block text-sm font-medium">
          {t("Circle Image")}
        </label>

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
            Click to upload or drag and drop
          </p>
          <p className="mt-1 text-xs text-text-400">
            Supports JPG, PNG (Max 5MB each)
          </p>
        </div>
        {/* Image Preview (only one image) */}
        {uploadedImage && (
          <div className="mt-3 grid grid-cols-1 gap-3">
            <div className="group relative">
              <img
                src={uploadedImage.preview}
                alt="Preview"
                className="border-primary max-h-48 w-auto mx-auto rounded-lg border-2 object-cover block"
              />
              <button
                type="button"
                onClick={() => removeImage(0)}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-text opacity-0 transition-opacity group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div >

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          className="bg-main w-full rounded-2xl py-3 font-bold text-text flex items-center justify-center shadow-main transition-all duration-300 hover:bg-primary"
          disabled={isLoading}
        >
          {isLoading && (
            <Loader className="animate-spin h-5 w-5 ltr:mr-2 rtl:ml-2 text-text" />
          )}
          {t("Create Circle")}
        </button>
      </div>
    </form >
  );
}
