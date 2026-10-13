import Modal from '../../components/ui/Modal/Modal'
import LoginFormContainer from '../../components/AuthForms/Login/LoginFormContainer';
import RegisterFormContainer from '../../components/AuthForms/Register/RegisterFormContainer';
import CircleCardContainer from '../../components/CircleCard/CircleCardContainer';
import DeleteCircleModalContainer from '../../components/ui/Modal/DeleteCircleModal/DeleteCircleModalContainer';
import { Helmet } from 'react-helmet';
function CirclesPagePresentational({
    circles,
    gridRef,
    membersByCircle,
    handleCardClick,
    activeTab,
    profileInterests,
    user,
    handleJoinRequest,
    handleSwitchToRegister,
    handleSwitchToLogin,
    authFormType,
    authModalRef,
    pendingRequests,
    deleteCircleRef,
    openDeleteCircleModal,
    closeCircleDeleteModal,
    onDeleteCircle,
    isDeleting,
    circleName,
    sendingRequestId
    // handleCloseAuthModal
}) {
    return (
        <>
        <Helmet>
            <title>Circles Page</title>
            <meta name="description" content="Explore and manage your circles" />
        </Helmet>
            {!circles.length && <div className="text-center text-lg text-text-400 py-10">No circles to show.</div>}
            <div ref={gridRef} className='mx-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3'>
                {circles.map((circle) => (
                    <div key={circle.id} tabIndex={-1} onClick={() => handleCardClick(circle)} className='cursor bg-main rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'>
                        <CircleCardContainer
                            sendingRequestId={sendingRequestId}
                            circle={circle}
                            membersByCircle={membersByCircle}
                            activeTab={activeTab}
                            profileInterests={profileInterests}
                            user={user}
                            handleJoinRequest={handleJoinRequest}
                            openDeleteCircleModal={openDeleteCircleModal}
                            pendingRequests={pendingRequests} />
                    </div>
                ))}
            </div>
            <Modal ref={authModalRef}>
                {authFormType === "login" ? (
                    <LoginFormContainer
                        onSwitchToRegister={handleSwitchToRegister}
                    />
                ) : (
                    <RegisterFormContainer onSwitchToLogin={handleSwitchToLogin} />
                )}
            </Modal>
            <Modal ref={deleteCircleRef}>
                <DeleteCircleModalContainer
                    onDeleteCircle={onDeleteCircle}
                    closeCircleDeleteModal={closeCircleDeleteModal}
                    isDeleting={isDeleting}
                    circleName={circleName}
                />
            </Modal>
        </>
    )
}

export default CirclesPagePresentational;
