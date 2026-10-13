// Account deletion (SPEC C1). Re-authenticates, lets the user pick who takes
// over each circle they own, then calls /api/delete-account. The route does all
// the deleting (including the Auth user); a failure names its step and Retry
// resumes it. Also the "Finish deleting your account" screen for a signed-in
// user whose profile is already gone (RootLayout sends them here).
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, signOut } from "firebase/auth";
import { auth } from "../../firebase-config";
import { fetchCircleMembers } from "../../features/circleMembers/circleMembersSlice";
import { getProfileData } from "../../features/userProfile/profileSlice";
import { DEMO_EMAIL } from "../../utils/demoAccount";

const STEP_LABELS = {
    ownedCircles: "your circles",
    votes: "your votes",
    memberships: "your memberships",
    relationships: "your connections",
    requests: "your requests and notifications",
    media: "your photos",
    profile: "your profile",
    auth: "your sign-in",
};

export default function DeleteAccountPage() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = auth.currentUser;
    const profile = useSelector(getProfileData);
    const profileMissing = useSelector((s) => s.userProfile.status === "succeeded") && !profile;
    const joinedCircles = useSelector((s) => s.circles.joinedCircles);
    const membersByCircle = useSelector((s) => s.members.membersByCircle);

    const usesPassword = user?.providerData.some((p) => p.providerId === "password");
    const isDemo = user?.email === DEMO_EMAIL;
    const [password, setPassword] = useState("");
    const [newOwners, setNewOwners] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null); // { message, retry }

    // Circles you own that someone else could take over.
    const ownedCircles = useMemo(
        () => joinedCircles.filter((c) => c.createdBy === user?.uid),
        [joinedCircles, user?.uid],
    );
    useEffect(() => {
        ownedCircles.forEach((c) => {
            if (!membersByCircle[c.id]) dispatch(fetchCircleMembers(c.id));
        });
    }, [ownedCircles, membersByCircle, dispatch]);
    const othersIn = (circleId) =>
        (membersByCircle[circleId] || []).filter((m) => (m.userId || m.id) !== user?.uid);

    async function reauthenticate() {
        if (usesPassword) {
            await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
        } else {
            await reauthenticateWithPopup(user, new GoogleAuthProvider());
        }
    }

    async function callRoute() {
        const token = await user.getIdToken(true);
        const res = await fetch("/api/delete-account", {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
            body: JSON.stringify({ newOwners }),
        });
        return res.json().catch(() => ({ ok: false }));
    }

    async function handleDelete(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await reauthenticate();
        } catch (err) {
            setBusy(false);
            setError({ message: err.code === "auth/wrong-password" || err.code === "auth/invalid-credential"
                ? t("That password isn't right.") : t("Couldn't confirm it's you. Try again.") });
            return;
        }
        await runDeletion();
    }

    async function runDeletion() {
        setBusy(true);
        setError(null);
        let result;
        try {
            result = await callRoute();
        } catch {
            result = { ok: false };
        }
        if (result.ok) {
            await signOut(auth).catch(() => {});
            toast.success(t("Your account was deleted."));
            navigate("/", { replace: true });
            return;
        }
        setBusy(false);
        if (result.error === "reauth") {
            setError({ message: t("Please confirm it's you again.") });
        } else if (result.failedStep) {
            setError({
                message: t("Deleting stopped at {{step}}. Nothing is lost; try again.", { step: t(STEP_LABELS[result.failedStep] || result.failedStep) }),
                retry: true,
            });
        } else {
            setError({ message: t("Couldn't reach the server. Try again."), retry: true });
        }
    }

    if (!user) return null;

    return (
        <main className="pt-paddingTop min-h-screen bg-gradient-to-b from-bg-primary to-bg-secondary px-4 pb-16 text-text">
            <div className="mx-auto max-w-xl rounded-3xl bg-main p-6 sm:p-8">
                <h1 className="text-2xl font-bold">
                    {profileMissing ? t("Finish deleting your account") : t("Delete your account")}
                </h1>
                <p className="mt-3 text-text-400">
                    {profileMissing
                        ? t("Your profile is already gone, but your sign-in still exists. Confirm it's you to finish.")
                        : t("This removes your profile, photos, memberships, votes, connections and requests. Messages you sent stay in their circles. This can't be undone.")}
                </p>

                {isDemo ? (
                    <p className="mt-6 rounded-2xl border border-primary p-4" role="note">
                        {t("The demo account can't be deleted.")}
                    </p>
                ) : (
                    <form onSubmit={handleDelete} className="mt-6 flex flex-col gap-5">
                        {ownedCircles.length > 0 && (
                            <fieldset className="flex flex-col gap-3">
                                <legend className="mb-1 font-semibold">{t("Circles you own")}</legend>
                                {ownedCircles.map((c) => {
                                    const others = othersIn(c.id);
                                    return (
                                        <label key={c.id} className="flex flex-col gap-1 text-sm">
                                            <span className="font-medium">{c.circleName}</span>
                                            {others.length ? (
                                                <select
                                                    value={newOwners[c.id] || ""}
                                                    onChange={(e) => setNewOwners((o) => ({ ...o, [c.id]: e.target.value }))}
                                                    className="min-h-11 rounded-xl border border-primary bg-transparent px-3"
                                                >
                                                    <option value="">{t("Pick automatically (an admin first)")}</option>
                                                    {others.map((m) => (
                                                        <option key={m.id} value={m.userId || m.id}>{m.username || m.userId || m.id}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-text-400">{t("You're the only member, so this circle will be deleted.")}</span>
                                            )}
                                        </label>
                                    );
                                })}
                            </fieldset>
                        )}

                        {usesPassword && (
                            <label className="flex flex-col gap-1 text-sm">
                                <span className="font-medium">{t("Password")}</span>
                                <input
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="min-h-11 rounded-xl border border-primary bg-transparent px-3"
                                />
                            </label>
                        )}

                        {error && (
                            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-500 p-3 text-sm">
                                <span>{error.message}</span>
                                {error.retry && (
                                    <button type="button" onClick={runDeletion} disabled={busy}
                                        className="min-h-11 rounded-3xl border border-primary px-4 font-semibold text-primary">
                                        {t("Retry")}
                                    </button>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={busy}
                            aria-busy={busy}
                            className="min-h-11 rounded-3xl bg-red-600 px-6 font-semibold text-white disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                        >
                            {busy ? t("Deleting…") : usesPassword ? t("Delete my account") : t("Confirm with Google and delete")}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
