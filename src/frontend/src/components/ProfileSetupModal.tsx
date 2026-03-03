import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

interface ProfileSetupModalProps {
  open: boolean;
}

export default function ProfileSetupModal({ open }: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveProfile({ name: name.trim() });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="panel-neon border-0 max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="neon-text font-mono text-lg flex items-center gap-2">
            <User size={18} />
            Setup Your Profile
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-mono text-sm">
            Welcome! Enter your name to get started with Schema Anomaly Solver
            Pro.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-mono text-sm">
              Display Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alice"
              className="bg-input border-border font-mono focus:border-neon-green focus:ring-neon-green/20"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || isPending}
            className="btn-neon w-full py-2 px-4 rounded flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
