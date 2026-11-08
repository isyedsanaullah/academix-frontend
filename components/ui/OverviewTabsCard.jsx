'use client';

import { useState } from 'react';
import Card from './Card';
import Icon from '../Icon';
import Percentage from './Percentage';

/**
 * Core 2.0 Segmented Overview Tray Card
 * Replicates templates/HomePage/Overview/index.tsx from UI8 Core 2.0
 */
const OverviewTabsCard = ({
  title = 'Overview',
  subtitle,
  tabs = [],
  activeTab: controlledTab,
  onTabChange,
  selectOptions,
  selectValue,
  selectOnChange,
  headContent,
  children,
  className = '',
}) => {
  const [internalTab, setInternalTab] = useState(tabs[0]?.id ?? 0);
  const currentTab = controlledTab !== undefined ? controlledTab : internalTab;

  const handleSelect = (id) => {
    setInternalTab(id);
    if (onTabChange) onTabChange(id);
  };

  return (
    <Card
      className={className}
      title={title}
      subtitle={subtitle}
      selectOptions={selectOptions}
      selectValue={selectValue}
      selectOnChange={selectOnChange}
      headContent={headContent}
    >
      <div className="pt-1">
        {tabs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 mb-4 p-1.5 border border-s-subtle rounded-4xl bg-b-depth2">
            {tabs.map((tab, idx) => {
              const id = tab.id ?? idx;
              const isActive = id === currentTab;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelect(id)}
                  className={`group flex flex-col justify-between text-left px-6 py-5 rounded-3xl transition-all cursor-pointer max-md:p-4 ${
                    isActive
                      ? 'bg-b-surface2 shadow-depth-toggle border border-s-subtle'
                      : 'border border-transparent hover:bg-b-surface2/50'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2.5 mb-2.5 text-sub-title-1 transition-colors group-hover:text-t-primary ${
                      isActive ? 'text-t-primary' : 'text-t-secondary'
                    }`}
                  >
                    {tab.icon && (
                      <div
                        className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                          isActive
                            ? 'bg-primary-01/12 text-primary-01'
                            : 'bg-b-surface2 text-t-secondary group-hover:text-t-primary'
                        }`}
                      >
                        <Icon
                          name={tab.icon}
                          className={`!size-4.5 transition-colors ${
                            isActive
                              ? 'fill-primary-01'
                              : 'fill-t-secondary group-hover:fill-t-primary'
                          }`}
                        />
                      </div>
                    )}
                    <span className="truncate">{tab.label}</span>
                  </div>

                  <div className="flex items-end justify-between gap-3 mt-1">
                    <div className="text-h3 max-md:text-h4 text-t-primary tabular-nums leading-none">
                      {tab.value}
                    </div>
                    {tab.percent !== undefined && tab.percent !== null && (
                      <div className="flex flex-col items-end">
                        <Percentage value={tab.percent} />
                        {tab.caption && (
                          <span className="mt-1 text-[11px] text-t-tertiary">
                            {tab.caption}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {tab.subValue && (
                    <div className="mt-2 text-caption text-t-secondary truncate">
                      {tab.subValue}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {children}
      </div>
    </Card>
  );
};

export default OverviewTabsCard;

