"use client";

import { useState, useEffect } from "react";
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
}

export default function PasswordDialog({ boxId }: PasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // Reset submitting state when component mounts or when there's an error
  useEffect(() => {
    setIsSubmitting(false);
  }, [errorMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Call the api route to authenticate the box
      const response = await fetch(`/api/box-auth`, {
        method: "POST",
        body: JSON.stringify({ boxId: boxId, password: password }),
      });
      if (response.ok) {
        router.replace(`/${boxId}`);
        return;
      }
      const data = await response.json();
      setErrorMessage(
        data?.error || "Authentication failed. Please try again."
      );
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
          {errorMessage && (
            <div className=" text-sm p-2 border border-maroon rounded bg-maroon/10 text-maroon">
              {errorMessage}
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
              onClick={() => router.back()}
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
