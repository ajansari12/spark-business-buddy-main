export type BusinessStructureType = "sole_proprietorship" | "partnership" | "corporation";

export interface RegistrationStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  cost: string;
  governmentUrl: string;
  requiredDocuments: string[];
  tips: string[];
  isOptional?: boolean;
}

export interface BusinessStructure {
  type: BusinessStructureType;
  label: string;
  description: string;
  pros: string[];
  cons: string[];
  recommendedFor: string[];
  registrationFee: string;
}

export interface ProvinceRegistration {
  provinceCode: string;
  provinceName: string;
  businessStructures: BusinessStructure[];
  steps: RegistrationStep[];
  nameSearchUrl: string;
  businessRegistryUrl: string;
  craBusinessNumberUrl: string;
  hstThreshold: number;
  additionalNotes: string[];
}

export interface RegistrationProgress {
  id: string;
  user_id: string;
  idea_id: string;
  province: string;
  business_structure: BusinessStructureType;
  current_step: number;
  completed_steps: string[];
  step_notes: Record<string, string>;
  business_name?: string;
  business_number?: string;
  status: "in_progress" | "completed" | "abandoned";
  created_at: string;
  updated_at: string;
}
