export interface TeamMember {
  name: string;
  title: string;
  bio: string;
  initials: string;
}

export interface PortfolioCompany {
  name: string;
  description: string;
  sector: "Therapeutics" | "MedTech" | "Digital Health";
  stage: string;
}

export interface Stat {
  value: string;
  label: string;
  numericValue?: number;
  prefix?: string;
  suffix?: string;
}
