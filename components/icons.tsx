/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  History,
  Home,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Moon,
  Play,
  RefreshCw,
  Settings,
  Sun,
  Terminal,
  User,
  X,
  XCircle,
  Zap
} from 'lucide-react';

const defaultProps = {
  strokeWidth: 2,
  className: "w-5 h-5"
};

type IconProps = React.SVGProps<SVGSVGElement>;

export const HomeIcon: React.FC<IconProps> = (props) => <Home {...defaultProps} {...props} />;
export const DashboardIcon: React.FC<IconProps> = (props) => <LayoutDashboard {...defaultProps} {...props} />;
export const CodeIcon: React.FC<IconProps> = (props) => <Code2 {...defaultProps} {...props} />;
export const HistoryIcon: React.FC<IconProps> = (props) => <History {...defaultProps} {...props} />;
export const UserIcon: React.FC<IconProps> = (props) => <User {...defaultProps} {...props} />;
export const SettingsIcon: React.FC<IconProps> = (props) => <Settings {...defaultProps} {...props} />;
export const SunIcon: React.FC<IconProps> = (props) => <Sun {...defaultProps} {...props} />;
export const MoonIcon: React.FC<IconProps> = (props) => <Moon {...defaultProps} {...props} />;
export const CheckCircleIcon: React.FC<IconProps> = (props) => <CheckCircle {...defaultProps} {...props} />;
export const XCircleIcon: React.FC<IconProps> = (props) => <XCircle {...defaultProps} {...props} />;
export const PlayIcon: React.FC<IconProps> = (props) => <Play {...defaultProps} {...props} fill="currentColor" />;
export const RefreshIcon: React.FC<IconProps> = (props) => <RefreshCw {...defaultProps} {...props} />;
export const BrainIcon: React.FC<IconProps> = (props) => <Brain {...defaultProps} {...props} />;
export const ClockIcon: React.FC<IconProps> = (props) => <Clock {...defaultProps} {...props} />;
export const AwardIcon: React.FC<IconProps> = (props) => <Award {...defaultProps} {...props} />;
export const TerminalIcon: React.FC<IconProps> = (props) => <Terminal {...defaultProps} {...props} />;
export const ZapIcon: React.FC<IconProps> = (props) => <Zap {...defaultProps} {...props} />;
export const CpuIcon: React.FC<IconProps> = (props) => <Cpu {...defaultProps} {...props} />;
export const BookIcon: React.FC<IconProps> = (props) => <BookOpen {...defaultProps} {...props} />;
export const ChevronRightIcon: React.FC<IconProps> = (props) => <ChevronRight {...defaultProps} {...props} />;
export const LightbulbIcon: React.FC<IconProps> = (props) => <Lightbulb {...defaultProps} {...props} />;
export const MenuIcon: React.FC<IconProps> = (props) => <Menu {...defaultProps} {...props} />;
export const XIcon: React.FC<IconProps> = (props) => <X {...defaultProps} {...props} />;
export const ActivityIcon: React.FC<IconProps> = (props) => <Activity {...defaultProps} {...props} />;
export const LogoutIcon: React.FC<IconProps> = (props) => <LogOut {...defaultProps} {...props} />;
