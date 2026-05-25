import { useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useLanguage } from '../context/LanguageContext';

export const useAppTour = (
  hasMatches: boolean,
  setViewMode: (mode: 'matches' | 'leaderboard') => void
) => {
  const { language, t } = useLanguage();
  const driverInstance = useRef<any>(null);

  const startTour = () => {
    const steps: any[] = [
      {
        element: '#app-logo',
        popover: {
          title: t('tourWelcomeTitle'),
          description: t('tourWelcomeDesc'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '#marquee-ticker',
        popover: {
          title: t('tourTickerTitle'),
          description: t('tourTickerDesc'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '#points-indicator',
        popover: {
          title: t('tourPointsTitle'),
          description: t('tourPointsDesc'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      {
        element: '#tab-predict-floor',
        popover: {
          title: t('tourTabsTitle'),
          description: t('tourTabsDesc'),
          side: 'bottom' as const,
          align: 'start' as const
        },
        onHighlighted: () => {
          setViewMode('matches');
        }
      },
      {
        element: '#predict-floor-welcome',
        popover: {
          title: t('tourWelcomeBoardTitle'),
          description: t('tourWelcomeBoardDesc'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      }
    ];

    if (hasMatches) {
      steps.push(
        {
          element: '#first-match-card',
          popover: {
            title: t('tourFirstMatchTitle'),
            description: t('tourFirstMatchDesc'),
            side: 'bottom' as const,
            align: 'start' as const
          }
        },
        {
          element: '#match-prediction-buttons-demo',
          popover: {
            title: t('tourPredictionButtonsTitle'),
            description: t('tourPredictionButtonsDesc'),
            side: 'top' as const
          }
        },
        {
          element: '#match-mod-tracker-demo',
          popover: {
            title: t('tourModTrackerTitle'),
            description: t('tourModTrackerDesc'),
            side: 'top' as const
          }
        }
      );
    }

    steps.push(
      {
        element: '#tab-excel-leaderboard',
        popover: {
          title: t('tourTabsTitle'),
          description: t('tourTabsDesc'),
          side: 'bottom' as const,
          align: 'start' as const
        },
        onHighlighted: () => {
          setViewMode('leaderboard');
        }
      },
      {
        element: '#spreadsheet-table',
        popover: {
          title: t('tourSpreadsheetTitle'),
          description: t('tourSpreadsheetDesc'),
          side: 'top' as const,
          align: 'start' as const
        }
      },
      {
        element: '#th-total-points',
        popover: {
          title: t('tourSpreadsheetSecurityTitle'),
          description: t('tourSpreadsheetSecurityDesc'),
          side: 'bottom' as const
        }
      },
      {
        element: '#tour-trigger',
        popover: {
          title: t('tourManualTriggerTitle'),
          description: t('tourManualTriggerDesc'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      }
    );

    driverInstance.current = driver({
      showProgress: true,
      popoverClass: 'glass-driver-popover',
      progressText: language === 'vi' ? 'Bước {{current}} / {{total}}' : 'Step {{current}} of {{total}}',
      nextBtnText: t('tourBtnNext'),
      prevBtnText: t('tourBtnPrev'),
      doneBtnText: t('tourBtnDone'),
      overlayColor: 'rgba(0, 0, 0, 0.75)',
      steps: steps.map((step) => ({
        ...step,
        popover: {
          ...step.popover,
        }
      })),
      onDestroyed: () => {
        localStorage.setItem('predict_football_tour_completed', 'true');
      }
    });

    driverInstance.current.drive();
  };

  return { startTour };
};
