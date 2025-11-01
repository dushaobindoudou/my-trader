declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }
  
  export type LucideIcon = ComponentType<any>;
  
  export const Wallet: LucideIcon;
  export const Loader2: LucideIcon;
  export const LogOut: LucideIcon;
  export const Settings: LucideIcon;
  export const User: LucideIcon;
  export const ArrowUpIcon: LucideIcon;
  export const ArrowDownIcon: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const DollarSign: LucideIcon;
  export const Target: LucideIcon;
  export const Activity: LucideIcon;
  export const Shield: LucideIcon;
  export const Globe: LucideIcon;
  export const Repeat: LucideIcon;
  export const Bell: LucideIcon;
  export const Search: LucideIcon;
  export const Menu: LucideIcon;
  export const Check: LucideIcon;
  export const Moon: LucideIcon;
  export const Sun: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const X: LucideIcon;
  export const Circle: LucideIcon;
  export const PanelLeftIcon: LucideIcon;
  export const Telescope: LucideIcon;
  export const CircleQuestionMark: LucideIcon;
  export const Calendar: LucideIcon;
  export const SearchIcon: LucideIcon;
  export const XIcon: LucideIcon;
  export const CheckIcon: LucideIcon;
  export const CircleIcon: LucideIcon;
}
