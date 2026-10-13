import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { fetchCircleMembers } from "../../../features/circleMembers/circleMembersSlice";
import useOnlinePresence from "../../../hooks/chathooks/useOnlinePresence";
import ChatSidebarPresentational from "./ChatSidebarPresentational";
import useAuth from "../../../hooks/pollhooks/useAuth";
import { useDeleteCircle } from "../../../hooks/useDeleteCircle";
import { fetchCircles } from "../../../features/circles/circlesSlice";
import { useTranslation } from "react-i18next";
function ChatSidebarContainer() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const circleDetailsRef = useRef();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const { circleId } = useParams();
    const dispatch = useDispatch();
    const { deleteCircle } = useDeleteCircle({ t, dispatch, fetchCircles });
    const { membersByCircle, status, error } = useSelector((state) => state.members);
    const members = membersByCircle[circleId] || [];
    const { isUserOnline } = useOnlinePresence();
    const membersWithOnlineStatus = members.map(member => ({
        ...member,
        isOnline: isUserOnline(member.id)
    }));

    const membersModalRef = useRef();

    function handleOpenCircleDetailsModal() {
        circleDetailsRef.current.open();
    }
    function handleCloseCircleDetailsModal() {
        circleDetailsRef.current.close();
    }
    useEffect(() => {
        if (circleId && !membersByCircle[circleId]) {
            dispatch(fetchCircleMembers(circleId));
        }
    }, [circleId, dispatch, membersByCircle]);

    // Detect screen size
    useEffect(() => {
        const checkScreen = () => {
            const small = window.innerWidth < 768;
            setIsSmallScreen(small);
            if (small) {
                setIsOpen(false);
            } else {
                setIsOpen(true);
            }
        };
        checkScreen();
        window.addEventListener("resize", checkScreen);
        return () => window.removeEventListener("resize", checkScreen);
    }, []);
    const deleteCircleRef = useRef();
    const [selectedCircleToDelete, setSelectedCircleToDelete] = useState(null);
    const toggleSidebar = () => setIsOpen(prev => !prev);

    // Get the current circle (you may need to fetch it from Redux or props)
    const circles = useSelector(state => state.circles.circles);
    const selectedCircle = useSelector(state => state.circles.selectedCircle);
    // Falls back to the deep-linked circle the circle page loaded.
    const currentCircle = circles.find(c => c.id === circleId)
        || (selectedCircle?.id === circleId ? selectedCircle : null);

    // Use currentCircle for ownership check
    const isOwner = user && currentCircle && currentCircle.createdBy === user.uid;

    function handleDeleteCircle() {
        deleteCircle({
            selectedCircleToDelete,
            isOwner,
            closeCircleDeleteModal,
            setIsDeleting,
        });
    };

    function openDeleteCircleModal(circle) {
        setSelectedCircleToDelete(circle);
        deleteCircleRef.current.open();
    }

    function closeCircleDeleteModal() {
        setSelectedCircleToDelete(null);
        deleteCircleRef.current.close();
    }
    return (
        <ChatSidebarPresentational
            circleDetailsRef={circleDetailsRef}
            isOpen={isOpen}
            toggleSidebar={toggleSidebar}
            isSmallScreen={isSmallScreen}
            members={membersWithOnlineStatus}
            loading={status === 'loading'}
            error={error}
            onShowAllMembers={() => membersModalRef.current?.open()}
            membersModalRef={membersModalRef}
            closeMembersModal={() => membersModalRef.current?.close()}
            closeSidebar={() => setIsOpen(false)}
            onOpen={handleOpenCircleDetailsModal}
            onClose={handleCloseCircleDetailsModal}
            openDeleteCircleModal={openDeleteCircleModal}
            closeCircleDeleteModal={closeCircleDeleteModal}
            handleDeleteCircle={handleDeleteCircle}
            isDeleting={isDeleting}
            isOwner={isOwner}
            deleteCircleRef={deleteCircleRef}
            currentCircle={currentCircle}
        />
    );
}

export default ChatSidebarContainer;
