import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  SignupState,
  SkillProficiency,
  WorkContexts,
  getRandomName,
} from "@/lib/signupTypes";

interface SignupContextType {
  state: SignupState;
  setPhoneNumber: (phone: string) => void;
  setEmail: (email: string) => void;
  setAssignedOrg: (
    org: { name: string; type: "tvet" | "platform" } | null
  ) => void;
  setFullName: (name: string) => void;
  setLocation: (location: string) => void;
  setWorkSituation: (situation: SignupState["workSituation"]) => void;
  setExperienceDuration: (duration: SignupState["experienceDuration"]) => void;
  setSelectedDomains: (domains: string[]) => void;
  toggleDomain: (domainId: string) => void;
  setSelectedTasks: (tasks: string[]) => void;
  toggleTask: (taskId: string) => void;
  addSkillProficiency: (proficiency: SkillProficiency) => void;
  updateSkillProficiency: (
    skillId: string,
    proficiency: Partial<SkillProficiency>
  ) => void;
  setWorkContexts: (contexts: WorkContexts) => void;
  setTelegramId: (telegramId: string) => void;
  setTvetInstitutionId: (id: string | null) => void;
  resetState: () => void;
}

const initialState: SignupState = {
  phoneNumber: "",
  email: "",
  assignedOrg: null,
  fullName: getRandomName(),
  location: "",
  workSituation: null,
  experienceDuration: null,
  selectedDomains: [],
  selectedTasks: [],
  skillProficiencies: [],
  workContexts: {
    farmSizes: [],
    herdSizes: [],
    equipmentTypes: [],
    supervisionLevels: [],
  },
  telegramId: null,
  tvetInstitutionId: null,
};

const SignupContext = createContext<SignupContextType | undefined>(undefined);

export function SignupProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SignupState>(initialState);

  const setPhoneNumber = (phone: string) => {
    setState((prev) => ({ ...prev, phoneNumber: phone }));
  };
  const setEmail = (email: string) => {
    setState((prev) => ({ ...prev, email }));
  };

  const setAssignedOrg = (
    org: { name: string; type: "tvet" | "platform" } | null
  ) => {
    setState((prev) => ({ ...prev, assignedOrg: org }));
  };

  const setFullName = (name: string) => {
    setState((prev) => ({ ...prev, fullName: name }));
  };

  const setLocation = (location: string) => {
    setState((prev) => ({ ...prev, location }));
  };

  const setWorkSituation = (situation: SignupState["workSituation"]) => {
    setState((prev) => ({ ...prev, workSituation: situation }));
  };

  const setExperienceDuration = (
    duration: SignupState["experienceDuration"]
  ) => {
    setState((prev) => ({ ...prev, experienceDuration: duration }));
  };

  const setSelectedDomains = (domains: string[]) => {
    setState((prev) => ({ ...prev, selectedDomains: domains }));
  };

  const toggleDomain = (domainId: string) => {
    setState((prev) => ({
      ...prev,
      selectedDomains: prev.selectedDomains.includes(domainId)
        ? prev.selectedDomains.filter((d) => d !== domainId)
        : [...prev.selectedDomains, domainId],
    }));
  };

  const setSelectedTasks = (tasks: string[]) => {
    setState((prev) => ({ ...prev, selectedTasks: tasks }));
  };

  const toggleTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      selectedTasks: prev.selectedTasks.includes(taskId)
        ? prev.selectedTasks.filter((t) => t !== taskId)
        : [...prev.selectedTasks, taskId],
    }));
  };

  const addSkillProficiency = (proficiency: SkillProficiency) => {
    setState((prev) => ({
      ...prev,
      skillProficiencies: [...prev.skillProficiencies, proficiency],
    }));
  };

  const updateSkillProficiency = (
    skillId: string,
    proficiency: Partial<SkillProficiency>
  ) => {
    setState((prev) => ({
      ...prev,
      skillProficiencies: prev.skillProficiencies.map((p) =>
        p.skill_id === skillId ? { ...p, ...proficiency } : p
      ),
    }));
  };

  const setWorkContexts = (contexts: WorkContexts) => {
    setState((prev) => ({ ...prev, workContexts: contexts }));
  };

  const setTelegramId = (telegramId: string) => {
    setState((prev) => ({ ...prev, telegramId }));
  };

  const setTvetInstitutionId = (id: string | null) => {
    setState((prev) => ({ ...prev, tvetInstitutionId: id }));
  };

  const resetState = () => {
    setState({ ...initialState, fullName: getRandomName() });
  };

  return (
    <SignupContext.Provider
      value={{
        state,
        setPhoneNumber,
        setEmail,
        setAssignedOrg,
        setFullName,
        setLocation,
        setWorkSituation,
        setExperienceDuration,
        setSelectedDomains,
        toggleDomain,
        setSelectedTasks,
        toggleTask,
        addSkillProficiency,
        updateSkillProficiency,
        setWorkContexts,
        setTelegramId,
        setTvetInstitutionId,
        resetState,
      }}
    >
      {children}
    </SignupContext.Provider>
  );
}

export function useSignup() {
  const context = useContext(SignupContext);
  if (!context) {
    throw new Error("useSignup must be used within a SignupProvider");
  }
  return context;
}
