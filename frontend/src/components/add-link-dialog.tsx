import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createLinkRequest, getApiErrorMessage, type UserLink } from "@/lib/api";

type AddLinkDialogProps = {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (newLink: UserLink) => void;
};

export const AddLinkDialog = ({ trigger, open, onOpenChange, onCreated }: AddLinkDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<UserLink | null>(null);

  const isControlled = useMemo(() => typeof open === "boolean", [open]);
  const dialogOpen = isControlled ? open : internalOpen;

  const shortUrl = useMemo(() => {
    if (!createdLink) {
      return "";
    }

    return `${window.location.origin}/${createdLink.slug}`;
  }, [createdLink]);

  const resetState = () => {
    setInputUrl("");
    setCustomSlug("");
    setError(null);
    setIsSubmitting(false);
    setCreatedLink(null);
  };

  const setDialogOpen = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }

    if (isControlled) {
      onOpenChange?.(nextOpen);
      return;
    }
    setInternalOpen(nextOpen);
  };

  const handleCreate = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await createLinkRequest(inputUrl, customSlug);
      setCreatedLink(response.link);
      onCreated?.(response.link);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent>
        {!createdLink ? (
          <>
            <DialogHeader>
              <DialogTitle>Add a new link</DialogTitle>
              <DialogDescription>Paste your URL and create a short link instantly.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/some/long/path"
                  value={inputUrl}
                  onChange={(event) => setInputUrl(event.target.value)}
                  required
                />
                <Button
                  type="button"
                  onClick={handleCreate}
                  disabled={isSubmitting || !inputUrl.trim()}
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </Button>
              </div>
              <Input
                type="text"
                placeholder="Optional custom slug (e.g. my-link)"
                value={customSlug}
                onChange={(event) => setCustomSlug(event.target.value)}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Congrats, your link has been shortened</DialogTitle>
              <DialogDescription>Your new short URL is ready.</DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Short link</p>
              <a
                href={shortUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sm font-medium text-primary underline underline-offset-4"
              >
                {shortUrl}
              </a>
            </div>

            <DialogFooter className="mx-0 mb-0 rounded-none border-none bg-transparent p-0 sm:justify-end">
              <Button type="button" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
