import { format } from "date-fns";
import { Session, getStatusConfig, getStatusBadgeClasses } from "@/types/sessions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";

interface SessionsTableProps {
  sessions: Session[];
  onAction: (session: Session) => void;
  onDelete: (session: Session) => void;
}

export const SessionsTable = ({
  sessions,
  onAction,
  onDelete,
}: SessionsTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => {
            const config = getStatusConfig(session.status);
            return (
              <TableRow key={session.id}>
                <TableCell className="font-medium">
                  {format(session.updatedAt, "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClasses(config.color)}`}
                  >
                    {config.label}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 w-32">
                    <Progress value={session.progress} className="h-2" />
                    <span className="text-xs text-muted-foreground">
                      {session.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant={config.color === "green" ? "default" : "outline"}
                      onClick={() => onAction(session)}
                    >
                      {config.action}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(session)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
