import { useState } from 'react';
import { Breadcrumbs } from '@/components/EntityPage';
import { PlotPriceGrid } from '@/components/PlotPriceGrid';
import { SiteContacts } from '@/components/SiteContacts';
import { DeveloperContacts } from '@/components/DeveloperContacts';
import { type DrillState } from '@/pages/clients/types';
import { SiteInfoPanel } from '@/pages/clients/SiteInfoPanel';
import { DevelopersList } from '@/pages/clients/DevelopersList';
import { SitesList } from '@/pages/clients/SitesList';

export default function Developers() {
  const [drill, setDrill] = useState<DrillState>({});

  // Level 3: Plots for a site (price grid)
  if (drill.developer && drill.site) {
    const developer = drill.developer;
    const site = drill.site;
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Developers', onClick: () => setDrill({}) },
          { label: developer.name, onClick: () => setDrill({ developer }) },
          { label: site.name },
        ]} />
        <SiteInfoPanel
          siteId={site.id}
          initialName={site.name}
          onNameSaved={name => setDrill({ developer, site: { id: site.id, name } })}
        />
        <SiteContacts siteId={site.id} developerId={developer.id} />
        <PlotPriceGrid siteId={site.id} />
      </div>
    );
  }

  // Level 2: Sites for a developer
  if (drill.developer) {
    return (
      <div className="space-y-6">
        <div>
          <Breadcrumbs items={[
            { label: 'Developers', onClick: () => setDrill({}) },
            { label: drill.developer.name },
          ]} />
          <h1 className="text-2xl font-semibold">{drill.developer.name}</h1>
        </div>
        <SitesList
          developerId={drill.developer.id}
          onOpen={(site) =>
            setDrill({
              developer: drill.developer,
              site,
            })
          }
        />
        <DeveloperContacts developerId={drill.developer.id} />
      </div>
    );
  }

  // Level 1: Developers
  return (
    <DevelopersList
      onOpen={(dev) => setDrill({ developer: dev })}
    />
  );
}
