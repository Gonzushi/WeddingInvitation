import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

type ApprovedUser = {
  id: string;
  email: string;
  is_approved: boolean;
  created_at?: string;
};

const SUPER_ADMINS = ["hendry.widyanto10@gmail.com"];

export default function ApprovalPage() {
  const [users, setUsers] = useState<ApprovedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("approved_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error.message);
    } else {
      setUsers(data);
    }

    setLoading(false);
  };

  const fetchCurrentUser = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      console.error("Failed to fetch current user:", error?.message);
      setIsSuperAdmin(false);
    } else {
      const email = data.user.email;
      setIsSuperAdmin(SUPER_ADMINS.includes(email ?? ""));
    }
  };

  const approveUser = async (id: string) => {
    const { error } = await supabase
      .from("approved_users")
      .update({ is_approved: true })
      .eq("id", id);

    if (error) {
      alert("Failed to approve user: " + error.message);
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_approved: true } : u))
      );
    }
  };

  const deactivateUser = async (id: string) => {
    const { error } = await supabase
      .from("approved_users")
      .update({ is_approved: false })
      .eq("id", id);

    if (error) {
      alert("Failed to deactivate user: " + error.message);
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_approved: false } : u))
      );
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    fetchCurrentUser().then(() => fetchUsers());
  }, []);

  if (isSuperAdmin === null) {
    return <p className="p-6">Checking access...</p>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center px-6">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md border border-black">
          <div className="text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.054 0 1.636-1.136 1.054-2L13.054 4c-.527-.8-1.582-.8-2.109 0L2.938 18c-.582.864 0 2 1.054 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You are not authorized to view this page. Only super admins can
            access this section.
          </p>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Top Bar with Logout */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Approval</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
        >
          Logout
        </button>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-left">
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">
                    {user.is_approved ? (
                      <span className="text-green-600 font-medium">
                        Approved
                      </span>
                    ) : (
                      <span className="text-orange-600 font-medium">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {SUPER_ADMINS.includes(user.email) ? (
                      <span className="text-gray-400 italic text-sm">
                        Superadmin
                      </span>
                    ) : user.is_approved ? (
                      <button
                        onClick={() => deactivateUser(user.id)}
                        className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md text-sm"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => approveUser(user.id)}
                        className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-6">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
