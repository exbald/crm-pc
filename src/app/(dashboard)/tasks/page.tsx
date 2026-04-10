"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatDate, isOverdue } from "@/lib/utils";
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
import { Plus, Search, LayoutList, Columns3, X, ClipboardCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const statusVariant: Record<string, "default" | "warning" | "info" | "success" | "danger"> = {
  to_do: "default",
  in_progress: "warning",
  in_review: "info",
  done: "success",
  blocked: "danger",
};

const statusLabel: Record<string, string> = {
  to_do: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

const priorityColor: Record<string, string> = {
  critical: "bg-danger-500",
  high: "bg-orange-500",
  medium: "bg-warning-500",
  low: "bg-neutral-400",
};

const columnBg: Record<string, string> = {
  to_do: "bg-neutral-50/50",
  in_progress: "bg-warning-50/30",
  in_review: "bg-info-50/30",
  done: "bg-success-50/30",
  blocked: "bg-danger-50/30",
};

export default function TasksPage() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId") || "";
  const taskIdParam = searchParams.get("id") || "";

  const [view, setView] = useState<"list" | "board">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [projectId, setProjectId] = useState(projectIdParam);
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(taskIdParam);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    description: "",
    projectId: projectIdParam,
    milestoneId: "",
    priority: "medium" as string,
    status: "to_do" as string,
    assigneeId: "",
    dueDate: "",
  });

  const listQuery = useQuery({
    queryKey: ["tasks-list", search, statusFilter, priorityFilter, assigneeFilter, projectId, page],
    queryFn: () =>
      api.get<{
        items: Array<Record<string, unknown>>;
        total: number;
      }>(
        `/api/tasks?search=${encodeURIComponent(search)}&status=${statusFilter}&priority=${priorityFilter}&assigneeId=${assigneeFilter}&projectId=${projectId}&page=${page}&limit=50`
      ),
    enabled: view === "list",
  });

  const boardQuery = useQuery({
    queryKey: ["tasks-board", search, statusFilter, priorityFilter, assigneeFilter, projectId],
    queryFn: () =>
      api.get<Record<string, Array<Record<string, unknown>>>>(
        `/api/tasks?search=${encodeURIComponent(search)}&status=${statusFilter}&priority=${priorityFilter}&assigneeId=${assigneeFilter}&projectId=${projectId}&view=board`
      ),
    enabled: view === "board",
  });

  const selectedTaskQuery = useQuery({
    queryKey: ["task", selectedTaskId],
    queryFn: () => api.get<Record<string, unknown>>(`/api/tasks/${selectedTaskId}`),
    enabled: !!selectedTaskId,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: () => api.get<{ items: Array<Record<string, unknown>> }>("/api/projects?status=all&limit=100"),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => api.post("/api/tasks", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowCreateModal(false);
      resetForm();
      addToast({ title: "Task created" });
    },
    onError: (err) => addToast({ title: "Error", description: err.message, variant: "danger" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/api/tasks/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task"] });
      addToast({ title: "Task updated" });
    },
    onError: (err) => addToast({ title: "Error", description: err.message, variant: "danger" }),
  });

  const statusChangeMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/tasks/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const resetForm = () =>
    setForm({
      title: "",
      description: "",
      projectId: projectIdParam,
      milestoneId: "",
      priority: "medium",
      status: "to_do",
      assigneeId: "",
      dueDate: "",
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const tasks = listQuery.data?.items || [];
  const columns = boardQuery.data || {};
  const projects = projectsData?.items || [];
  const selectedTask = selectedTaskQuery.data as Record<string, unknown> | undefined;

  useEffect(() => {
    if (taskIdParam) setSelectedTaskId(taskIdParam);
  }, [taskIdParam]);

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Tasks</h1>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-neutral-200">
              <button
                onClick={() => setView("list")}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
                  view === "list" ? "bg-neutral-100 text-neutral-900" : "text-neutral-500"
                }`}
              >
                <LayoutList className="h-4 w-4" />
                List
              </button>
              <button
                onClick={() => setView("board")}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
                  view === "board" ? "bg-neutral-100 text-neutral-900" : "text-neutral-500"
                }`}
              >
                <Columns3 className="h-4 w-4" />
                Board
              </button>
            </div>
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1" style={{ maxWidth: 280 }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="to_do">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter || "all"} onValueChange={(v) => { setPriorityFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assigneeFilter || "all"} onValueChange={(v) => { setAssigneeFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Assignee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="me">Assigned to me</SelectItem>
            </SelectContent>
          </Select>
          {projectIdParam && (
            <Button variant="ghost" size="sm" onClick={() => setProjectId("")}>Clear project</Button>
          )}
        </div>

        {view === "list" ? (
          <>
            {listQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-lg border border-neutral-100 bg-white py-12 text-center shadow-sm">
                <ClipboardCheck className="mx-auto mb-2 h-10 w-10 text-neutral-200" />
                <p className="text-sm text-neutral-500">No tasks found</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-neutral-100 bg-white shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      <th className="w-8 px-3 py-3" />
                      <th className="px-3 py-3 text-left text-xs font-medium uppercase text-neutral-500">Title</th>
                      <th className="w-24 px-3 py-3 text-left text-xs font-medium uppercase text-neutral-500">Status</th>
                      <th className="w-24 px-3 py-3 text-left text-xs font-medium uppercase text-neutral-500">Due</th>
                      <th className="w-10 px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t: Record<string, unknown>) => {
                      const task = (t.tasks || t) as Record<string, unknown>;
                      const user = (t.users || t.assignee) as Record<string, unknown> | null;
                      const proj = (t.projects || t.project) as Record<string, unknown> | null;
                      return (
                        <tr
                          key={String(task.id)}
                          className="cursor-pointer border-b border-neutral-50 hover:bg-neutral-50"
                          onClick={() => setSelectedTaskId(String(task.id))}
                        >
                          <td className="px-3 py-3">
                            <div className={`h-2 w-2 rounded-full ${priorityColor[String(task.priority)] || "bg-neutral-400"}`} />
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-sm font-medium text-neutral-900">{String(task.title)}</p>
                            {proj && <p className="text-xs text-neutral-400">{String(proj.name)}</p>}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant={statusVariant[String(task.status)] || "default"}>
                              {statusLabel[String(task.status)] || String(task.status)}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            {task.dueDate ? (
                              <span className={`text-xs ${isOverdue(String(task.dueDate)) && task.status !== "done" ? "font-medium text-danger-700" : "text-neutral-500"}`}>
                                {formatDate(String(task.dueDate))}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {user && <Avatar size="sm"><AvatarFallback name={String(user.name)} /></Avatar>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            {boardQuery.isLoading ? (
              <div className="grid grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-lg" />)}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {["to_do", "in_progress", "in_review", "done", "blocked"].map((status) => {
                  const colTasks = (columns[status] || []) as Array<Record<string, unknown>>;
                  return (
                    <div key={status} className={`w-72 shrink-0 rounded-lg p-3 ${columnBg[status]}`}>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-neutral-900">
                          {statusLabel[status]}
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-neutral-500 shadow-sm">
                          {colTasks.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {colTasks.map((t: Record<string, unknown>) => {
                          const task = (t.tasks || t) as Record<string, unknown>;
                          const user = (t.users || t.assignee) as Record<string, unknown> | null;
                          const proj = (t.projects || t.project) as Record<string, unknown> | null;
                          return (
                            <div
                              key={String(task.id)}
                              onClick={() => setSelectedTaskId(String(task.id))}
                              className="cursor-pointer rounded-md border border-neutral-100 bg-white p-3 shadow-sm hover:shadow-md"
                            >
                              <div className="mb-1 flex items-start gap-2">
                                <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityColor[String(task.priority)] || "bg-neutral-400"}`} />
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 text-sm font-medium text-neutral-900">
                                    {String(task.title)}
                                  </p>
                                </div>
                              </div>
                              {proj && (
                                <p className="mt-1 truncate text-xs text-neutral-400">{String(proj.name)}</p>
                              )}
                              <div className="mt-2 flex items-center justify-between">
                                {task.dueDate && (
                                  <span className={`text-xs ${isOverdue(String(task.dueDate)) && task.status !== "done" ? "font-medium text-danger-700" : "text-neutral-500"}`}>
                                    {formatDate(String(task.dueDate))}
                                  </span>
                                )}
                                {user && <Avatar size="sm"><AvatarFallback name={String(user.name)} /></Avatar>}
                              </div>
                            </div>
                          );
                        })}
                        {colTasks.length === 0 && (
                          <div className="rounded-md border border-dashed border-neutral-200 py-8 text-center">
                            <p className="text-xs text-neutral-400">Drop tasks here</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {selectedTask && (
        <div className="w-96 shrink-0 rounded-lg border border-neutral-100 bg-white shadow-lg">
          <div className="flex items-start justify-between border-b border-neutral-100 p-4">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${priorityColor[String(selectedTask.priority)] || "bg-neutral-400"}`} />
              <Badge variant={statusVariant[String(selectedTask.status)] || "default"}>
                {statusLabel[String(selectedTask.status)] || String(selectedTask.status)}
              </Badge>
            </div>
            <button onClick={() => setSelectedTaskId(null)} className="text-neutral-400 hover:text-neutral-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              {String(selectedTask.title)}
            </h2>
            <div className="space-y-2 text-sm">
              {selectedTask.project && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Project</span>
                  <Link href={`/projects/${(selectedTask.project as Record<string, unknown>).id}`} className="font-medium text-primary-600">
                    {String((selectedTask.project as Record<string, unknown>).name)}
                  </Link>
                </div>
              )}
              {selectedTask.dueDate && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Due Date</span>
                  <span className={isOverdue(String(selectedTask.dueDate)) && selectedTask.status !== "done" ? "font-medium text-danger-700" : "text-neutral-900"}>
                    {formatDate(String(selectedTask.dueDate))}
                  </span>
                </div>
              )}
              {selectedTask.assignee && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Assignee</span>
                  <div className="flex items-center gap-1">
                    <Avatar size="sm"><AvatarFallback name={String((selectedTask.assignee as Record<string, unknown>).name)} /></Avatar>
                    <span className="text-neutral-900">{String((selectedTask.assignee as Record<string, unknown>).name)}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">Created</span>
                <span className="text-neutral-900">{formatDate(String(selectedTask.createdAt))}</span>
              </div>
            </div>
            {selectedTask.description && (
              <div className="mt-4 border-t border-neutral-100 pt-4">
                <p className="text-sm text-neutral-700">{String(selectedTask.description)}</p>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              {selectedTask.status !== "done" && (
                <Button size="sm" onClick={() => statusChangeMutation.mutate({ id: String(selectedTask.id), status: "done" })}>
                  Mark Done
                </Button>
              )}
              {selectedTask.status === "done" && (
                <Button size="sm" variant="secondary" onClick={() => statusChangeMutation.mutate({ id: String(selectedTask.id), status: "to_do" })}>
                  Reopen
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>Create a new task.</DialogDescription>
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
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
