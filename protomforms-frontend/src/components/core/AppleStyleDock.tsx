import {
  HomeIcon,
  Plus,
  MessageSquare,
  BarChart,
  ArrowLeft,
  Pencil,
  Share2,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/core/dock';

const data = [
  {
    title: 'Dashboard',
    icon: (
      <HomeIcon className='h-full w-full text-neutral-500' />
    ),
    href: '/admin/dashboard',
  },
  {
    title: 'Nuovo Form',
    icon: (
      <Plus className='h-full w-full text-neutral-500' />
    ),
    href: '/admin/forms/new',
  },
  {
    title: 'Risposta',
    icon: (
      <MessageSquare className='h-full w-full text-neutral-500' />
    ),
    href: '/admin/responses',
  },
  {
    title: 'Analytics',
    icon: (
      <BarChart className='h-full w-full text-neutral-500' />
    ),
    href: '/admin/analytics',
  },
];

export function AppleStyleDock() {
  const navigate = useNavigate();
  const location = useLocation();

  // Controlla se siamo nella pagina del survey (route /admin/forms/:id)
  const surveyPageMatch = location.pathname.match(/^\/admin\/forms\/([^/]+)$/);
  const isSurveyPage = surveyPageMatch !== null;
  const formId = surveyPageMatch ? surveyPageMatch[1] : null;

  // Se siamo nella pagina del survey, sostituisci:
  // - il primo elemento con "Torna Indietro"
  // - il secondo elemento con "Modifica"
  // - il terzo elemento con "Condividi"
  // - rimuovi "Analytics"
  const displayData = isSurveyPage && formId
    ? [
        {
          title: 'Torna Indietro',
          icon: (
            <ArrowLeft className='h-full w-full text-neutral-500' />
          ),
          onClick: () => navigate(-1),
        },
        {
          title: 'Modifica',
          icon: (
            <Pencil className='h-full w-full text-neutral-500' />
          ),
          href: `/admin/forms/${formId}/edit`,
        },
        {
          title: 'Condividi',
          icon: (
            <Share2 className='h-full w-full text-neutral-500' />
          ),
          href: `/admin/forms/${formId}/share`,
        },
      ]
    : data;

  return (
    <div className='fixed bottom-4 left-1/2 max-w-full -translate-x-1/2 z-[1200]'>
      <Dock className='items-end pb-3'>
        <AnimatePresence mode="popLayout">
          {displayData.map((item, idx) => (
            <motion.div
              key={item.title}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
                layout: { duration: 0.3 }
              }}
            >
              <DockItem
                className='aspect-square rounded-full bg-gray-300'
                onClick={() => {
                  if ('onClick' in item && item.onClick) {
                    item.onClick();
                  } else if ('href' in item) {
                    navigate(item.href);
                  }
                }}
              >
                <DockLabel>{item.title}</DockLabel>
                <DockIcon>{item.icon}</DockIcon>
              </DockItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </Dock>
    </div>
  );
}

