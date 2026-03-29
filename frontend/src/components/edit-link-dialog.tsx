import { useEffect, useMemo, useState } from "react";
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
import { getApiErrorMessage, type UserLink, updateLinkRequest } from "@/lib/api";

type EditLinkDialogProps = {
  link: UserLink;
  trigger: React.ReactNode;
  onUpdated: (updatedLink: UserLink) => void;
};

export const EditLinkDialog = ({ link, trigger, onUpdated }: EditLinkDialogProps) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(link.url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setUrl(link.url);
    setError(null);
  }, [open, link.url]);

  const hasChanged = useMemo(() => url.trim() !== link.url, [url, link.url]);

  const handleSave = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await updateLinkRequest(link.slug, url);
      onUpdated(response.link);
      setOpen(false);
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit link URL</DialogTitle>
          <DialogDescription>Update destination URL for /{link.slug}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Input
            type="url"
            placeholder="https://example.com/new-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-none bg-transparent p-0 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting || !url.trim() || !hasChanged} onClick={handleSave}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
