import React, { PropsWithChildren } from 'react';

/**
 * No-op provider left for backward compatibility while migrating to Zustand.
 */
export const ServerProvider: React.FC<PropsWithChildren> = ({ children }) => <>{children}</>; 