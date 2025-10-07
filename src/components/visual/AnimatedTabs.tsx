"use client";

import { motion } from 'framer-motion';
import React from 'react';

interface Tab {
  id: string;
  name: string;
  disabled?: boolean;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  return (
    <div className={`relative mb-6 ${className}`}>
      <div className="flex space-x-1 border-b border-gray-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={`relative px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                isDisabled 
                  ? 'cursor-not-allowed text-gray-400 bg-gray-50' 
                  : 'cursor-pointer text-blue-600 hover:text-blue-900 bg-white hover:bg-gray-50'
              } ${
                isActive ? 'text-blue-600' : ''
              }`}
            >
              {/* Fondo con gradiente sutil para activa */}
              {isActive && (
                <motion.div
                  layoutId="tabBackground"
                  className="absolute inset-0 rounded-t-lg bg-gradient-to-b from-blue-50 to-white border-l border-r border-t border-gray-200"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                />
              )}
              
              {/* Fondo blanco para no activas */}
              {!isActive && (
                <div className="absolute inset-0 bg-white rounded-t-lg border-l border-r border-t border-gray-200" />
              )}
              
              <span className="relative z-10">
                {tab.name}
              </span>
              
              {/* Línea inferior azul */}
              {isActive && (
                <motion.div
                  layoutId="bottomLine"
                  className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-600"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
                />
              )}
              
              {isDisabled && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-gray-400 z-20"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AnimatedTabs;