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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft, Plus, Pencil, Archive, Users, Flag, Target } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "",
    targetDate: "",
  });

  const [milestoneForm, setMilestoneForm] = useState({
    name: "",
    targetDate: "",
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get<Record<string, unknown>>(`/api/projects/${id}`),
    enabled: !!id,
  });

  const { data: tasksData } = useQuery({
    queryKey: ["project-tasks", id],
    queryFn: () =>
      api.get<{ items: Array<Record<string, unknown>> }>(`/api/tasks?projectId=${id}&limit=100`),
    enabled: !!id && activeTab === "tasks",
  });

  const { data: issuesData } = useQuery({
    queryKey: ["project-issues", id],
    queryFn: () =>
      api.get<{ items: Array<Record<string, unknown>> }>(`/api/issues?projectId=${id}&limit=100`),
    enabled: !!id && activeTab === "issues",
  });

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/api/projects/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      setShowEditModal(false);
      addToast({ title: "Project updated" });
    },
    onError: (err) => addToast({ title: "Error", description: err.message, variant: "danger" }),
  });

  const createMilestoneMutation = useMutation({
    mutationFn: (body: { name: string; projectId: string; targetDate?: string }) =>
      api.post("/api/milestones", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      setShowMilestoneForm(false);
      setMilestoneForm({ name: "", targetDate: "" });
      addToast({ title: "Milestone created" });
    },
    onError: (err) => addToast({ title: "Error", description: err.message, variant: "danger" }),
  });

  const archiveMutation = useMutation({
    mutationFn: () => api.patch(`/api/projects/${id}`, { status: "archived" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      addToast({ title: "Project archived" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-60 rounded-lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-500">Project not found.</p>
        <Link href="/projects" className="mt-2 inline-block text-sm text-primary-600">
          Back to projects
        </Link>
      </div>
    );
  }

  const owner = project.owner as Record<string, unknown> | null;
  const milestones = (project.milestones || []) as Array<Record<string, unknown>>;
  const taskStats = project.taskStats as Record<string, number>;
  const tasks = tasksData?.items || [];
  const issues = issuesData?.items || [];

  const openEdit = () => {
    setEditForm({
      name: String(project.name),
      description: String(project.description || ""),
      status: String(project.status),
      targetDate: project.targetDate ? String(project.targetDate) : "",
    });
    setShowEditModal(true);
  };

  return (
    <div>
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-neutral-900">{String(project.name)}</h1>
            <Badge variant={statusVariant[String(project.status)] || "default"}>
              {statusLabel[String(project.status)] || String(project.status)}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-neutral-500">
            {owner && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {String(owner.name)}
              </span>
            )}
            {project.targetDate != null && (
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                Target: {formatDate(String(project.targetDate))}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={openEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          {project.status !== "archived" && (
            <Button variant="ghost" size="sm" onClick={() => archiveMutation.mutate()}>
              <Archive className="h-3.5 w-3.5" />
              Archive
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({taskStats?.total || 0})</TabsTrigger>
          <TabsTrigger value="milestones">Milestones ({milestones.length})</TabsTrigger>
          <TabsTrigger value="issues">Issues ({issues.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Description</h3>
              <p className="text-sm text-neutral-700">
                {project.description ? String(project.description) : "No description provided."}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Task Stats</h3>
              <div className="space-y-2">
                {[
                  { label: "To Do", count: taskStats?.toDo || 0, color: "bg-neutral-400" },
                  { label: "In Progress", count: taskStats?.inProgress || 0, color: "bg-warning-500" },
                  { label: "In Review", count: taskStats?.inReview || 0, color: "bg-info-500" },
                  { label: "Done", count: taskStats?.done || 0, color: "bg-success-500" },
                  { label: "Blocked", count: taskStats?.blocked || 0, color: "bg-danger-500" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-sm">
                    <div className={`h-2 w-2 rounded-full ${s.color}`} />
                    <span className="text-neutral-700">{s.label}</span>
                    <span className="ml-auto font-medium text-neutral-900">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {milestones.length > 0 && (
            <div className="mt-6 rounded-lg border border-neutral-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Milestones</h3>
              <div className="space-y-3">
                {milestones.map((m) => (
                  <div key={String(m.id)} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Flag className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="text-sm font-medium text-neutral-900">{String(m.name)}</span>
                      </div>
                      {m.targetDate != null && (
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {formatDate(String(m.targetDate))}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32">
                        <div className="mb-0.5 flex justify-between text-xs text-neutral-500">
                          <span>{String(m.doneTaskCount)}/{String(m.taskCount)}</span>
                          <span>{String(m.progress)}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-primary-500"
                            style={{ width: `${m.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          <div className="mt-4">
            <Link href={`/tasks?projectId=${id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </Link>
            {tasks.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">No tasks in this project.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {tasks.map((t: Record<string, unknown>) => {
                  const task = (t.tasks || t) as Record<string, unknown>;
                  const user = (t.users || t.assignee) as Record<string, unknown> | null;
                  return (
                    <Link
                      key={String(task.id)}
                      href={`/tasks?id=${task.id}`}
                      className="flex items-center gap-3 rounded-md border border-neutral-100 p-3 hover:bg-neutral-50"
                    >
                      <div
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          task.priority === "critical" ? "bg-danger-500" :
                          task.priority === "high" ? "bg-orange-500" :
                          task.priority === "medium" ? "bg-warning-500" : "bg-neutral-400"
                        }`}
                      />
                      <span className="flex-1 text-sm font-medium text-neutral-900">{String(task.title)}</span>
                      <Badge variant={task.status === "done" ? "success" : task.status === "blocked" ? "danger" : task.status === "in_progress" ? "warning" : task.status === "in_review" ? "info" : "default"}>
                        {String(task.status)}
                      </Badge>
                      {user && <Avatar size="sm"><AvatarFallback name={String(user.name)} /></Avatar>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="milestones">
          <div className="mt-4">
            <Button size="sm" onClick={() => setShowMilestoneForm(true)}>
              <Plus className="h-4 w-4" />
              Add Milestone
            </Button>
            {milestones.length === 0 && !showMilestoneForm ? (
              <p className="mt-4 text-sm text-neutral-500">No milestones defined.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {milestones.map((m) => (
                  <div key={String(m.id)} className="flex items-center gap-4 rounded-md border border-neutral-100 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Flag className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="text-sm font-medium text-neutral-900">{String(m.name)}</span>
                        <Badge variant={m.status === "completed" ? "success" : m.status === "in_progress" ? "warning" : "default"}>
                          {String(m.status)}
                        </Badge>
                      </div>
                      {m.targetDate != null && (
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {formatDate(String(m.targetDate))}
                        </p>
                      )}
                    </div>
                    <div className="w-40">
                      <div className="mb-0.5 flex justify-between text-xs text-neutral-500">
                        <span>{String(m.doneTaskCount)}/{String(m.taskCount)} tasks</span>
                        <span>{String(m.progress)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{ width: `${m.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showMilestoneForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMilestoneMutation.mutate({
                    name: milestoneForm.name,
                    projectId: id,
                    targetDate: milestoneForm.targetDate || undefined,
                  });
                }}
                className="mt-4 flex items-end gap-3 rounded-md border border-primary-200 bg-primary-50 p-4"
              >
                <div className="flex-1 space-y-1">
                  <Label>Milestone Name *</Label>
                  <Input
                    value={milestoneForm.name}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                    placeholder="Milestone name"
                    required
                  />
                </div>
                <div className="w-40 space-y-1">
                  <Label>Target Date</Label>
                  <Input
                    type="date"
                    value={milestoneForm.targetDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, targetDate: e.target.value })}
                  />
                </div>
                <Button type="submit" size="sm" disabled={createMilestoneMutation.isPending}>
                  {createMilestoneMutation.isPending ? "Creating..." : "Add"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowMilestoneForm(false)}>
                  Cancel
                </Button>
              </form>
            )}
          </div>
        </TabsContent>

        <TabsContent value="issues">
          <div className="mt-4">
            <Link href={`/issues?projectId=${id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Log Issue
              </Button>
            </Link>
            {issues.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">No issues logged for this project.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {issues.map((i: Record<string, unknown>) => {
                  const issue = (i.issues || i) as Record<string, unknown>;
                  const catVariant = issue.category === "bug" ? "danger" : issue.category === "error" ? "orange" : issue.category === "request" ? "info" : "purple";
                  return (
                    <div key={String(issue.id)} className="flex items-center gap-3 rounded-md border border-neutral-100 p-3">
                      <Badge variant={catVariant as "danger" | "orange" | "info" | "purple"} filled>
                        {String(issue.category)}
                      </Badge>
                      <span className="flex-1 text-sm font-medium text-neutral-900">{String(issue.title)}</span>
                      <Badge variant={issue.status === "closed" ? "success" : issue.status === "in_progress" ? "warning" : issue.status === "resolved" ? "info" : "default"}>
                        {String(issue.status)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate(editForm);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Date</Label>
                <Input type="date" value={editForm.targetDate} onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
