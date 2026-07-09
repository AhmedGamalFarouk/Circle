import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase-config";
import ContextualPin from "../ContextualPin/ContextualPin";
import PollCreation from "../../ui/Modal/Poll/CreatePollModalContainer";
import useAuth from "../../../hooks/pollhooks/useAuth";
import useUserProfile from "../../../hooks/pollhooks/useUserProfile";
import Modal from "../../ui/Modal/Modal";
import { usePollModal } from "../../../hooks/chathooks/usePollModal";

const PLANNING_STAGES = {
  IDLE: "Idle",
  PLANNING_ACTIVITY: "Planning the Activity",
  ACTIVITY_POLL_CLOSED: "Activity Poll Closed",
  PLANNING_PLACE: "Planning the Place",
  PLACE_POLL_CLOSED: "Place Poll Closed",
  EVENT_CONFIRMED: "Event Confirmed",
};

export default function CircleScreen() {
  const pollModal = usePollModal();
  const { circleId } = useParams();
  const { user } = useAuth();
  const { profile: userProfile } = useUserProfile(user?.uid);

  const [circle, setCircle] = useState(null);
  const [poll, setPoll] = useState(null);
  const [event, setEvent] = useState(null);
  const [currentStage, setCurrentStage] = useState(PLANNING_STAGES.IDLE);
  const [isPollModalVisible, setPollModalVisible] = useState(false);
  const [pollType, setPollType] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isPinVisible, setPinVisible] = useState(true);

  // Fetch circle + poll data
  useEffect(() => {
    const fetchCircleData = async () => {
      const docRef = doc(db, "circles", circleId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCircle({ id: docSnap.id, ...docSnap.data() });
      }
    };

    fetchCircleData();

    const pollQuery = collection(db, "circles", circleId, "polls");
    const unsubscribe = onSnapshot(pollQuery, (snapshot) => {
      const activePoll = snapshot.docs.find((doc) => !doc.data().archived);
      if (activePoll) {
        const currentPoll = activePoll.data();
        setPoll({ id: activePoll.id, ...currentPoll });
        setCurrentStage(currentPoll.stage);
      } else {
        setPoll(null);
        setCurrentStage(PLANNING_STAGES.IDLE);
      }
    });

    return () => unsubscribe();
  }, [circleId]);

  // Listen to confirmed events in the events subcollection
  useEffect(() => {
    if (!circleId) return;

    const eventsQuery = query(
      collection(db, "circles", circleId, "events"),
      where("status", "==", "confirmed")
    );

    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const confirmedEvent = snapshot.docs[0];
        setEvent({ id: confirmedEvent.id, ...confirmedEvent.data() });
      } else {
        setEvent(null);
      }
    }, (error) => {
      console.error("Error listening to events subcollection:", error);
    });

    return () => unsubscribeEvents();
  }, [circleId]);

  const handleStartPoll = () => {
    setPollType("activity");
    setPollModalVisible(true);
  };

  const handleLaunchPoll = async (pollData) => {
    try {
      setPollModalVisible(false);

      const deadlineDate =
        pollData.deadline instanceof Date
          ? pollData.deadline
          : new Date(pollData.deadline);

      const pollDataWithTimestamp = {
        ...pollData,
        deadline: Timestamp.fromDate(deadlineDate),
      };

      if (pollType === 'activity') {
        const pollRef = collection(db, 'circles', circleId, 'polls');
        const docRef = await addDoc(pollRef, {
          stage: PLANNING_STAGES.PLANNING_ACTIVITY,
          activityPoll: { ...pollDataWithTimestamp, votes: {} },
          timestamp: serverTimestamp(),
          timeStamp: serverTimestamp(),
        });

        // Immediately set the poll state with the new poll id and data
        setPoll({
          id: docRef.id,
          stage: PLANNING_STAGES.PLANNING_ACTIVITY,
          activityPoll: { ...pollDataWithTimestamp, votes: {} },
        });

        // Add system message
        const chatRef = collection(db, 'circles', circleId, 'chat');
        await addDoc(chatRef, {
          messageType: 'system',
          text: `🗳️ Activity poll started: "${pollData.question}"`,
          timestamp: serverTimestamp(),
          timeStamp: serverTimestamp(),
        });

      } else if (pollType === 'place') {
        if (!poll?.id) {
          console.error('No active poll found to update for place poll');
          return;
        }

        const pollRef = doc(db, 'circles', circleId, 'polls', poll.id);
        await updateDoc(pollRef, {
          stage: PLANNING_STAGES.PLANNING_PLACE,
          placePoll: { ...pollDataWithTimestamp, votes: {} },
        });

        // Add system message
        const chatRef = collection(db, 'circles', circleId, 'chat');
        await addDoc(chatRef, {
          messageType: 'system',
          text: `📍 Place poll started: "${pollData.question}"`,
          timestamp: serverTimestamp(),
          timeStamp: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error launching poll:', error);
    }
  };


  useEffect(() => {
    if (isPollModalVisible) {
      pollModal.pollModalRef.current?.open();
    } else {
      pollModal.pollModalRef.current?.close();
    }
  }, [isPollModalVisible]);


  const handleVote = async (option) => {
    if (!poll?.id || !userProfile) return;
    const pollRef = doc(db, "circles", circleId, "polls", poll.id);
    if (currentStage === PLANNING_STAGES.PLANNING_ACTIVITY) {
      await updateDoc(pollRef, {
        "activityPoll.votes": { ...poll.activityPoll.votes, [user.uid]: option },
      });
    } else if (currentStage === PLANNING_STAGES.PLANNING_PLACE) {
      await updateDoc(pollRef, {
        "placePoll.votes": { ...poll.placePoll.votes, [user.uid]: option },
      });
    }
  };

  const handleAddOption = async (optionText, pollType) => {
    if (!poll?.id || !userProfile) return;
    const pollRef = doc(db, "circles", circleId, "polls", poll.id);
    const deadline =
      pollType === "activity"
        ? poll.activityPoll.deadline.toDate()
        : poll.placePoll.deadline.toDate();
    if (new Date() > deadline) return;

    const options =
      pollType === "activity"
        ? [...poll.activityPoll.options, { text: optionText }]
        : [...poll.placePoll.options, { text: optionText }];

    await updateDoc(pollRef, {
      [`${pollType}Poll.options`]: options,
    });

    await addDoc(collection(db, "circles", circleId, "chat"), {
      messageType: "system",
      text: `➕ ${userProfile?.username || "Someone"} added a new ${pollType} option: "${optionText}"`,
      timestamp: serverTimestamp(),
      timeStamp: serverTimestamp(),
    });
  };

  const handleFinishVoting = async () => {
    if (!poll?.id) return;

    const pollRef = doc(db, "circles", circleId, "polls", poll.id);

    const getWinningOption = (votes) => {
      if (!votes || Object.keys(votes).length === 0) return null;
      const counts = Object.values(votes).reduce((acc, opt) => {
        acc[opt] = (acc[opt] || 0) + 1;
        return acc;
      }, {});
      return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
    };

    try {
      if (currentStage === PLANNING_STAGES.PLANNING_ACTIVITY && !poll?.placePoll) {
        if (!poll.activityPoll) {
          console.warn("Missing activity poll data");
          return;
        }
        const winningOption = getWinningOption(poll.activityPoll.votes);
        if (!winningOption) {
          console.warn("No votes cast for activity poll");
          return;
        }

        await updateDoc(pollRef, {
          stage: PLANNING_STAGES.ACTIVITY_POLL_CLOSED,
          winningActivity: winningOption,
        });

        // Add system message
        const chatRef = collection(db, "circles", circleId, "chat");
        await addDoc(chatRef, {
          messageType: "system",
          text: `📊 Activity poll closed! "${winningOption}" won.`,
          timestamp: serverTimestamp(),
          timeStamp: serverTimestamp(),
        });
      } else if (currentStage === PLANNING_STAGES.PLANNING_PLACE) {
        if (!poll.placePoll) {
          console.warn("Missing place poll data");
          return;
        }
        const winningOption = getWinningOption(poll.placePoll.votes);
        if (!winningOption) {
          console.warn("No votes cast for place poll");
          return;
        }

        await updateDoc(pollRef, {
          stage: PLANNING_STAGES.PLACE_POLL_CLOSED,
          winningPlace: winningOption,
        });

        // Add system message
        const chatRef = collection(db, "circles", circleId, "chat");
        await addDoc(chatRef, {
          messageType: "system",
          text: `📍 Place poll closed! "${winningOption}" won.`,
          timestamp: serverTimestamp(),
          timeStamp: serverTimestamp(),
        });

      }
    } catch (error) {
      console.error("Error finishing voting:", error);
    }
  };
  const handleDismiss = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPinVisible(false);
  };

  const handleRsvp = async (status) => {
    if (!poll?.id || !userProfile) return;

    // Update RSVP on confirmed subcollection event if it exists
    if (event?.id) {
      try {
        const eventRef = doc(db, "circles", circleId, "events", event.id);
        await updateDoc(eventRef, {
          rsvps: { ...(event.rsvps || {}), [user.uid]: status },
        });
      } catch (error) {
        console.error("Error updating RSVP in subcollection event:", error);
      }
    }

    const pollRef = doc(db, "circles", circleId, "polls", poll.id);
    await updateDoc(pollRef, {
      rsvps: { ...(poll.rsvps || {}), [user.uid]: status },
    });
  };

  const handlePollNextStep = async () => {
    if (!poll?.id) return;

    const pollRef = doc(db, 'circles', circleId, 'polls', poll.id);

    try {
      if (currentStage === PLANNING_STAGES.ACTIVITY_POLL_CLOSED && !poll?.placePoll) {
        // Move to place polling
        setPollType('place');
        setPollModalVisible(true);
      } else if (currentStage === PLANNING_STAGES.PLACE_POLL_CLOSED) {
        // Create confirmed event in the subcollection so Mobile is in sync!
        const eventsRef = collection(db, 'circles', circleId, 'events');
        await addDoc(eventsRef, {
            title: poll.winningActivity,
            activity: poll.winningActivity,
            location: poll.winningPlace,
            place: poll.winningPlace,
            status: 'confirmed', // Confirmed directly on web
            createdAt: serverTimestamp(),
            createdBy: user.uid,
            rsvps: {},
            day: new Date().toISOString().split('T')[0] // default to today
        });

        // Finalize event and enable RSVPs
        await updateDoc(pollRef, {
          stage: PLANNING_STAGES.EVENT_CONFIRMED,
          rsvps: {}, // Initialize empty RSVP object
        });

        // Add system message about event confirmation
        const chatRef = collection(db, 'circles', circleId, 'chat');
        await addDoc(chatRef, {
          messageType: 'system',
          text: `🎉 Event confirmed! ${poll.winningPlace} for ${poll.winningActivity}. Please RSVP above!`,
          timestamp: serverTimestamp(),
          timeStamp: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error proceeding to next step:', error);
    }
  };

  const handleStartNewPoll = async () => {
    try {
      // Archive the current poll and start fresh
      if (poll?.id) {
        const pollRef = doc(db, 'circles', circleId, 'polls', poll.id);
        await updateDoc(pollRef, {
          archived: true,
          archivedAt: serverTimestamp(),
        });

        // Add system message about starting new planning
        const chatRef = collection(db, 'circles', circleId, 'chat');
        await addDoc(chatRef, {
          messageType: 'system',
          text: '🆕 Starting new event planning!',
          timestamp: serverTimestamp(),
          timeStamp: serverTimestamp(),
        });
      }

      // Reset local state
      setCurrentStage(PLANNING_STAGES.IDLE);
      setPoll(null);
      setPollType(null);
    } catch (error) {
      console.error('Error starting new poll:', error);
    }
  };



  const getShowPlanButtonText = () => {
    switch (currentStage) {
      case PLANNING_STAGES.PLANNING_ACTIVITY:
      case PLANNING_STAGES.PLANNING_PLACE:
        return "View Poll";
      case PLANNING_STAGES.ACTIVITY_POLL_CLOSED:
      case PLANNING_STAGES.PLACE_POLL_CLOSED:
        return "View Results";
      case PLANNING_STAGES.EVENT_CONFIRMED:
        return "View Event Details";
      case PLANNING_STAGES.IDLE:
        return "Show Planning";
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col">
      {isPinVisible ? (
        <ContextualPin
          currentStage={currentStage}
          onStartPoll={handleStartPoll}
          activityPollData={poll?.activityPoll}
          placePollData={poll?.placePoll}
          onFinishVoting={handleFinishVoting}
          onVote={handleVote}
          onAddOption={handleAddOption}
          eventData={{
            winningActivity: event?.title || event?.activity || poll?.winningActivity,
            winningPlace: event?.location || event?.place || poll?.winningPlace,
            rsvps: event?.rsvps || poll?.rsvps || {},
            currentUser: { 
              id: user?.uid, 
              rsvp: event?.rsvps?.[user?.uid] || poll?.rsvps?.[user?.uid] 
            },
          }}
          onRsvp={handleRsvp}
          onStartNewPoll={handleStartNewPoll}
          onPollNextStep={handlePollNextStep}
          onDismiss={handleDismiss}
        />
      ) : (
        getShowPlanButtonText() && (
          <div className="absolute top-[85px] right-[15px] z-10">
            <button
              className="bg-[var(--color-primary)] rounded-full py-2 px-4 text-text font-bold"
              onClick={() => setPinVisible(true)}
            >
              {getShowPlanButtonText()}
            </button>
          </div>
        )
      )}

      {isPollModalVisible && (

        <Modal ref={pollModal.pollModalRef}>
          <PollCreation
            onLaunchPoll={handleLaunchPoll}
            pollType={pollType}
            onClose={pollModal.handleClosePollModal}
          />
        </Modal>
      )}
    </div>
  );
}
