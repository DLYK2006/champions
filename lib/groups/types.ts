// Groups client types. Shared shapes live in types/index.ts (Daren owns that file).
import type { Group, GroupDailyProgress, GroupMemberStatus } from "../../types/index";

// What get_group_status returns: everything the Groups page shows. Never includes weights or exact intake.
export interface GroupStatus {
  group: Group;
  progress: GroupDailyProgress;
  members: GroupMemberStatus[];
}
