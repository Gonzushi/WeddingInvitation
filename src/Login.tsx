import { supabase } from "./supabaseClient";
import { FcGoogle } from "react-icons/fc";
// import { FaApple } from "react-icons/fa";

type LoginPageProps = {
  page: string;
};

export default function LoginPage({ page }: LoginPageProps) {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/${page}`,
      },
    });
    if (error) console.error("Google login error:", error.message);
  };

  //   const handleAppleLogin = async () => {
  //     const { error } = await supabase.auth.signInWithOAuth({
  //       provider: "apple",
  //       options: {
  //         redirectTo: `${window.location.origin}/admin`,
  //       },
  //     });
  //     if (error) console.error("Apple login error:", error.message);
  //   };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-sm text-center border border-black">
        <h2 className="text-2xl font-bold mb-6">Welcome</h2>
        <button
          onClick={handleGoogleLogin}
          className="flex items-center gap-3 w-full justify-center border border-gray-300 rounded-md py-2 mb-4 hover:bg-gray-100 transition"
        >
          <FcGoogle size={20} />
          <span>Sign in with Google</span>
        </button>
        {/* <button
          onClick={handleAppleLogin}
          className="flex items-center gap-3 w-full justify-center border border-gray-300 rounded-md py-2 hover:bg-gray-100 transition"
        >
          <FaApple size={20} />
          <span>Sign in with Apple</span>
        </button> */}
      </div>
    </div>
  );
}
