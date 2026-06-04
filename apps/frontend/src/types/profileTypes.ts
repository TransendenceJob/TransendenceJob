export type MatchMember = {
  userId: string;
  isWinner: boolean;
  kills: number;
  deaths: number;
};

export type UserPublicProfile = {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  rank: number;
};



export type MatchMemberAvatar = {
  userId: string;
  avatarUrl: string | null;
  displayName : string;
};
