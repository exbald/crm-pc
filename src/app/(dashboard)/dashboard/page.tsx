"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatDate, isOverdue } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardCheck,
  Bug,
  FolderKanban,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const priorityVariant: Record<string, "danger" | "orange" | "warning" | "default"> = {
  critical: "danger",
  high: "orange",
  medium: "warning",
  low: "default",
};

const statusVariant: Record<string, "default" | "warning" | "info" | "success" | "danger"> = {
  to_do: "default",
  in_progress: "warning",
  in_review: "info",
  done: "success",
  blocked: "danger",
};

const issueCategoryIcon: Record<string, string> = {
  bug: "Bug",
  error: "Error",
  request: "Req",
  enhancement: "Enh",
};

const issueCategoryVariant: Record<string, "danger" | "orange" | "info" | "purple"> = {
  bug: "danger",
  error: "orange",
  request: "info",
  enhancement: "purple",
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<{
      myTasks: Array<Record<string, unknown>>;
      myIssues: Array<Record<string, unknown>>;
      projects: Array<Record<string, unknown>>;
    }>("/api/dashboard"),
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const myTasks = data?.myTasks || [];
  const myIssues = data?.myIssues || [];
  const projects = data?.projects || [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-neutral-400" />
              <h2 className="text-base font-semibold text-neutral-900">
                My Tasks
              </h2>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                {myTasks.length}
              </span>
            </div>
            <Link
              href="/tasks"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <div className="py-8 text-center">
              <ClipboardCheck className="mx-auto mb-2 h-10 w-10 text-neutral-200" />
              <p className="text-sm text-neutral-500">No tasks assigned</p>
              <Link
                href="/tasks"
                className="mt-2 inline-block text-xs text-primary-600 hover:text-primary-700"
              >
                Browse tasks
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myTasks.map((task: Record<string, unknown>) => {
                const t = task as Record<string, unknown>;
                const taskObj = (t.tasks || t) as Record<string, unknown>;
                const userObj = (t.users || t.assignee) as Record<string, unknown> | null;
                const projObj = (t.projects || t.project) as Record<string, unknown> | null;
                return (
                  <div
                    key={String(taskObj.id)}
                    className="flex items-center gap-3 rounded-md border border-neutral-100 p-3"
                  >
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        taskObj.priority === "critical"
                          ? "bg-danger-500"
                          : taskObj.priority === "high"
                          ? "bg-orange-500"
                          : taskObj.priority === "medium"
                          ? "bg-warning-500"
                          : "bg-neutral-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {String(taskObj.title)}
                      </p>
                      {projObj && (
                        <p className="truncate text-xs text-neutral-400">
                          {String(projObj.name)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {taskObj.dueDate != null && (
                        <p
                          className={`text-xs ${
                            isOverdue(String(taskObj.dueDate))
                              ? "font-medium text-danger-700"
                              : "text-neutral-500"
                          }`}
                        >
                          {formatDate(String(taskObj.dueDate))}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-neutral-400" />
              <h2 className="text-base font-semibold text-neutral-900">
                My Open Issues
              </h2>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                {myIssues.length}
              </span>
            </div>
            <Link
              href="/issues"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          {myIssues.length === 0 ? (
            <div className="py-8 text-center">
              <Bug className="mx-auto mb-2 h-10 w-10 text-neutral-200" />
              <p className="text-sm text-neutral-500">No issues assigned</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myIssues.map((issue: Record<string, unknown>) => {
                const i = issue as Record<string, unknown>;
                const issueObj = (i.issues || i) as Record<string, unknown>;
                return (
                  <div
                    key={String(issueObj.id)}
                    className="flex items-center gap-3 rounded-md border border-neutral-100 p-3"
                  >
                    <Badge variant={issueCategoryVariant[String(issueObj.category)] as "danger" | "orange" | "info" | "purple"} filled>
                      {issueCategoryIcon[String(issueObj.category)]}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {String(issueObj.title)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-neutral-400" />
            <h2 className="text-base font-semibold text-neutral-900">
              Projects
            </h2>
          </div>
          <Link
            href="/projects"
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            View all projects
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="rounded-lg border border-neutral-100 bg-white py-12 text-center shadow-sm">
            <FolderKanban className="mx-auto mb-2 h-10 w-10 text-neutral-200" />
            <p className="text-sm text-neutral-500">No active projects</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p: Record<string, unknown>) => {
              const project = p as Record<string, unknown>;
              const taskStats = project.taskStats as Record<string, number> | undefined;
              const total = taskStats?.total || 0;
              const done = taskStats?.done || 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const nextMilestone = project.nextMilestone as Record<string, unknown> | null;
              const owner = project.owner as Record<string, unknown> | null;

              return (
                <Link
                  key={String(project.id)}
                  href={`/projects/${project.id}`}
                  className="group rounded-lg border border-neutral-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600">
                      {String(project.name)}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-neutral-300 transition-colors group-hover:text-primary-500" />
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="info">{String(project.status)}</Badge>
                    {owner && (
                      <span className="text-xs text-neutral-500">
                        {String(owner.name)}
                      </span>
                    )}
                  </div>
                  <div className="mb-2">
                    <div className="mb-1 flex justify-between text-xs text-neutral-500">
                      <span>
                        {done}/{total} tasks
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  {nextMilestone && (
                    <p className="text-xs text-neutral-400">
                      Next: {String(nextMilestone.name)}
                      {nextMilestone.targetDate != null &&
                        ` - ${formatDate(String(nextMilestone.targetDate))}`}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
      <Skeleton className="mt-6 h-64 rounded-lg" />
    </div>
  );
}
