// libs
import { Eye, EyeOff } from "lucide-react";
import { motion as Motion } from "framer-motion";
// components
import Button from "../../../components/ui/Buttons/Button";
import AuthButton from "../../../components/ui/Buttons/AuthButton";
import GoogleIcon from "../../../assets/icons/google.svg";
import { Link } from "react-router-dom";
import { Logo } from "../../../assets/icons/Logo";
function LoginFormPresentational({
    handleSignIn,
    handleSkipAuth,
    handleKeyPress,
    setShowPassword,
    email,
    isLoading,
    showPassword,
    password,
    onSwitchToRegister,
    errors = {},
    // Refs
    emailRef,
    passwordRef,
}) {
    return (
        <>
            <div className="w-full max-w-md px-8">
                {/* Logo */}
                <Motion.div
                    className="mb-8 flex justify-center text-center"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    <Logo />
                </Motion.div>

                {/* Welcome Text */}
                <Motion.div
                    className="mb-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                >
                    <h1 className="font-quick-sand mb-2 text-3xl font-bold text-text">
                        Welcome to Circle
                    </h1>
                    <p className="text-text text-sm">Let's sign you in</p>
                </Motion.div>

                {/* Login Form */}
                <Motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    <form onSubmit={handleSignIn} className="space-y-4">
                        <div>
                            <input
                                ref={emailRef}
                                type="text"
                                placeholder="Email address"
                                defaultValue={email}
                                onKeyUp={handleKeyPress}
                                disabled={isLoading}
                                className="bg-inputsBg h-12 w-full rounded-xl border-text-600 ps-2 text-text outline-0 backdrop-blur-sm placeholder:text-text-400 disabled:opacity-50"
                            />
                            {errors.email && (
                                <span className="text-red-500 text-xs mt-1 block">{errors.email}</span>
                            )}
                        </div>

                        <div className="relative">
                            <input
                                ref={passwordRef}
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                defaultValue={password}
                                onKeyPress={handleKeyPress}
                                disabled={isLoading}
                                className="bg-inputsBg h-12 w-full rounded-xl border-text-600 ps-2 pr-12 text-text outline-0 backdrop-blur-sm placeholder:text-text-400 disabled:opacity-50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                                className="absolute top-1/2 right-3 -translate-y-1/2 transform text-text-400 transition-colors hover:text-text disabled:opacity-50"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                            {errors.password && (
                                <span className="text-red-500 text-xs mt-1 block">{errors.password}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Button
                                variant={"primary"}
                                size={"xlarge"}
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? "Signing in..." : "Login"}
                            </Button>
                            {handleSkipAuth && (
                                <button
                                    type="button"
                                    onClick={handleSkipAuth}
                                    disabled={isLoading}
                                    className="w-full h-12 rounded-xl from-secondary to-primary text-text hover:from-primary hover:to-secondary cursor-pointer bg-gradient-to-r font-medium shadow-md transition-all hover:scale-[0.99] disabled:opacity-50"
                                >
                                    {isLoading ? "Signing in..." : "Skip Authentication"}
                                </button>
                            )}
                        </div>
                        <div>
                            <Link
                                to={"/forget-password"}
                                className="text-text text-right block cursor-pointer hover:underline"
                            >
                                forget password?
                            </Link>
                        </div>
                        {/* </div> */}
                    </form>

                    <div className="pt-4 text-center">
                        <span className="text-text text-sm">Don't have an account?</span>
                        {onSwitchToRegister ? (
                            <button
                                type="button"
                                className="text-primary cursor-pointer ps-2 text-sm font-medium transition-colors hover:text-purple-300 bg-transparent border-0 outline-none"
                                onClick={onSwitchToRegister}
                            >
                                Create an account
                            </button>
                        ) : (
                            <Link
                                className="text-primary cursor-pointer ps-2 text-sm font-medium transition-colors hover:text-purple-300"
                                to={"/register"}
                            >
                                Create an account
                            </Link>
                        )}
                    </div>
                </Motion.div>
            </div>
        </>

    )
}

export default LoginFormPresentational
