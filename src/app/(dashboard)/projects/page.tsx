"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Plus, Search, FolderKanban, ArrowRight } from "lucide-react";
import Link from "next/link";

const statusTabs = [
  { key: "active", label: "Active" },
  { key: "on_hold", label: "On Hold" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
];

const statusVariant: Record<string, "info" | "warning" | "success" | "default"> = {
  active: "info",
  on_hold: "warning",
  completed: "success",
  archived: "default",
};

const statusLabel: Record<string, string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  archived: "Archived",
};

export default function ProjectsPage() {
  const [statusTab, setStatusTab] = useState("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active" as string,
    startDate: "",
    targetDate: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["projects", statusTab, search, page],
    queryFn: () =>
      api.get<{
        items: Array<Record<string, unknown>>;
        total: number;
        page: number;
        limit: number;
      }>(
        `/api/projects?status=${statusTab}&search=${encodeURIComponent(search)}&page=${page}&limit=9`
      ),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => api.post("/api/projects", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowModal(false);
      setForm({ name: "", description: "", status: "active", startDate: "", targetDate: "" });
      addToast({ title: "Project created" });
    },
    onError: (err) => addToast({ title: "Error creating project", description: err.message, variant: "danger" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const projects = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Projects</h1>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatusTab(tab.key); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusTab === tab.key
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto" style={{ maxWidth: 240 }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-lg" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-neutral-100 bg-white py-12 text-center shadow-sm">
          <FolderKanban className="mx-auto mb-2 h-10 w-10 text-neutral-200" />
          <p className="text-sm text-neutral-500">No projects found</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => {
              const project = p as Record<string, unknown>;
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
                  <Badge variant={statusVariant[String(project.status)] || "default"}>
                    {statusLabel[String(project.status)] || String(project.status)}
                  </Badge>
                  {project.targetDate && (
                    <p className="mt-2 text-xs text-neutral-400">
                      Target: {formatDate(String(project.targetDate))}
                    </p>
                  )}
                  {project.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-neutral-500">
                      {String(project.description)}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>Create a new project.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date</Label>
                <Input id="targetDate" type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
