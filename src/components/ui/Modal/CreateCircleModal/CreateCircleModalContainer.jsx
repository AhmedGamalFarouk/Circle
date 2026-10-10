// libs
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useDispatch } from "react-redux";
import { fetchCircles } from "../../../../features/circles/circlesSlice";
import { fetchUserProfile } from "../../../../features/userProfile/profileSlice";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { serverTimestamp, Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
// functions
import customSelectStyles from "./customSelectStyles";
import { toastStyles } from "../../../../utils/toastStyles";
import { addMembersToCircle } from "../../../../utils/addMembersToCircle";
import { addCircletoUser } from "../../../../utils/addCircletoUser";
import { getAllUsersForCircleCreation } from "../../../../utils/memberManagement";
import cloudinaryService from "../../../../services/cloudinaryService";

// hooks
import { validateForm } from "../../../../utils/FormValidator";
import { useCircleForm } from "../../../../hooks/useCircleForm";
import { useAuth } from "../../../../hooks/useAuth";
import { useImageUpload } from "../../../../hooks/useImageUpload";
import { sendCircleInvitations } from "../../../../hooks/useCircleInvitations";

// Lazy load the presentational component
const CreateCircleModalPresentational = lazy(
  () => import("./CreateCircleModalPresentional"),
);

import interests from "../../../../constants/interests";

export default function CreateCircleModalContainer({ closeModal }) {
  const dispatch = useDispatch();
  const status = useSelector((state) => state.circles.status);
  const { t } = useTranslation();
  // hooks
  const { uploadedImage, setUploadedImage, handleImageUpload, removeImage } =
    useImageUpload();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, errors, setErrors, resetAllFields } = useCircleForm();
  // states
  const [circleType, setCircleType] = useState("");
  const [circlePrivacy, setCirclePrivacy] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [membersKey, setMembersKey] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [interestsKey, setInterestsKey] = useState(0);
  const [memberOptions, setMemberOptions] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [search, setSearch] = useState("");
  // refs
  const fileInputRef = useRef(null);
  // options
  const interestOptions = interests;

  const circleTypeOptions = [
    { value: "permanent", label: t("permenent") },
    { value: "flash", label: t("flash") },
  ];

  const circlePrivacyOptions = [
    { value: "public", label: t("public") },
    { value: "private", label: t("private") },
  ];


  const filteredInterests = interestOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );
  // ***************************
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCircles());
    }
  }, [dispatch, status]);
  // *******************
  useEffect(() => {
    async function fetchUsers() {
      if (!user?.username || !(user.userId || user.uid)) return;

      setMembersLoading(true);
      try {
        // Use the member management utility to get available users
        const options = await getAllUsersForCircleCreation(
          user.userId || user.uid,
        );
        setMemberOptions(options);

        // Only set current user as selected if not already set
        setSelectedMembers((prev) => {
          // If already set, don't duplicate
          if (prev.length && prev[0]?.value === (user.userId || user.uid))
            return prev;
          return [
            {
              value: user.userId || user.uid || "current-user",
              label: user.username,
              isFixed: true,
            },
          ];
        });
      } catch (err) {
        console.error("Error fetching users:", err);
        toast.error("Failed to load users. Please try again.", toastStyles);
        setMemberOptions([]); // Reset to empty array on error
      } finally {
        setMembersLoading(false);
      }
    }
    fetchUsers();
  }, [user]);


  const inputStyles = `w-full rounded-md bg-inputsBg px-4 py-2 text-sm text-text-100
    shadow-inner focus:outline-none focus:ring-3 focus:ring-[var(--color-secondary)]
    placeholder-text-500 transition`;
  const textareaStyles = `${inputStyles} min-h-[100px] resize-y`;

  const resetAllFieldsContainer = () => {
    resetAllFields(
      () => setUploadedImage(undefined),
      () =>
        setSelectedMembers([
          {
            value: user.userId || user.uid || "current-user",
            label: user.username,
            isFixed: true,
          },
        ]),
      () => setInterestsKey((prev) => prev + 1),
      () => setMembersKey((prev) => prev + 1),
      () => setSelectedInterests([]),
      () => setCircleType(""),
      () => setCirclePrivacy(""),
      () => setExpireDate(""),
    );
  };

  // const handleCloseModal = () => {
  //   resetAllFieldsContainer();
  //   closeModal();
  // };

  const onFormSubmit = async (data) => {
    let imageUrl = "";

    const formFields = {
      ...data,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      circlePrivacy: circlePrivacy,
      interests: selectedInterests, // now array of strings
      imageUrl: "",
      circleType,
      expiresAt:
        circleType === "flash" && expireDate
          ? Timestamp.fromDate(new Date(expireDate))
          : null,
    };

    const validationErrors = validateForm(formFields);

    // Add custom validation for Flash circles
    if (circleType === "flash") {
      if (!expireDate) {
        validationErrors.expireDate =
          "Expire date is required for Flash circles";
      } else {
        const selectedDate = new Date(expireDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to compare dates only

        if (selectedDate <= today) {
          validationErrors.expireDate = "Expire date must be in the future";
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    if (uploadedImage?.file) {
      try {
        const uploadResult = await cloudinaryService.uploadImage(
          uploadedImage.file,
          {
            folder: "circles/covers",
            tags: ["circle", "cover", "circle-creation"],
          },
        );
        imageUrl = uploadResult.secure_url;
        formFields.imageUrl = imageUrl;
      } catch (err) {
        console.error("Circle cover upload failed:", err);
        toast.error(
          "Failed to upload cover image. Please try again.",
          toastStyles,
        );
        setIsLoading(false);
        return;
      }
    }

    try {
      const db = getFirestore();
      const circlesColRef = collection(db, "circles");
      const docRef = await addDoc(circlesColRef, formFields);
      const circleId = docRef.id;

      // Add creator as member immediately
      await addMembersToCircle(
        circleId,
        user.uid,
        user,
        [{ value: user.uid, label: user.username, isFixed: true }],
        user,
      );
      await addCircletoUser(user.uid, circleId);

      // Only send invitations to members who are NOT the creator
      const membersToInvite = selectedMembers.filter(m => m.value !== user.uid);

      if (membersToInvite.length > 0) {
        await sendCircleInvitations({
          circleId,
          members: membersToInvite,
          memberOptions,
          user,
          circleName: formFields.circleName
        });
      }

      toast.success("Circle created successfully!", toastStyles);
      dispatch(fetchCircles());
      // My Circles filters by the profile's joinedCircles, so reload it too.
      dispatch(fetchUserProfile(user.uid));
      resetAllFieldsContainer();
      closeModal();
    } catch (error) {
      console.error("Error adding circle:", error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Suspense fallback={<div />}>
      <CreateCircleModalPresentational
        t={t}
        closeModal={closeModal}
        register={register}
        handleSubmit={handleSubmit(onFormSubmit)}
        circlePrivacyOptions={circlePrivacyOptions}
        setCirclePrivacy={setCirclePrivacy}
        circleType={circleType}
        setCircleType={setCircleType}
        expireDate={expireDate}
        setExpireDate={setExpireDate}
        selectedMembers={selectedMembers}
        setSelectedMembers={setSelectedMembers}
        selectedInterests={selectedInterests}
        setSelectedInterests={setSelectedInterests}
        fileInputRef={fileInputRef}
        filteredInterests={filteredInterests}
        search={search}
        setSearch={setSearch}
        uploadedImage={uploadedImage}
        handleImageUpload={handleImageUpload}
        removeImage={removeImage}
        memberOptions={memberOptions}
        membersLoading={membersLoading}
        interestOptions={interestOptions}
        circleTypeOptions={circleTypeOptions}
        inputStyles={inputStyles}
        textareaStyles={textareaStyles}
        customStyles={customSelectStyles}
        errors={errors}
        isLoading={isLoading}
        membersKey={membersKey}
        interestsKey={interestsKey}
      />
    </Suspense>
  );
}
