export interface TeamMember {
  name: string;
  title: string;
  bio: string;
  initials: string;
}

export interface MusicStyle {
  name: string;
  description: string;
  genre: "Electronic" | "Acoustic" | "Orchestral" | "Urban";
  mood: string;
}

export interface Stat {
  value: string;
  label: string;
  numericValue?: number;
  prefix?: string;
  suffix?: string;
}
