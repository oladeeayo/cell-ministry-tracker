export const HIERARCHY: Record<string, number> = {
  COMMUNITY_PASTOR: 6,
  DISTRICT_LEADER: 5,
  ZONAL_LEADER: 4,
  CELL_LEADER: 3,
  ASST_CELL_LEADER: 2,
  E_GROUP_LEADER: 1,
};

export const ROLE_LABELS: Record<string, string> = {
  COMMUNITY_PASTOR: "Community Pastor",
  DISTRICT_LEADER: "District Leader",
  ZONAL_LEADER: "Zonal Leader",
  CELL_LEADER: "Cell Leader",
  ASST_CELL_LEADER: "Asst. Cell Leader",
  E_GROUP_LEADER: "E-Group Leader",
  MEMBER: "Member",
};

export function canEdit(currentRole: string, targetRole: string): boolean {
  const current = HIERARCHY[currentRole] ?? 0;
  const target = HIERARCHY[targetRole] ?? 0;
  return current > target;
}
