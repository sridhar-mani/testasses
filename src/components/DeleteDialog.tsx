import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Bookmark } from "@/types/bookmark";

interface DeleteDialogProps {
  bookmark: Bookmark | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export default function DeleteDialog({
  bookmark,
  onClose,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <AlertDialog
      open={!!bookmark}
      onOpenChange={(open) => !open && onClose()}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Bookmark</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <strong>{bookmark?.title}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="hover:cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="hover:cursor-pointer"
            onClick={() => bookmark && onConfirm(bookmark.id)}
          >
            Delete Bookmark
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
