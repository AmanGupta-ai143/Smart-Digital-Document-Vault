import {
  GraduationCap, Briefcase, Wallet, Award, Home as HomeIcon, HeartPulse,
  FolderOpen, FileText, ImageIcon,
} from "lucide-react";

export const CATEGORY_META = {
  Education: { icon: GraduationCap, color: "text-blue-700", bg: "bg-blue-50" },
  Career: { icon: Briefcase, color: "text-teal-700", bg: "bg-teal-50" },
  Finance: { icon: Wallet, color: "text-amber-700", bg: "bg-amber-50" },
  Certificates: { icon: Award, color: "text-violet-700", bg: "bg-violet-50" },
  Personal: { icon: HomeIcon, color: "text-rose-700", bg: "bg-rose-50" },
  Health: { icon: HeartPulse, color: "text-emerald-700", bg: "bg-emerald-50" },
  Other: { icon: FolderOpen, color: "text-slate-600", bg: "bg-slate-100" },
};

export const DOC_CATEGORIES = Object.keys(CATEGORY_META);
export const CONTACT_CATEGORIES = ["Family", "Friends", "Emergency", "College", "Work", "Doctor", "Other"];
export const FILE_ICON = { pdf: FileText, docx: FileText, txt: FileText, jpg: ImageIcon, png: ImageIcon };
