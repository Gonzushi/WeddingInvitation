import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import LoginPage from "./Login";
import Admin from "./Admin";
import Approval from "./Approval";
import { type Session } from "@supabase/supabase-js";

interface ProtectedPageProps {
  page: "admin" | "approval";
}

export default function ProtectedPage({ page }: ProtectedPageProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthAndApproval = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        const { data, error } = await supabase
          .from("approved_users")
          .select("is_approved")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error checking approval:", error.message);
          setIsApproved(false);
        } else {
          setIsApproved(data.is_approved);
        }
      }

      setLoading(false);
    };

    checkAuthAndApproval();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        supabase
          .from("approved_users")
          .select("is_approved")
          .eq("id", session.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error("Error checking approval:", error.message);
              setIsApproved(false);
            } else {
              setIsApproved(data.is_approved);
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white text-black">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-300 mb-4" />
        <p className="text-lg font-semibold">Loading, please wait...</p>
      </div>
    );
  if (!session)
    return <LoginPage page={page == "admin" ? "admin" : "admin/approval"} />;

  if (isApproved === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-sm text-center border border-orange-300">
          <h2 className="text-xl font-semibold text-orange-600 mb-4">
            Approval Pending
          </h2>
          <p className="text-gray-700 mb-4">
            Your account has been created successfully, but is currently pending
            admin approval.
          </p>
          <div className="animate-pulse text-orange-500 text-sm mb-3">
            Please check back later.
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  // ✅ Render page based on input
  if (page === "approval") return <Approval />;
  return <Admin />;
}
