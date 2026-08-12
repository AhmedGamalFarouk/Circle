// libs
import { motion as Motion } from "framer-motion";
// components
import FloatingAvatarContainer from "../../components/ui/FloatingAvatars/FloatingAvatarContainer";
import CreateCircleModalContainer from "../../components/ui/Modal/CreateCircleModal/CreateCircleModalContainer";
import Modal from "../../components/ui/Modal/Modal";
import LoginFormContainer from "../../components/AuthForms/Login/LoginFormContainer";
import RegisterFormContainer from "../../components/AuthForms/Register/RegisterFormContainer";
import { useContext, useEffect, useState } from "react";
import mainImg from "../../assets/image.png";
import lightImg from "../../assets/light.png";
import { ThemeContext } from "../../contexts/ThemeContext";
import Stepper, { Step } from "../../components/ui/Stepper/Stepper";
import friends from "../../assets/images/friendsjpg.jpg";
import eventTutorial from "../../assets/images/event.mp4";
import DefaultState from "../../components/Voting/DefaultState/DefaultState";
import { Helmet } from "react-helmet";
export default function LandingPresentational({
  t,
  isLoggedIn,
  openCCircleModal,
  createCircleModalRef,
  closeCCircleModal,
  handleSkipAuth,
  isSkipLoading,
}) {
  const [authFormType, setAuthFormType] = useState("login");
  const { darkMode } = useContext(ThemeContext);
  const [display, setDisplay] = useState("");
  const bgImage = darkMode ? lightImg : mainImg;

  const handleSwitchToRegister = () => setAuthFormType("register");
  const handleSwitchToLogin = () => setAuthFormType("login");

  // useEffect(() => {
  //   setBgImage(darkMode ? lightImg : mainImg);
  // }, [darkMode]);

  return (
    <>
      <Helmet>
        <title>{t("Landing Page")}</title>
        <meta name="description" content={t("Welcome to the landing page")} />
      </Helmet>
      <div
        className="flex h-screen flex-col overflow-hidden"
        key={darkMode ? "dark" : "light"}
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {display === "hidden" || isLoggedIn ? (
          <Motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="pt-paddingTop z-10 flex min-h-screen w-full flex-col items-center pr-8 pb-8 pl-8"
          >
            <div className="mt-18 max-w-xl">
              <Motion.h1
                className="mb-6 text-center text-xl leading-tight font-bold sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <span className="text-text ltr:font-secondary">
                  {t("From we should..")}
                </span>
                <span className="ltr:font-secondary from-secondary to-primary block bg-gradient-to-l bg-clip-text text-transparent ltr:bg-gradient-to-r rtl:bg-gradient-to-l">
                  {t("to we did!")}
                </span>
              </Motion.h1>

              <Motion.p
                className="text-text-300 text-text mb-8 text-center text-sm leading-relaxed sm:text-base md:text-lg lg:text-xl"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                {t(
                  "Circle combats social drift by reducing the logistical friction of planning group activities.It provides a dedicated space for social circles to decide, plan, and relive their shared experiences,transforming intention into connection.",
                )}
              </Motion.p>

              <Motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="flex flex-wrap items-center justify-center gap-4 text-center"
              >
                <button
                  onClick={() => {
                    setAuthFormType("login");
                    openCCircleModal();
                  }}
                  className="bg-main shadow-main border-primary text-text cursor-pointer rounded-lg border px-6 py-3 font-medium transition-all hover:scale-95 hover:shadow-none"
                >
                  {t("Create Circle")}
                </button>
                {!isLoggedIn && (
                  <button
                    onClick={handleSkipAuth}
                    disabled={isSkipLoading}
                    className="from-secondary to-primary text-text hover:from-primary hover:to-secondary cursor-pointer rounded-lg bg-gradient-to-r px-6 py-3 font-medium shadow-md transition-all hover:scale-95 disabled:opacity-50"
                  >
                    {isSkipLoading ? t("Signing in...") : t("Skip Authentication")}
                  </button>
                )}
                <Modal ref={createCircleModalRef}>
                  {isLoggedIn ? (
                    <CreateCircleModalContainer
                      closeModal={closeCCircleModal}
                    />
                  ) : authFormType === "login" ? (
                    <LoginFormContainer
                      onSwitchToRegister={handleSwitchToRegister}
                    />
                  ) : (
                    <RegisterFormContainer
                      onSwitchToLogin={handleSwitchToLogin}
                    />
                  )}
                </Modal>
              </Motion.div>

              <Motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="z-10 hidden w-full justify-center p-8 md:flex md:w-1/2"
              >
                <FloatingAvatarContainer />
              </Motion.div>
            </div>
          </Motion.div>
        ) : (
          <Motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`${display} pt-paddingTop z-10 flex min-h-screen w-full flex-col items-center pr-8 pb-8 pl-8`}
          >
            <Stepper
              initialStep={1}
              onStepChange={(step) => {
                console.log(step);
              }}
              onFinalStepCompleted={() => {
                console.log("All steps completed!");
                setTimeout(() => {
                  setDisplay("hidden");
                }, 500);
              }}
              backButtonText="Previous"
              nextButtonText="Next"
            >
              <Step>
                <h2>
                  Welcome to{" "}
                  <span className="ltr:font-secondary from-secondary to-primary inline-block bg-gradient-to-l bg-clip-text font-extrabold text-transparent ltr:bg-gradient-to-r rtl:bg-gradient-to-l">
                    Circle
                  </span>{" "}
                  where events are made!
                </h2>
                <p>Check out the next step!</p>
              </Step>
              <Step>
                <h2>Step 2</h2>
                <img
                  style={{
                    height: "100px",
                    width: "100%",
                    objectFit: "cover",
                    objectPosition: "center -70px",
                    borderRadius: "15px",
                    marginTop: "1em",
                  }}
                  src={friends}
                />
                <p>Create circles with your people!</p>
              </Step>
              <Step>
                <div className="h-[150px]">
                  <h2>Where you can start poll and vote on it?</h2>
                  <div className="relative top-[45%] left-[50%] translate-x-[-25%]">
                    <DefaultState />
                  </div>
                </div>
              </Step>
              <Step>
                <h2>Create Events</h2>
                <video
                  autoPlay
                  loop
                  muted
                  style={{
                    height: "250px",
                    width: "100%",
                    objectFit: "cover",
                    objectPosition: "center -70px",
                    borderRadius: "15px",
                    marginTop: "1em",
                  }}
                  src={eventTutorial}
                />
                <p>and confirm it!</p>
              </Step>
              <Step>
                <h2>Explore nearest events from you!</h2>
              </Step>
              <Step>
                <h2>Final Step</h2>
                <p>You made it!</p>
              </Step>
            </Stepper>
          </Motion.div>
        )}
      </div>
    </>
  );
}
