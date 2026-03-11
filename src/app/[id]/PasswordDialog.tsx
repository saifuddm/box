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
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Label } from "@/components/ui/label";
import { Loader2Icon } from "lucide-react";

interface PasswordDialogProps {
  boxId: string;
  passwordProtected: boolean;
}

export default function PasswordDialog({
  boxId,
  passwordProtected,
}: PasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [rememberPassword, setRememberPassword] = useState<CheckedState>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // Reset submitting state when component mounts or when there's an error
  useEffect(() => {
    setIsSubmitting(false);
  }, [errorMessage]);

  useEffect(() => {
    if (!passwordProtected) {
      setIsSubmitting(true);
      handleSubmit();
    }
  }, [passwordProtected]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (passwordProtected && !password.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Call the api route to authenticate the box
      const response = await fetch(`/api/box-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          passwordProtected
            ? {
                boxId: boxId,
                password: password,
                rememberPassword: rememberPassword,
              }
            : { boxId: boxId, rememberPassword: rememberPassword },
        ),
      });
      if (response.ok) {
        router.replace(`/${boxId}`);
        return;
      }
      const data = await response.json();
      setErrorMessage(
        data?.error || "Authentication failed. Please try again.",
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
          <AlertDialogTitle>
            {passwordProtected ? "Password Protected Box" : "Public Box"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {passwordProtected
              ? "This box is password protected. Please enter the password to access its content."
              : "This box is public. Please be mindful of the content you share."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className=" text-sm p-2 border border-maroon rounded bg-maroon/10 text-maroon">
              {errorMessage}
            </div>
          )}

          {passwordProtected ? (
            <>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={isSubmitting}
                autoFocus
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberPassword}
                  onCheckedChange={setRememberPassword}
                />
                <Label htmlFor="remember">Remember password for 24 hours</Label>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  disabled={!password.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                  ) : (
                    "Access Box"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <AlertDialogFooter>
              <Loader2Icon className="w-8 h-8 animate-spin" />
            </AlertDialogFooter>
          )}
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
