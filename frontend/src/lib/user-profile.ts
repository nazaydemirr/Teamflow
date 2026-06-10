export type UserProfileDetails = {
  university: string;
  department: string;
  classLevel: string;
  bio: string;
  githubUrl: string;
  linkedinUrl: string;
};

const STORAGE_KEY = "teamflow_profile_details";

export async function fetchUserProfileDetails(): Promise<UserProfileDetails> {
  if (typeof window === "undefined") {
    return { university: "", department: "", classLevel: "", bio: "", githubUrl: "", linkedinUrl: "" };
  }
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as UserProfileDetails;
    }
  } catch (err) {
    console.error("Failed to parse user profile details", err);
  }
  
  return { university: "", department: "", classLevel: "", bio: "", githubUrl: "", linkedinUrl: "" };
}

export async function updateUserProfileDetails(details: Partial<UserProfileDetails>): Promise<void> {
  if (typeof window === "undefined") return;
  
  const current = await fetchUserProfileDetails();
  const updated = { ...current, ...details };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
