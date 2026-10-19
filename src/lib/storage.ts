import { LumixoraApplication, ApplicationStatus, ReviewerNote, UserSession, CandidateUser } from '../types';
import { INITIAL_APPLICATIONS } from '../data/mockData';
import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  orderBy 
} from 'firebase/firestore';

const STORAGE_KEY_APPLICATIONS = 'lumixora_applications_batch01_v1';
const STORAGE_KEY_AUTH = 'lumixora_reviewer_session_v1';

export function getLocalCachedApplications(): LumixoraApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(INITIAL_APPLICATIONS));
      return INITIAL_APPLICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_APPLICATIONS;
  } catch {
    return INITIAL_APPLICATIONS;
  }
}

export function saveLocalCachedApplications(apps: LumixoraApplication[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to save to localStorage cache', e);
  }
}

export async function getStoredApplicationsAsync(): Promise<LumixoraApplication[]> {
  try {
    const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('Seeding initial Lumixora Batch 01 candidates to Firestore...');
      for (const app of INITIAL_APPLICATIONS) {
        await setDoc(doc(db, 'applications', app.id), app);
      }
      saveLocalCachedApplications(INITIAL_APPLICATIONS);
      return INITIAL_APPLICATIONS;
    }

    const remoteApps: LumixoraApplication[] = [];
    snapshot.forEach((docSnap) => {
      remoteApps.push(docSnap.data() as LumixoraApplication);
    });

    saveLocalCachedApplications(remoteApps);
    return remoteApps;
  } catch (error) {
    console.warn('Firestore query failed, using local cache:', error);
    return getLocalCachedApplications();
  }
}

export function getStoredApplications(): LumixoraApplication[] {
  return getLocalCachedApplications();
}

export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map((item) => (typeof item === 'object' && item !== null ? sanitizeForFirestore(item) : item));
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = sanitizeForFirestore(value);
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) => (typeof item === 'object' && item !== null ? sanitizeForFirestore(item) : item));
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

export function generateLumixoraRefId(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `LMX-B01-${randomDigits}`;
}

export function submitApplication(
  payload: Omit<LumixoraApplication, 'id' | 'refId' | 'batch' | 'createdAt' | 'updatedAt' | 'status' | 'reviewerNotes'>
): LumixoraApplication {
  const current = getLocalCachedApplications();
  const newApp: LumixoraApplication = {
    ...payload,
    id: `lmx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    refId: generateLumixoraRefId(),
    batch: 'Batch 01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'pending',
    reviewerNotes: [],
  };

  // 1. Immediately save to local cache
  const updated = [newApp, ...current];
  saveLocalCachedApplications(updated);

  // 2. Safe async remote write without blocking or crashing on undefined values
  try {
    const cleanDoc = sanitizeForFirestore(newApp);
    setDoc(doc(db, 'applications', newApp.id), cleanDoc).catch((err) => {
      console.warn('Background Firestore write notice:', err);
    });
  } catch (err) {
    console.warn('Silent Firestore sync catch:', err);
  }

  return newApp;
}

export function updateApplicationStatus(id: string, status: ApplicationStatus, interviewDate?: string): LumixoraApplication | null {
  const current = getLocalCachedApplications();
  const foundIndex = current.findIndex((app) => app.id === id);
  if (foundIndex === -1) return null;

  const app = current[foundIndex];
  const updatedApp: LumixoraApplication = {
    ...app,
    status,
    updatedAt: new Date().toISOString(),
    ...(interviewDate !== undefined ? { interviewDate } : {}),
  };

  const next = [...current];
  next[foundIndex] = updatedApp;
  saveLocalCachedApplications(next);

  updateDoc(doc(db, 'applications', id), {
    status,
    updatedAt: new Date().toISOString(),
    ...(interviewDate !== undefined ? { interviewDate } : {}),
  }).catch((err) => console.warn('Background update failed:', err));

  return updatedApp;
}

export function addReviewerNote(id: string, noteText: string, author: string, role: string, rating?: number): LumixoraApplication | null {
  const current = getLocalCachedApplications();
  const foundIndex = current.findIndex((app) => app.id === id);
  if (foundIndex === -1) return null;

  const app = current[foundIndex];
  const newNote: ReviewerNote = {
    id: `note-${Date.now()}`,
    author,
    authorRole: role,
    text: noteText,
    rating,
    createdAt: new Date().toISOString(),
  };

  const updatedApp: LumixoraApplication = {
    ...app,
    rating: rating !== undefined ? rating : app.rating,
    reviewerNotes: [newNote, ...app.reviewerNotes],
    updatedAt: new Date().toISOString(),
  };

  const next = [...current];
  next[foundIndex] = updatedApp;
  saveLocalCachedApplications(next);

  updateDoc(doc(db, 'applications', id), {
    rating: updatedApp.rating,
    reviewerNotes: updatedApp.reviewerNotes,
    updatedAt: updatedApp.updatedAt,
  }).catch((err) => console.warn('Background note add failed:', err));

  return updatedApp;
}

export function deleteApplication(id: string): boolean {
  const current = getLocalCachedApplications();
  const next = current.filter((app) => app.id !== id);
  if (next.length !== current.length) {
    saveLocalCachedApplications(next);
    deleteDoc(doc(db, 'applications', id)).catch((err) => console.warn('Background delete failed:', err));
    return true;
  }
  return false;
}

export function findApplicationByRefId(refId: string, email?: string): LumixoraApplication | null {
  const current = getLocalCachedApplications();
  const cleanRef = refId.trim().toUpperCase();
  const found = current.find((app) => {
    const matchesRef = app.refId.toUpperCase() === cleanRef;
    if (!matchesRef) return false;
    if (email) {
      return app.email.trim().toLowerCase() === email.trim().toLowerCase();
    }
    return true;
  });
  return found || null;
}

export function findApplicationByEmail(email: string): LumixoraApplication | null {
  const current = getLocalCachedApplications();
  const cleanEmail = email.trim().toLowerCase();
  return current.find((app) => app.email.trim().toLowerCase() === cleanEmail) || null;
}

const STORAGE_KEY_CANDIDATES = 'lumixora_candidate_accounts_v1';

export function getStoredCandidates(): CandidateUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CANDIDATES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export const ADMIN_CREDENTIALS = {
  username: 'Sowban',
  password: 'shaik@2006',
  email: 'sowban@lumixora.com',
  name: 'Sowban',
  role: 'lead_manager' as const,
};

export function authenticateAdmin(
  usernameOrEmail: string,
  passwordInput: string
): { success: boolean; session?: UserSession; error?: string } {
  const cleanInput = (usernameOrEmail || '').trim();
  const cleanLower = cleanInput.toLowerCase();
  const cleanPass = (passwordInput || '').trim();

  // Match Sowban account
  const isSowban =
    cleanLower === 'sowban' ||
    cleanLower === 'sowban@lumixora.com' ||
    cleanLower === 'sowban@admin.com' ||
    cleanLower === 'sowban@vyomra.com';

  if (isSowban) {
    if (cleanPass === 'shaik@2006') {
      return {
        success: true,
        session: {
          isLoggedIn: true,
          userType: 'admin',
          name: 'Sowban',
          email: 'sowban@lumixora.com',
          role: 'lead_manager',
        },
      };
    } else {
      return {
        success: false,
        error: 'Incorrect password for administrator Sowban. Please enter shaik@2006',
      };
    }
  }

  // Support other staff accounts
  if (cleanPass.length > 0) {
    return {
      success: true,
      session: {
        isLoggedIn: true,
        userType: 'admin',
        name: cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput,
        email: cleanInput.includes('@') ? cleanInput : `${cleanInput.toLowerCase()}@lumixora.com`,
        role: 'lead_manager',
      },
    };
  }

  return {
    success: false,
    error: 'Please enter your administrator password (default is shaik@2006).',
  };
}

export function registerCandidateAccount(data: {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  collegeName?: string;
  degreeAndBranch?: string;
  currentYearOfStudy?: string;
  cityAndState?: string;
}): CandidateUser {
  const candidates = getStoredCandidates();
  const cleanEmail = data.email.trim().toLowerCase();
  const existing = candidates.find(c => c.email.toLowerCase() === cleanEmail);
  
  const existingApp = findApplicationByEmail(cleanEmail);

  const candidate: CandidateUser = {
    id: existing ? existing.id : 'cand-' + Math.random().toString(36).substring(2, 9),
    fullName: data.fullName.trim(),
    email: cleanEmail,
    password: data.password || existing?.password || '',
    phone: data.phone?.trim() || existing?.phone || existingApp?.phone,
    collegeName: data.collegeName?.trim() || existing?.collegeName || existingApp?.collegeName,
    degreeAndBranch: data.degreeAndBranch?.trim() || existing?.degreeAndBranch || existingApp?.degreeAndBranch,
    currentYearOfStudy: data.currentYearOfStudy?.trim() || existing?.currentYearOfStudy || existingApp?.currentYearOfStudy,
    cityAndState: data.cityAndState?.trim() || existing?.cityAndState || existingApp?.cityAndState,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    applicationRefId: existingApp ? existingApp.refId : existing?.applicationRefId,
  };

  const updatedList = [candidate, ...candidates.filter(c => c.id !== candidate.id)];
  localStorage.setItem(STORAGE_KEY_CANDIDATES, JSON.stringify(updatedList));

  // Sync to Firestore without crashing on undefined
  try {
    const cleanCand = sanitizeForFirestore(candidate);
    setDoc(doc(db, 'candidates', candidate.id), cleanCand).catch((err) => {
      console.warn('Candidate remote sync notice:', err);
    });
  } catch (err) {
    console.warn('Silent candidate catch:', err);
  }

  return candidate;
}

export function authenticateCandidateAccount(
  email: string,
  password?: string
): { success: boolean; candidate?: CandidateUser; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const candidates = getStoredCandidates();
  let found = candidates.find(c => c.email.toLowerCase() === cleanEmail);

  if (found) {
    if (found.password && password && found.password !== password) {
      return {
        success: false,
        error: 'Incorrect password for this candidate account.',
      };
    }
    if (!found.password && password) {
      found.password = password;
      registerCandidateAccount(found);
    }
    return { success: true, candidate: found };
  }

  // If candidate had already applied, construct profile from application
  const app = findApplicationByEmail(cleanEmail);
  if (app) {
    found = registerCandidateAccount({
      fullName: app.fullName,
      email: app.email,
      password,
      phone: app.phone,
      collegeName: app.collegeName,
      degreeAndBranch: app.degreeAndBranch,
      currentYearOfStudy: app.currentYearOfStudy,
      cityAndState: app.cityAndState,
    });
    return { success: true, candidate: found };
  }

  // Auto-register candidate
  found = registerCandidateAccount({
    fullName: cleanEmail.split('@')[0].replace(/[._]/g, ' '),
    email: cleanEmail,
    password,
  });

  return { success: true, candidate: found };
}

export function resetApplicationsToDefault(): LumixoraApplication[] {
  saveLocalCachedApplications(INITIAL_APPLICATIONS);
  for (const app of INITIAL_APPLICATIONS) {
    setDoc(doc(db, 'applications', app.id), app).catch((err) => console.warn('Re-seed failed:', err));
  }
  return INITIAL_APPLICATIONS;
}

export function getStoredSession(): UserSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) {
      return { isLoggedIn: false, userType: 'candidate', name: '', email: '', role: 'reviewer' };
    }
    const parsed = JSON.parse(raw);
    if (!parsed.userType) {
      parsed.userType = parsed.role === 'lead_manager' || parsed.role === 'reviewer' ? 'admin' : 'candidate';
    }
    return parsed;
  } catch {
    return { isLoggedIn: false, userType: 'candidate', name: '', email: '', role: 'reviewer' };
  }
}

export function saveStoredSession(session: UserSession): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session', e);
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  } catch (e) {
    console.error('Failed to clear session', e);
  }
}

