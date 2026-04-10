"use client";

import { useState, useEffect } from "react";
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
import { Plus, Search, X, Bug, AlertCircle, MessageSquare, Lightbulb } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const categoryIcon: Record<string, typeof Bug> = {
  bug: Bug,
  error: AlertCircle,
  request: MessageSquare,
  enhancement: Lightbulb,
};

const categoryVariant: Record<string, "danger" | "orange" | "info" | "purple"> = {
  bug: "danger",
  error: "orange",
  request: "info",
  enhancement: "purple",
};

const statusVariant: Record<string, "default" | "warning" | "success" | "info"> = {
  open: "default",
  in_progress: "warning",
  resolved: "success",
  closed: "info",
};

const priorityColor: Record<string, string> = {
  critical: "bg-danger-500",
  high: "bg-orange-500",
  medium: "bg-warning-500",
  low: "bg-neutral-400",
};

export default function IssuesPage() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId") || "";

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [projectId, setProjectId] = useState(projectIdParam);
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    description: "",
    projectId: projectIdParam,
    category: "bug" as string,
    priority: "medium" as string,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["issues", search, categoryFilter, statusFilter, priorityFilter, projectId, page],
    queryFn: () =>
      api.get<{
        items: Array<Record<string, unknown>>;
        total: number;
      }>(
        `/api/issues?search=${encodeURIComponent(search)}&category=${categoryFilter}&status=${statusFilter}&priority=${priorityFilter}&projectId=${projectId}&page=${page}&limit=50`
      ),
  });

  const selectedIssueQuery = useQuery({
    queryKey: ["issue", selectedIssueId],
    queryFn: () => api.get<Record<string, unknown>>(`/api/issues/${selectedIssueId}`),
    enabled: !!selectedIssueId,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: () => api.get<{ items: Array<Record<string, unknown>> }>("/api/projects?status=all&limit=100"),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => api.post("/api/issues", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      setShowCreateModal(false);
      resetForm();
      addToast({ title: "Issue logged" });
    },
    onError: (err) => addToast({ title: "Error", description: err.message, variant: "danger" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/api/issues/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue"] });
      addToast({ title: "Issue updated" });
    },
    onError: (err) => addToast({ title: "Error", description: err.message, variant: "danger" }),
  });

  const resetForm = () =>
    setForm({
      title: "",
      description: "",
      projectId: projectIdParam,
      category: "bug",
      priority: "medium",
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const issues = data?.items || [];
  const projects = projectsData?.items || [];
  const selectedIssue = selectedIssueQuery.data as Record<string, unknown> | undefined;

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Issues</h1>
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            <Plus className="h-4 w-4" />
            Log Issue
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1" style={{ maxWidth: 280 }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search issues..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter || "all"} onValueChange={(v) => { setCategoryFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="request">Request</SelectItem>
              <SelectItem value="enhancement">Enhancement</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter || "all"} onValueChange={(v) => { setPriorityFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          {projectIdParam && (
            <Button variant="ghost" size="sm" onClick={() => setProjectId("")}>Clear project</Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
          </div>
        ) : issues.length === 0 ? (
          <div className="rounded-lg border border-neutral-100 bg-white py-12 text-center shadow-sm">
            <Bug className="mx-auto mb-2 h-10 w-10 text-neutral-200" />
            <p className="text-sm text-neutral-500">No issues found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-100 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Title</th>
                  <th className="w-24 px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Status</th>
                  <th className="w-24 px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Priority</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {issues.map((i: Record<string, unknown>) => {
                  const issue = (i.issues || i) as Record<string, unknown>;
                  const user = (i.users || i.assignee) as Record<string, unknown> | null;
                  const CatIcon = categoryIcon[String(issue.category)] || Bug;
                  return (
                    <tr
                      key={String(issue.id)}
                      className="cursor-pointer border-b border-neutral-50 hover:bg-neutral-50"
                      onClick={() => setSelectedIssueId(String(issue.id))}
                    >
                      <td className="px-4 py-3">
                        <Badge variant={categoryVariant[String(issue.category)] as "danger" | "orange" | "info" | "purple"}>
                          {String(issue.category)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-neutral-900">
                        {String(issue.title)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[String(issue.status)] || "default"}>
                          {String(issue.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${priorityColor[String(issue.priority)] || "bg-neutral-400"}`} />
                          <span className="text-xs text-neutral-700 capitalize">{String(issue.priority)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user && <Avatar size="sm"><AvatarFallback name={String(user.name)} /></Avatar>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedIssue && (
        <div className="w-96 shrink-0 rounded-lg border border-neutral-100 bg-white shadow-lg">
          <div className="flex items-start justify-between border-b border-neutral-100 p-4">
            <div className="flex items-center gap-2">
              <Badge variant={categoryVariant[String(selectedIssue.category)] as "danger" | "orange" | "info" | "purple"} filled>
                {String(selectedIssue.category)}
              </Badge>
              <Badge variant={statusVariant[String(selectedIssue.status)] || "default"}>
                {String(selectedIssue.status)}
              </Badge>
            </div>
            <button onClick={() => setSelectedIssueId(null)} className="text-neutral-400 hover:text-neutral-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              {String(selectedIssue.title)}
            </h2>
            <div className="space-y-2 text-sm">
              {selectedIssue.project && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Project</span>
                  <Link href={`/projects/${(selectedIssue.project as Record<string, unknown>).id}`} className="font-medium text-primary-600">
                    {String((selectedIssue.project as Record<string, unknown>).name)}
                  </Link>
                </div>
              )}
              {selectedIssue.reporter && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Reporter</span>
                  <span className="text-neutral-900">{String((selectedIssue.reporter as Record<string, unknown>).name)}</span>
                </div>
              )}
              {selectedIssue.assignee && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Assignee</span>
                  <span className="text-neutral-900">{String((selectedIssue.assignee as Record<string, unknown>).name)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">Created</span>
                <span className="text-neutral-900">{formatDate(String(selectedIssue.createdAt))}</span>
              </div>
            </div>
            {selectedIssue.description && (
              <div className="mt-4 border-t border-neutral-100 pt-4">
                <p className="text-sm text-neutral-700">{String(selectedIssue.description)}</p>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              {selectedIssue.status === "open" && (
                <Button size="sm" onClick={() => updateMutation.mutate({ id: String(selectedIssue.id), body: { status: "in_progress" } })}>
                  Start Working
                </Button>
              )}
              {selectedIssue.status === "in_progress" && (
                <Button size="sm" onClick={() => updateMutation.mutate({ id: String(selectedIssue.id), body: { status: "resolved" } })}>
                  Resolve
                </Button>
              )}
              {selectedIssue.status === "resolved" && (
                <Button size="sm" variant="secondary" onClick={() => updateMutation.mutate({ id: String(selectedIssue.id), body: { status: "closed" } })}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Issue</DialogTitle>
            <DialogDescription>Report a bug, error, request, or enhancement.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={String(p.id)} value={String(p.id)}>{String(p.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="request">Request</SelectItem>
                    <SelectItem value="enhancement">Enhancement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Logging..." : "Log Issue"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
