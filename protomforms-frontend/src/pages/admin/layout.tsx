import React from 'react';
// next-auth removed - needs custom auth;
import { redirect } from "react-router-dom";
import { motion } from "framer-motion";
import NavbarWrapper from "@/components/NavbarWrapper";
import { Zap } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center animate-pulse shadow-lg">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div className="text-xl font-semibold text-gray-700">Caricamento...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    navigate("/auth/signin");
  }

  if (session.user.role !== 'ADMIN') {
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <NavbarWrapper session={session} />
      
      {/* Main Content */}
      <div className="pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-6"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
