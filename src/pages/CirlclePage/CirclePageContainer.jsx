// libs
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router";
import { useEffect } from "react";
//func
import { fetchCircleById } from "../../features/circles/circlesSlice";
import useAuth from "../../hooks/pollhooks/useAuth";
// components
import CirclePagePresentational from "./CirclePagePresentational"
function CirclePageContainer() {
    const { user } = useAuth();
    const { circleId } = useParams();
    const dispatch = useDispatch();
    const selectedCircle = useSelector((state) => state.circles.selectedCircle);
    const selectedCircleStatus = useSelector((state) => state.circles.selectedCircleStatus);
    useEffect(() => {
        if (!selectedCircle || selectedCircle.id !== circleId) {
            dispatch(fetchCircleById(circleId));
        }
    }, [circleId, dispatch, selectedCircle]);

    if (selectedCircleStatus === "failed") {
        return (
            <div className="pt-paddingTop flex h-screen flex-col items-center justify-center gap-4 text-text">
                <h1 className="text-2xl font-bold">Circle not found</h1>
                <p className="text-text-400">This circle doesn't exist or was deleted.</p>
                <Link to="/circles" className="bg-primary rounded-full px-5 py-2 font-semibold">
                    Back to circles
                </Link>
            </div>
        );
    }

    return (
        <CirclePagePresentational user={user} />
    )
}

export default CirclePageContainer
