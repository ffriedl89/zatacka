import { debug } from 'console';
import Peer from 'peerjs';
import { createContext, FunctionalComponent, h } from 'preact';
import { useMemo, useRef, useState } from 'preact/hooks';

export const CommunicationContext = createContext({});

export const CommunicationProvider: FunctionalComponent = props => {
  const { children } = props;

  const peer = useRef(new Peer(undefined, { debug: 2 }));

  const context = { peer };

  return <CommunicationContext.Provider value={context}>{children}</CommunicationContext.Provider>;
};
