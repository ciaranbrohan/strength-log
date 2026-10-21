import { useState } from 'react';
import TabBar, { type Tab } from './components/TabBar';
import Train from './screens/Train';
import History from './screens/History';
import Exercises from './screens/Exercises';
import Body from './screens/Body';
import Settings from './screens/Settings';

const TAB_KEY = 'strength-log:tab';
const TABS: Tab[] = ['train', 'history', 'exercises', 'body', 'settings'];

function initialTab(): Tab {
  try {
    const saved = localStorage.getItem(TAB_KEY) as Tab | null;
    if (saved && TABS.includes(saved)) return saved;
  } catch {
    // storage unavailable; fall back to default
  }
  return 'train';
}

export default function App() {
  const [tab, setTab] = useState<Tab>(initialTab);

  const select = (next: Tab) => {
    setTab(next);
    window.scrollTo(0, 0);
    try {
      localStorage.setItem(TAB_KEY, next);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <main>
        {tab === 'train' && <Train />}
        {tab === 'history' && <History />}
        {tab === 'exercises' && <Exercises />}
        {tab === 'body' && <Body />}
        {tab === 'settings' && <Settings />}
      </main>
      <TabBar tab={tab} onSelect={select} />
    </>
  );
}
