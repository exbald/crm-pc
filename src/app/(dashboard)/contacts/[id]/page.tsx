"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ContactDetail extends Record<string, unknown> {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  team: string | null;
  createdAt: string;
}

export default function ContactDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: contact, isLoading } = useQuery({
    queryKey: ["contact", id],
    queryFn: () => api.get<ContactDetail>(`/api/contacts/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-500">Contact not found.</p>
        <Link href="/contacts" className="mt-2 inline-block text-sm text-primary-600">
          Back to contacts
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/contacts"
        className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Contacts
      </Link>

      <div className="rounded-lg border border-neutral-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar size="lg">
            <AvatarFallback name={`${contact.firstName} ${contact.lastName}`} />
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-neutral-900">
              {contact.firstName} {contact.lastName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
              {contact.role && <span>{contact.role}</span>}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="hover:text-primary-600">
                  {contact.email}
                </a>
              )}
              {contact.team && <span>Team: {contact.team}</span>}
            </div>
            {contact.phone && (
              <p className="mt-1 text-sm text-neutral-500">{contact.phone}</p>
            )}
          </div>
        </div>
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <p className="text-xs text-neutral-400">Added {formatDate(contact.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
