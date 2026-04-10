"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects-all"],
    queryFn: () => api.get<{ items: Array<Record<string, unknown>> }>("/api/projects?status=all&limit=100"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  const projects = projectsData?.items || [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-neutral-400" />
        <h1 className="text-2xl font-bold text-neutral-900">Reports</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-neutral-900">Projects Overview</h3>
          {projects.length === 0 ? (
            <p className="text-sm text-neutral-500">No projects yet.</p>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div key={String(p.id)} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700">{String(p.name)}</span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 capitalize">
                    {String(p.status).replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-neutral-900">Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Total Projects</span>
              <span className="text-lg font-semibold text-neutral-900">{projects.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Active</span>
              <span className="text-lg font-semibold text-success-700">
                {projects.filter((p) => p.status === "active").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Completed</span>
              <span className="text-lg font-semibold text-primary-600">
                {projects.filter((p) => p.status === "completed").length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
