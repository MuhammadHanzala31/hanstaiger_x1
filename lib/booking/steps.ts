import type { WizardStep } from "@/lib/booking/types";

export type StepConfig = {
  key: WizardStep;
  label: string;
  title: string;
};

export const STEPS: StepConfig[] = [
  { key: "dates", label: "Dates", title: "Select your dates" },
  { key: "guests", label: "Guests", title: "Choose your guests" },
  { key: "services", label: "Services", title: "Enhance your experience" },
  { key: "details", label: "Confirm", title: "Confirm your details" },
];

export const getStepIndex = (key: WizardStep) =>
  STEPS.findIndex((s) => s.key === key);
