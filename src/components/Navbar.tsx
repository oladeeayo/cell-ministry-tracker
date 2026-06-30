"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

const ROLE_LABELS: Record<string, string> = {
  COMMUNITY_PASTOR: "Community Pastor",
  DISTRICT_LEADER: "District Leader",
  ZONAL_LEADER: "Zonal Leader",
  CELL_LEADER: "Cell Leader",
  ASST_CELL_LEADER: "Asst. Cell Leader",
  E_GROUP_LEADER: "E-Group Leader",
};

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">✝</span>
              </div>
              <span className="font-semibold text-gray-800 hidden sm:block">
                Cell Ministry
              </span>
            </Link>
            {user?.role && (
              <span className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">
                {ROLE_LABELS[user.role] || user.role}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">
              {user?.name}
            </span>
            <Link href="/profile" className="text-sm text-gray-500 hover:text-primary-700 transition">
              Profile
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-gray-500 hover:text-red-600 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
