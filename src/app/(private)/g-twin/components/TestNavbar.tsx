// components/TestNavbar.tsx
'use client';

import Logo from '@/components/layout/shared/Logo';
import Link from 'next/link';
import NoteAltTwoToneIcon from '@mui/icons-material/NoteAltTwoTone';
import LoginTwoToneIcon from '@mui/icons-material/LoginTwoTone';
import ModelTrainingTwoToneIcon from '@mui/icons-material/ModelTrainingTwoTone';

const navItems = [
  { name: 'Test window', path: '/', icon: <NoteAltTwoToneIcon /> },
  { name: 'Practice', path: '/test/practice', icon: <ModelTrainingTwoToneIcon /> },
  { name: 'Login', path: '/login', icon: <LoginTwoToneIcon /> },
];

export default function TestNavbar() {

  return (
    <nav className="w-full flex justify-center py-4">
      <div className="flex bg-white border rounded-xl shadow-md dark:bg-gray-800 dark:border-gray-700 dark:shadow-gray-900/50">
        <div className="p-2 h-fit">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="flex gap-2 px-4 py-2 rounded-xl text-sm font-medium">
          {navItems.map((item) => {
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl transition-colors duration-200 ${'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
