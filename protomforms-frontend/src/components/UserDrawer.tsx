"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { User, LogOut, Settings, Fingerprint } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const drawerVariants = {
  hidden: {
    y: "100%",
    opacity: 0,
    rotateX: 5,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  visible: {
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8,
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: {
    y: 20,
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
};

interface UserDrawerProps {
  trigger: React.ReactNode;
}

export default function UserDrawer({ trigger }: UserDrawerProps) {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = user?.name || "Utente";
  const userEmail = user?.email || "";
  const isAdmin = user?.role === "ADMIN";

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Drawer direction="bottom">
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="w-full max-w-[600px] mx-auto p-0 rounded-t-2xl rounded-b-none shadow-xl">
        <motion.div
          variants={drawerVariants as any}
          initial="hidden"
          animate="visible"
          className="w-full space-y-0"
        >
          {/* Header con informazioni utente */}
          <motion.div variants={itemVariants as any} className="px-6 pt-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFCD00] to-[#FFD700] flex items-center justify-center text-black font-bold text-lg shadow-lg">
                  {getInitials(userName)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-gray-900 truncate">
                  {userName}
                </h3>
                <p className="text-sm text-gray-600 truncate mt-1">
                  {userEmail}
                </p>
                {isAdmin && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md">
                    Amministratore
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Menu items */}
          <motion.div variants={itemVariants as any} className="px-4 py-2">
            <div className="space-y-1">
              <a
                href="https://myaccount.microsoft.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profilo</span>
              </a>

              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Pannello Admin</span>
                </Link>
              )}
            </div>
          </motion.div>

          {/* Footer con logout */}
          <motion.div variants={itemVariants as any} className="px-6 pb-6 pt-4 border-t border-gray-200">
            <DrawerClose asChild>
              <Button
                onClick={handleLogout}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-600 dark:to-pink-600 text-white text-sm font-semibold tracking-wide shadow-lg shadow-red-500/20 transition-all duration-500 hover:shadow-xl hover:shadow-red-500/30"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </motion.div>
              </Button>
            </DrawerClose>
          </motion.div>
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
}

