import { useEffect } from 'react';
import { createHashRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { useStore } from './store';
import { useUi } from './store/ui';
import { configureAudio } from './lib/audio';
import { Layout } from './components/Layout';
import { HomePage } from './pages/Home';
import { PracticePage } from './pages/Practice';
import { StoriesPage, StoryPage, ChapterPage } from './pages/Storybook';
import { LessonsPage, LessonPage } from './pages/Lessons';
import { ChallengePage } from './pages/Challenge';
import { StatsPage } from './pages/Stats';
import { SettingsPage } from './pages/Settings';
import { WelcomePage } from './pages/Welcome';
import { NotFound } from './pages/NotFound';

function Root() {
  const settings = useStore((s) => s.settings);
  const typing = useUi((s) => s.typing);

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = settings.theme;
    el.style.setProperty('--typing-size', `${settings.fontSize}px`);
    el.classList.toggle('motion-off', settings.reducedMotion === 'on');
    el.classList.toggle('motion-on', settings.reducedMotion === 'off');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(el).getPropertyValue('--bg').trim() || '#111318');
  }, [settings.theme, settings.fontSize, settings.reducedMotion]);

  useEffect(() => {
    configureAudio({ enabled: settings.sound, volume: settings.volume });
  }, [settings.sound, settings.volume]);

  useEffect(() => {
    document.documentElement.dataset.typing = typing ? 'true' : 'false';
  }, [typing]);

  return (
    <MotionConfig reducedMotion={settings.reducedMotion === 'on' ? 'always' : settings.reducedMotion === 'off' ? 'never' : 'user'}>
      <Outlet />
    </MotionConfig>
  );
}

function Gate() {
  const onboarded = useStore((s) => s.profile.onboarded);
  if (!onboarded) return <Navigate to="/welcome" replace />;
  return <Layout />;
}

const router = createHashRouter([
  {
    element: <Root />,
    children: [
      { path: '/welcome', element: <WelcomePage /> },
      {
        element: <Gate />,
        children: [
          { index: true, element: <HomePage /> },
          { path: '/practice', element: <PracticePage /> },
          { path: '/stories', element: <StoriesPage /> },
          { path: '/stories/:id', element: <StoryPage /> },
          { path: '/stories/:id/:chapter', element: <ChapterPage /> },
          { path: '/lessons', element: <LessonsPage /> },
          { path: '/lessons/:id', element: <LessonPage /> },
          { path: '/challenge', element: <ChallengePage /> },
          { path: '/stats', element: <StatsPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
