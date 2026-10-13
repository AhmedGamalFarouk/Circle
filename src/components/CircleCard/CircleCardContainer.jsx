import CircleCardPresentational from './CircleCardPresentational';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';

function CircleCardContainer({
    profileInterests,
    pendingRequests,
    circle,
    membersByCircle,
    activeTab,
    openDeleteCircleModal,
    closeCircleDeleteModal,
    handleJoinRequest,
    sendingRequestId
}) {
    const { user } = useAuth();
    const hasImage = !!circle.imageUrl;
    const members = membersByCircle?.[circle.id] || [];

    // Responsive interests count
    const [maxInterests, setMaxInterests] = useState(4);

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth < 913) {
                setMaxInterests(2);
            } else if (window.innerWidth >= 1024 && window.innerWidth < 1330) {
                setMaxInterests(2);
            } else {
                setMaxInterests(4);
            }
        }
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const mutualInterests = (circle.interests || []).filter((interest) =>
        profileInterests?.includes(interest),
    );
    const otherInterests = (circle.interests || []).filter(
        (interest) => !profileInterests?.includes(interest),
    );

    const displayedInterests = [...mutualInterests, ...otherInterests].slice(0, maxInterests);

    const isRequestPending = pendingRequests?.includes(circle.id);
    const isOwner = user && circle.createdBy === user.uid;

    return (
        <CircleCardPresentational
            sendingRequestId={sendingRequestId}
            hasImage={hasImage}
            members={members}
            membersLoaded={!!membersByCircle?.[circle.id]}
            displayedInterests={displayedInterests}
            isRequestPending={isRequestPending}
            circle={circle}
            membersByCircle={membersByCircle}
            isOwner={isOwner}
            openDeleteCircleModal={openDeleteCircleModal}
            closeCircleDeleteModal={closeCircleDeleteModal}
            user={user}
            activeTab={activeTab}
            handleJoinRequest={handleJoinRequest}
        />
    );
}

export default CircleCardContainer;
