"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteBoard } from "@/lib/actions";
import { toast } from "sonner";
import CreateBoardDialog from "./CreateBoardDialog";

type Board = { id: string; name: string };

export default function BoardSwitcher({
  boards,
  currentBoardId,
}: {
  boards: Board[];
  currentBoardId: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this board? All tasks will be lost.")) return;

    try {
      await deleteBoard(currentBoardId);
      toast.success("Board deleted");
      router.push("/");
    } catch (_error) {
      toast.error("Failed to delete board");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentBoardId} onValueChange={(val) => router.push(`/?boardId=${val}`)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a board" />
        </SelectTrigger>
        <SelectContent>
          {boards.map((board) => (
            <SelectItem key={board.id} value={board.id}>
              {board.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <CreateBoardDialog />

      <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
