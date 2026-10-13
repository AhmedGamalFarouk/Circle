import { useContext, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase-config";
import HeaderContainer from "../components/Header/HeaderContainer";
import { ThemeContext } from "../contexts/ThemeContext";
function RootLayout() {

  const {darkMode, setDarkMode} = useContext(ThemeContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const profileStatus = useSelector((s) => s.userProfile.status);
  const profile = useSelector((s) => s.userProfile.profile);

  // Signed in but the profile is gone: a deletion stopped after removing it
  // (SPEC C1), so finish it. A brand-new account gets a 2-minute grace period
  // unless its deletion job exists, since sign-up writes the profile just after
  // the Auth user.
  useEffect(() => {
    const user = auth.currentUser;
    if (!(profileStatus === "succeeded" && !profile && user) || pathname === "/account/delete") return;
    let cancelled = false;
    const old = Date.now() - Date.parse(user.metadata.creationTime || "") > 2 * 60 * 1000;
    const deleting = old ? Promise.resolve(true)
      : getDoc(doc(db, "users", user.uid, "private", "deletionJob")).then((s) => s.exists()).catch(() => false);
    deleting.then((go) => {
      if (go && !cancelled) navigate("/account/delete", { replace: true });
    });
    return () => { cancelled = true; };
  }, [profileStatus, profile, pathname, navigate]);

// Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);


  return (
    <div className={darkMode ? "light" : ""}>
      <HeaderContainer toggleDark={() => setDarkMode(!darkMode)} darkMode={darkMode} />
      <Outlet />
    </div>
  );
}

export default RootLayout;
