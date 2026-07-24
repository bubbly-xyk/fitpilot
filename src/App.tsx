import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Nav from './components/Nav';
import type { TabKey } from './components/navConfig';
import DashboardPage from './pages/DashboardPage';
import WorkoutPage from './pages/WorkoutPage';
import DietPage from './pages/DietPage';
import PhotoPage from './pages/PhotoPage';
import ExercisePage from './pages/ExercisePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const [tab, setTab] = useState<TabKey>('dashboard');

  return (
    <div className="min-h-dvh lg:flex">
      <Sidebar tab={tab} onChange={setTab} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Nav tab={tab} onChange={setTab} />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 lg:px-10 py-6 lg:py-9">
          {tab === 'dashboard' && <DashboardPage onNavigate={setTab} />}
          {tab === 'workout' && <WorkoutPage />}
          {tab === 'diet' && <DietPage />}
          {tab === 'photo' && <PhotoPage />}
          {tab === 'library' && <ExercisePage />}
          {tab === 'profile' && <ProfilePage />}
          {tab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
