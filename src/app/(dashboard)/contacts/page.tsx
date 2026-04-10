"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  team: string | null;
  createdAt: string;
}

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    team: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["contacts", search, roleFilter, teamFilter, page],
    queryFn: () =>
      api.get<{
        items: Contact[];
        total: number;
        page: number;
        limit: number;
      }>(
        `/api/contacts?search=${encodeURIComponent(search)}&role=${encodeURIComponent(roleFilter)}&team=${encodeURIComponent(teamFilter)}&page=${page}&limit=10`
      ),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => api.post<Contact>("/api/contacts", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setShowModal(false);
      resetForm();
      addToast({ title: "Contact created" });
    },
    onError: (err) => addToast({ title: "Error creating contact", description: err.message, variant: "danger" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<typeof form> }) =>
      api.patch<Contact>(`/api/contacts/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setShowModal(false);
      setEditingContact(null);
      resetForm();
      addToast({ title: "Contact updated" });
    },
    onError: (err) => addToast({ title: "Error updating contact", description: err.message, variant: "danger" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setShowDeleteConfirm(null);
      setShowMenu(null);
      addToast({ title: "Contact deleted" });
    },
    onError: (err) => addToast({ title: "Error deleting contact", description: err.message, variant: "danger" }),
  });

  const resetForm = () =>
    setForm({ firstName: "", lastName: "", email: "", phone: "", role: "", team: "" });

  const openCreate = () => {
    resetForm();
    setEditingContact(null);
    setShowModal(true);
  };

  const openEdit = (contact: Contact) => {
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || "",
      phone: contact.phone || "",
      role: contact.role || "",
      team: contact.team || "",
    });
    setEditingContact(contact);
    setShowModal(true);
    setShowMenu(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, body: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("");
    setTeamFilter("");
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;
  const contacts = data?.items || [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Contacts</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1" style={{ maxWidth: 300 }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
            <SelectItem value="Developer">Developer</SelectItem>
            <SelectItem value="Designer">Designer</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
          </SelectContent>
        </Select>
        <Select value={teamFilter} onValueChange={(v) => { setTeamFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            <SelectItem value="Product">Product</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
          </SelectContent>
        </Select>
        {(search || roleFilter || teamFilter) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-lg border border-neutral-100 bg-white py-12 text-center shadow-sm">
          <p className="text-sm text-neutral-500">No contacts found</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-neutral-100 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Team</th>
                  <th className="w-16 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback name={`${contact.firstName} ${contact.lastName}`} />
                        </Avatar>
                        <span className="text-sm font-medium text-neutral-900">
                          {contact.firstName} {contact.lastName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500">
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="hover:text-primary-600">
                          {contact.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{contact.role || "—"}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{contact.team || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === contact.id ? null : contact.id)}
                          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {showMenu === contact.id && (
                          <div className="absolute right-0 top-8 z-10 w-36 rounded-lg border border-neutral-100 bg-white py-1 shadow-lg">
                            <button
                              onClick={() => openEdit(contact)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <Link
                              href={`/contacts/${contact.id}`}
                              onClick={() => setShowMenu(null)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </Link>
                            <button
                              onClick={() => { setShowDeleteConfirm(contact.id); setShowMenu(null); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-700 hover:bg-danger-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
            <span>
              Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, data?.total || 0)} of{" "}
              {data?.total || 0}
            </span>
            <div className="flex gap-1">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Prev
              </Button>
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
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) { setEditingContact(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
            <DialogDescription>
              {editingContact ? "Update contact information." : "Add a new contact to the system."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Input id="team" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingContact(null); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingContact
                  ? "Save Changes"
                  : "Save Contact"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => showDeleteConfirm && deleteMutation.mutate(showDeleteConfirm)}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
