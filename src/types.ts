export type LumixoraRole =
  | 'marketing'
  | 'software_testing'
  | 'content_creation'
  | 'research';

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'accepted'
  | 'rejected';

export interface ReviewerNote {
  id: string;
  author: string;
  authorRole: string;
  text: string;
  rating?: number;
  createdAt: string;
}

export interface LumixoraApplication {
  id: string;
  refId: string; // e.g. LMX-B01-4821
  batch: string; // 'Batch 01'

  // Section 1: Personal Details
  fullName: string;
  email: string;
  phone: string;
  collegeName: string;
  degreeAndBranch: string;
  currentYearOfStudy: string;
  cityAndState: string;

  // Section 2: Role Selection
  preferredRole: LumixoraRole;
  preferredRoleTitle: string;
  whyJoinLumixora: string;
  relevantSkills: string;
  hoursPerWeek: string;
  canCommitSixWeeks: boolean;

  // Section 3: Experience and Portfolio
  previousExperience?: string;
  linkedinUrl?: string;
  portfolioOrWorkUrl?: string;
  hopeToLearn: string;

  // Section 4: Declaration
  confirmedAccurate: boolean;
  reviewedTerms: boolean;
  agreedToPrivacy: boolean;

  // Metadata & Review status
  status: ApplicationStatus;
  rating?: number;
  reviewerNotes: ReviewerNote[];
  interviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleDefinition {
  id: LumixoraRole;
  title: string;
  positions: number;
  summary: string;
  focusAreas: string[];
  idealCandidate: string;
}

export interface CandidateUser {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  collegeName?: string;
  degreeAndBranch?: string;
  currentYearOfStudy?: string;
  cityAndState?: string;
  createdAt: string;
  applicationRefId?: string;
}

export interface UserSession {
  isLoggedIn: boolean;
  userType: 'candidate' | 'admin';
  name: string;
  email: string;
  role?: 'reviewer' | 'lead_manager'; // for admin accounts
  candidateProfile?: Partial<CandidateUser>; // for candidate accounts
  applicationRefId?: string;
}

export type ActiveView =
  | 'apply'
  | 'tracker'
  | 'submissions'
  | 'candidate_portal'
  | 'terms'
  | 'privacy';

