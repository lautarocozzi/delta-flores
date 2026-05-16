import { LucideIcon } from "lucide-react";

interface EventLogItemProps {
  icon: LucideIcon;
  action: string;
  timestamp: string;
  type?: string;
}

export const EventLogItem = ({ icon: Icon, action, timestamp, type }: EventLogItemProps) => {
  let iconBg = 'bg-primary/30';
  if (type === 'Riego') iconBg = 'bg-blue-600/30';
  if (type === 'Nota') iconBg = 'bg-yellow-600/30';

  return (
    <div className="flex items-start space-x-3 mb-4 relative ml-4">
      <div className={`absolute -left-5 top-0.5 w-3 h-3 rounded-full ${iconBg} border-2 border-background z-10`}></div>
      
      <div className={`${iconBg} p-2 rounded-full flex items-center justify-center flex-shrink-0`}>
        <Icon className="text-foreground" size={16}/>
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground leading-tight">{action}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{timestamp}</p>
      </div>
    </div>
  );
};
