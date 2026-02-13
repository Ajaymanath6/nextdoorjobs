/**
 * Fixed list of avatars for profile picker and map markers.
 * DB stores only avatarId; frontend resolves to URL via this list.
 */
export const AVATARS = [
  { id: "avatar1", url: "/avatars/avatar1.png" },
  { id: "avatar2", url: "/avatars/avatar2.png" },
  { id: "avatar3", url: "/avatars/avatar3.png" },
  { id: "avatar4", url: "/avatars/avatar4.png" },
  { id: "avatar5", url: "/avatars/avatar5.png" },
  { id: "avatar6", url: "/avatars/avatar6.png" },
];

export const AVATAR_IDS = AVATARS.map((a) => a.id);

export function getAvatarUrlById(avatarId) {
  const a = AVATARS.find((x) => x.id === avatarId);
  return a ? a.url : AVATARS[0].url;
}
