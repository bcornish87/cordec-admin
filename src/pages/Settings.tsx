import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TaskTemplatesSection } from './TaskTemplates';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

const sections: SettingsSection[] = [
  {
    id: 'task-templates',
    title: 'Core Tasks',
    description: 'Manage default tasks for plots',
    content: <TaskTemplatesSection />,
  },
];

export default function Settings() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['task-templates']));

  const toggle = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage app configuration and defaults
        </p>
      </div>

      <div className="space-y-3">
        {sections.map(section => (
          <Collapsible
            key={section.id}
            open={openSections.has(section.id)}
            onOpenChange={() => toggle(section.id)}
          >
            <div className="border rounded-lg bg-card">
              <CollapsibleTrigger className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors rounded-lg">
                <div className="text-left">
                  <h2 className="text-base font-semibold">{section.title}</h2>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${
                  openSections.has(section.id) ? 'rotate-180' : ''
                }`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-5 pb-5 pt-2 border-t border-border/60">
                  {section.content}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
