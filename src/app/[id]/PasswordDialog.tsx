"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PasswordDialogProps {
  boxId: string;
  error?: string;
}

export default function PasswordDialog({ boxId, error }: PasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsSubmitting(true);

    // Redirect to the same page with password parameter
    router.push(`/${boxId}?pass=${encodeURIComponent(password)}`);
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Password Protected Box</AlertDialogTitle>
          <AlertDialogDescription>
            This box is password protected. Please enter the password to access
            its content.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm p-2 border border-red-300 rounded bg-red-50">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <AlertDialogAction
              type="submit"
              disabled={!password.trim() || isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Access Box"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
