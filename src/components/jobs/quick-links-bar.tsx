"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, X, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuickLink {
  _id: string;
  url: string;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return "";
  }
}

export function QuickLinksBar() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [adding, setAdding] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/quick-links")
      .then((r) => r.json())
      .then(setLinks)
      .catch(() => toast.error("Failed to load quick links"));
  }, []);

  useEffect(() => {
    if (adding) {
      inputRef.current?.focus();
    }
  }, [adding]);

  const handleAdd = async () => {
    const url = inputUrl.trim();
    if (!url) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL (including https://)");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/quick-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const created: QuickLink = await res.json();
      setLinks((prev) => [...prev, created]);
      setInputUrl("");
      setAdding(false);
      toast.success("Link added");
    } catch {
      toast.error("Failed to add link");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic removal
    setLinks((prev) => prev.filter((l) => l._id !== id));
    try {
      const res = await fetch(`/api/quick-links/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    } catch {
      // Refetch to restore state on failure
      fetch("/api/quick-links")
        .then((r) => r.json())
        .then(setLinks);
      toast.error("Failed to remove link");
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
      <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />

      <div className="flex flex-1 items-center gap-2 overflow-x-auto">
        {links.map((link) => (
          <div
            key={link._id}
            className="relative shrink-0"
            onMouseEnter={() => setHoveredId(link._id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs hover:bg-accent transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFaviconUrl(link.url)}
                alt=""
                width={14}
                height={14}
                className="h-3.5 w-3.5 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="max-w-[120px] truncate">
                {getDomain(link.url)}
              </span>
            </a>

            {hoveredId === link._id && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(link._id);
                }}
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:opacity-80"
                aria-label="Remove link"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        ))}

        {adding && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}
            className="flex items-center gap-1.5 shrink-0"
          >
            <Input
              ref={inputRef}
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-7 w-48 text-xs"
              disabled={saving}
            />
            <Button
              type="submit"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={saving}
            >
              {saving ? "…" : "Add"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setAdding(false);
                setInputUrl("");
              }}
            >
              Cancel
            </Button>
          </form>
        )}
      </div>

      {!adding && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1 px-2 text-xs"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add link
        </Button>
      )}
    </div>
  );
}
