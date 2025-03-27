"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DatabaseIcon,
  HomeIcon,
  SettingsIcon,
  LogOutIcon,
  CloudIcon,
} from "lucide-react";
import { useCredentialsStore } from "@/store/credentialsStore";
import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { credentials, clearCredentials } = useCredentialsStore();
  const [buckets, setBuckets] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Query to get buckets
  const validateCredentialsMutation = trpc.r2.validateCredentials.useMutation();

  useEffect(() => {
    if (credentials) {
      validateCredentialsMutation.mutate(credentials, {
        onSuccess: (data) => {
          if (data.success && data.buckets) {
            setBuckets(data.buckets);
          }
        },
      });
    }
  }, [credentials]);

  // Handle logout
  const handleLogout = () => {
    clearCredentials();
    router.push("/");
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        "w-60"
      )}
    >
      {/* Logo and collapse button */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 overflow-hidden">
          <svg
            className="h-6 w-6 flex-shrink-0 text-primary"
            viewBox="0 0 128 112"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M64 0L0 112H128L64 0ZM65.3409 20.8783L109.442 97.3554L65.3409 71.0532V20.8783Z"
              fill="currentColor"
            />
          </svg>
          <span className="font-medium text-sidebar-foreground whitespace-nowrap overflow-hidden text-ellipsis">
            BetterFlare{" "}
            <span className="text-muted-foreground italic text-xs pr-2">
              by ZEIT
            </span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        <NavItem
          href="/dashboard"
          icon={<HomeIcon className="h-4 w-4" />}
          label="Dashboard"
          isActive={pathname === "/dashboard"}
          isExpanded={isExpanded}
        />

        {/* Buckets section */}
        {isExpanded && (
          <div className="px-3 mt-6 mb-2">
            <h3 className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
              Buckets
            </h3>
          </div>
        )}

        {buckets.map((bucket) => (
          <NavItem
            key={bucket.Name}
            href={`/dashboard/bucket/${bucket.Name}`}
            icon={<DatabaseIcon className="h-4 w-4" />}
            label={bucket.Name}
            isActive={pathname.includes(`/dashboard/bucket/${bucket.Name}`)}
            isExpanded={isExpanded}
          />
        ))}

        {/* Settings */}
        <div className="mt-auto">
          {isExpanded && (
            <div className="px-3 mt-6 mb-2">
              <h3 className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
                Settings
              </h3>
            </div>
          )}

          <NavItem
            href="/settings"
            icon={<SettingsIcon className="h-4 w-4" />}
            label="Settings"
            isActive={pathname === "/settings"}
            isExpanded={isExpanded}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start px-3 py-2 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              !isExpanded && "justify-center px-2"
            )}
          >
            <LogOutIcon className="h-4 w-4 mr-2" />
            {isExpanded && "Logout"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
}

function NavItem({ href, icon, label, isActive, isExpanded }: NavItemProps) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push(href)}
      className={cn(
        "w-full justify-start px-3 py-2",
        isExpanded ? "justify-start" : "justify-center px-2",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
    >
      <span className={cn("mr-2", !isExpanded && "mr-0")}>{icon}</span>
      {isExpanded && <span className="truncate">{label}</span>}
    </Button>
  );
}
