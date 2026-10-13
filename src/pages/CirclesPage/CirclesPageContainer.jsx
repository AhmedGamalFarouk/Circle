// libs
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { fetchCircles, fetchPublicCircles, fetchMorePublicCircles } from '../../features/circles/circlesSlice';
// slices & hooks
import { setSelectedCircle } from '../../features/circles/circlesSlice';
import { fetchCircleMembers } from '../../features/circleMembers/circleMembersSlice';
import { getProfileData } from '../../features/userProfile/profileSlice';
import { useAuth } from '../../hooks/useAuth';
import { useJoinCircleRequest } from '../../hooks/useJoinCircleRequest';
import { useSyncPendingRequests } from "../../contexts/PendingRequests";
import { useDeleteCircle } from "../../hooks/useDeleteCircle";
// components
import { Plus } from "lucide-react";
import CirclesPagePresentational from './CirclesPagePresentational'
import CirclesTabs from '../../components/ui/CircleTabs/CirclesTabs';
import CirclesPrivacyFilter from '../../components/ui/CirclePrivacyFilter/CirclesPrivacyFilter';
import CustomPaginationContainer from '../../components/Pagination/CustomPaginationContainer';
import CirclesSkeltonCard from '../../components/CirclesSkeltonsCard/CirclesSkeltonCard';
import Modal from '../../components/ui/Modal/Modal';
import CreateCircleModalContainer from '../../components/ui/Modal/CreateCircleModal/CreateCircleModalContainer';
import Select from 'react-select';
import { Filter } from "lucide-react"; // Or your preferred icon
import customSelectStyles from '../../components/ui/Modal/CreateCircleModal/customSelectStyles'; // Adjust path as needed
function CirclesPageContainer() {
    const { t } = useTranslation();
    const membersByCircle = useSelector(state => state.members.membersByCircle);
    const circles = useSelector(state => state.circles.circles);
    const joinedCircles = useSelector(state => state.circles.joinedCircles);
    const joinedIds = useSelector(state => state.circles.joinedIds);
    const publicPages = useSelector(state => state.circles.publicPages);
    const publicStatus = useSelector(state => state.circles.publicStatus);
    const hasMorePublic = useSelector(state => state.circles.hasMorePublic);
    const loadingMore = useSelector(state => state.circles.loadingMore);
    const loadMoreError = useSelector(state => state.circles.loadMoreError);
    const { user } = useAuth()
    const navigate = useNavigate();
    const profile = useSelector(getProfileData);
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('my');
    const [circlePrivacy, setCirclePrivacy] = useState('all');
    const [currentPage, setCurrentPage] = useState(0);
    const circlesPerPage = activeTab === "my" ? 9 : 6;
    const circlesStatus = useSelector(state => state.circles.status);
    const profileStatus = useSelector(state => state.userProfile.status);
    const { isLoggedIn } = useAuth();
    const authModalRef = useRef();
    const deleteCircleRef = useRef();
    const [selectedCircleToDelete, setSelectedCircleToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sendingRequestId, setSendingRequestId] = useState(null);
    const [showMutualOnly, setShowMutualOnly] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    const { handleJoinRequest, pendingRequests, setPendingRequests } = useJoinCircleRequest({
        circles,
        membersByCircle,
        user,
        profile,
        setSendingRequestId
    });

    useEffect(() => {
        circles.forEach(circle => {
            if (circle.id && !membersByCircle[circle.id]) {
                dispatch(fetchCircleMembers(circle.id));
            }
        });
    }, [circles, membersByCircle, dispatch]);

    // Public circles load on this page, 24 at a time.
    useEffect(() => {
        if (user?.uid) dispatch(fetchPublicCircles());
    }, [dispatch, user?.uid]);

    const matchesSearch = (circle) => {
        const queryLower = searchQuery.trim().toLowerCase();
        return !queryLower
            || circle.circleName?.toLowerCase().includes(queryLower)
            || circle.description?.toLowerCase().includes(queryLower)
            || (circle.interests || []).some(interest => interest.toLowerCase().includes(queryLower));
    };

    // "my": joined circles, newest first, numbered client pages.
    const myCircles = useMemo(() => joinedCircles
        .filter(circle => circlePrivacy === 'all' || circle.circlePrivacy === circlePrivacy)
        .slice()
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [joinedCircles, circlePrivacy]);

    // "forYou": public pages in fetch order, each page sorted by interest match on
    // its own, so loading more appends below and earlier cards never move.
    const userInterestsLower = useMemo(
        () => (profile?.interests || []).map(i => i.toLowerCase()),
        [profile?.interests]
    );
    const forYouCircles = useMemo(() => {
        const joined = new Set(joinedIds);
        return publicPages.flatMap(page => page
            .filter(circle => !joined.has(circle.id))
            .map(circle => ({
                ...circle,
                matchedInterests: (circle.interests || []).filter(interest =>
                    userInterestsLower.includes(interest.toLowerCase())
                ),
            }))
            .sort((a, b) => b.matchedInterests.length - a.matchedInterests.length));
    }, [publicPages, joinedIds, userInterestsLower]);

    let filteredCircles = activeTab === 'my' ? myCircles : forYouCircles;
    if (activeTab === 'forYou' && showMutualOnly) {
        filteredCircles = filteredCircles.filter(circle => circle.matchedInterests.length > 0);
    }
    filteredCircles = filteredCircles.filter(matchesSearch);

    const isPaged = activeTab === 'forYou';
    const pageCount = isPaged ? 0 : Math.ceil(filteredCircles.length / circlesPerPage);
    const paginatedCircles = isPaged
        ? filteredCircles
        : filteredCircles.slice(currentPage * circlesPerPage, (currentPage + 1) * circlesPerPage);

    // Skeleton only on a tab's first load; background refreshes keep the list.
    const firstLoad = (s) => s === 'idle' || s === 'loading';
    const showSkeleton = activeTab === 'my'
        ? firstLoad(circlesStatus)
        : firstLoad(publicStatus) || circlesStatus === 'loading';
    const listFailed = activeTab === 'my' ? circlesStatus === 'failed' : publicStatus === 'failed';
    const retryList = () => dispatch(activeTab === 'my' ? fetchCircles() : fetchPublicCircles());

    // Load more: track how many cards one click added, then focus the first new one.
    const gridRef = useRef(null);
    const loadMoreFrom = useRef(null);
    const [loadMoreResult, setLoadMoreResult] = useState(null); // { added } after a click
    function handleLoadMore() {
        loadMoreFrom.current = filteredCircles.length;
        setLoadMoreResult(null);
        dispatch(fetchMorePublicCircles());
    }
    useEffect(() => {
        if (loadingMore || loadMoreFrom.current === null) return;
        const from = loadMoreFrom.current;
        loadMoreFrom.current = null;
        if (loadMoreError) return;
        const added = filteredCircles.length - from;
        setLoadMoreResult({ added });
        if (added > 0) gridRef.current?.children[from]?.focus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadingMore]);
    useEffect(() => {
        setLoadMoreResult(null);
        setCurrentPage(0);
    }, [activeTab, searchQuery, showMutualOnly, circlePrivacy]);

    const [authFormType, setAuthFormType] = useState("login");

    const handleSwitchToRegister = () => setAuthFormType("register");
    const handleSwitchToLogin = () => setAuthFormType("login");

    function handleOpenAuthModal() {
        authModalRef.current.open();
    }
    function handleCardClick(circle) {
        if (isLoggedIn) {
            dispatch(setSelectedCircle(circle));
            navigate(`/circles/${circle.id}`);
        } else {
            handleOpenAuthModal()
        }
    }

    useEffect(() => {
        async function fetchPendingRequests() {
            if (!user) {
                setPendingRequests([]);
                return;
            }
            const db = getFirestore();
            const q = query(
                collection(db, "circleRequests"),
                where("userId", "==", user.uid),
                where("status", "==", "pending")
            );
            const snapshot = await getDocs(q);
            const requests = snapshot.docs.map(doc => doc.data().circleId);
            setPendingRequests(requests);
        }
        fetchPendingRequests();
    }, [user, circles]);

    function openDeleteCircleModal(circle) {
        setSelectedCircleToDelete(circle);
        deleteCircleRef.current.open();
    }

    function closeCircleDeleteModal() {
        setSelectedCircleToDelete(null);
        deleteCircleRef.current.close();
    }
    const isOwner = user && selectedCircleToDelete && selectedCircleToDelete.createdBy === user.uid;

    // Delete logic inside the container
    const [isDeleting, setIsDeleting] = useState(false);

    const { deleteCircle } = useDeleteCircle({ t, dispatch, fetchCircles });

    const handleDeleteCircle = () => {
        deleteCircle({
            selectedCircleToDelete,
            isOwner,
            closeCircleDeleteModal,
            setIsDeleting,
        });
    };

    useSyncPendingRequests(user);

    const createCircleRef = useRef()
    function openCCircleModal() {
        createCircleRef.current.open();
    }
    function closeCCircleModal() {
        createCircleRef.current.close();
    }
    return (
        <div className='pt-paddingTop bg-gradient-to-b from-bg-primary to-bg-secondary flex flex-col min-h-screen'>
            {user && <>
                <CirclesTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                {activeTab === "my" &&
                    <CirclesPrivacyFilter circlePrivacy={circlePrivacy} setCirclePrivacy={setCirclePrivacy} />
                }

                {/* Search Bar */}
                <div className="mb-4 flex justify-center items-center px-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={t("Search circles...")}
                        className="px-3 py-2 rounded-3xl border border-primary bg-transparent text-text w-full max-w-xs sm:max-w-md md:max-w-lg transition-all"
                    />
                    <div className='bg-primary rounded-3xl p-2 ltr:ml-1.5 rtl:mr-1.5 cursor-pointer' onClick={openCCircleModal}>
                        <Plus size={20} />
                    </div>
                    {activeTab === "forYou" && (
                        <div className="relative flex items-center ml-2 min-w-[220px]">
                            <button
                                type="button"
                                className="flex items-center justify-center bg-transparent border-none outline-none cursor-pointer"
                                onClick={() => setShowFilterMenu((prev) => !prev)}
                                aria-label={t("Filter circles")}
                            >
                                <Filter className="text-primary" size={20} />
                            </button>
                            {showFilterMenu && (
                                <div className="absolute left-8 top-0 z-10 min-w-[200px]">
                                    <Select
                                        value={
                                            showMutualOnly
                                                ? { value: "mutual", label: t("Show Only Mutual Interests") }
                                                : { value: "all", label: t("Show All Circles") }
                                        }
                                        onChange={option => setShowMutualOnly(option.value === "mutual")}
                                        options={[
                                            { value: "all", label: t("Show All Circles") },
                                            { value: "mutual", label: t("Show Only Mutual Interests") }
                                        ]}
                                        styles={customSelectStyles}
                                        classNamePrefix="custom-select"
                                        isSearchable={false}
                                        menuIsOpen={true}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <Modal ref={createCircleRef}>
                    <CreateCircleModalContainer closeModal={closeCCircleModal} />
                </Modal>
                <div className="flex-1">
                    {listFailed ? (
                        <div role="alert" className="flex flex-col items-center gap-3 py-10 text-text">
                            <span>{t(activeTab === 'my' ? "Couldn't load your circles." : "Couldn't load public circles.")}</span>
                            <button type="button" onClick={retryList}
                                className="min-h-11 rounded-3xl border border-primary px-5 text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                                {t("Retry")}
                            </button>
                        </div>
                    ) : showSkeleton ? (
                        <CirclesSkeltonCard />
                    ) : (
                        <CirclesPagePresentational
                            circles={paginatedCircles}
                            gridRef={gridRef}
                            membersByCircle={membersByCircle}
                            handleCardClick={handleCardClick}
                            activeTab={activeTab}
                            circlesStatus={circlesStatus}
                            profileStatus={profileStatus}
                            profileInterests={profile?.interests || []}
                            user={user}
                            handleJoinRequest={handleJoinRequest}
                            pendingRequests={pendingRequests}
                            openDeleteCircleModal={openDeleteCircleModal}
                            deleteCircleRef={deleteCircleRef}
                            closeCircleDeleteModal={closeCircleDeleteModal}
                            onDeleteCircle={handleDeleteCircle}
                            isDeleting={isDeleting}
                            sendingRequestId={sendingRequestId}
                            circleName={selectedCircleToDelete ? selectedCircleToDelete.circleName : ""}
                        />
                    )}
                    {/* A failed half while the other half loaded: small line with Retry. */}
                    {activeTab === 'forYou' && !listFailed && circlesStatus === 'failed' && (
                        <p role="alert" className="mt-3 text-center text-sm text-text">
                            {t("Couldn't load your circles.")}{' '}
                            <button type="button" className="underline text-primary" onClick={() => dispatch(fetchCircles())}>{t("Retry")}</button>
                        </p>
                    )}
                </div>
                {pageCount > 1 && (
                    <CustomPaginationContainer
                        pageCount={pageCount}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                )}
                {isPaged && !showSkeleton && !listFailed && (
                    <div className="my-6 flex flex-col items-center gap-2 px-4 text-center text-sm text-text">
                        {hasMorePublic ? (
                            <>
                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    aria-busy={loadingMore}
                                    className="min-h-11 rounded-3xl border border-primary px-6 font-semibold text-primary disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                                >
                                    {loadingMore ? t("Loading…") : t("Load more circles")}
                                </button>
                                {loadMoreError && <span role="alert">{t("Couldn't load more circles.")}</span>}
                                {loadMoreResult?.added === 0 && <span>{t("No new matches in the last 24 circles")}</span>}
                                {searchQuery.trim() && <span>{t("Searching loaded circles only")}</span>}
                            </>
                        ) : (
                            filteredCircles.length > 0 && <span>{t("You've seen all circles")}</span>
                        )}
                        <span className="sr-only" aria-live="polite">
                            {loadMoreResult?.added > 0 ? t("{{count}} more circles", { count: loadMoreResult.added }) : ''}
                        </span>
                    </div>
                )}
            </>}
        </div>
    );
}

export default CirclesPageContainer
