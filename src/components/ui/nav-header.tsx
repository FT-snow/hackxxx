'use client';

import { motion, type TargetAndTransition } from 'framer-motion';
import Link from 'next/link';
import React, { useRef, useState } from 'react';

interface TabDef {
  href: string;
  label: string;
  external?: boolean;
}

const TABS: TabDef[] = [
  { href: '/', label: 'Home' },
  { href: '/notebook', label: 'Notes' },
  { href: '/mesh', label: 'Mesh' },
  { href: '/paper-checker', label: 'Grader' },
  { href: '/profile', label: 'Profile' },
];

interface CursorPosition {
  left: number;
  width: number;
  opacity: number;
}

export default function NavHeader() {
  const [position, setPosition] = useState<CursorPosition>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  return (
    <ul
      className="relative mx-auto flex w-fit rounded-full border border-white/[0.1] bg-[#0c0f0d] p-1"
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
    >
      {TABS.map((tab) => (
        <Tab key={tab.label} tab={tab} setPosition={setPosition} />
      ))}
      <Cursor position={position} />
    </ul>
  );
}

function Tab({
  tab,
  setPosition,
}: {
  tab: TabDef;
  setPosition: React.Dispatch<React.SetStateAction<CursorPosition>>;
}) {
  const ref = useRef<HTMLLIElement>(null);

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return;
        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      className="relative z-10 block cursor-pointer"
    >
      <Link
        href={tab.href}
        {...(tab.external ? { target: '_blank', rel: 'noreferrer' } : {})}
        className="block px-4 py-2 text-xs font-bold tracking-wider text-gray-300 uppercase transition-colors duration-200 hover:text-black md:text-sm"
      >
        {tab.label}
      </Link>
    </li>
  );
}

function Cursor({ position }: { position: CursorPosition }) {
  return (
    <motion.li
      animate={position as TargetAndTransition}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute top-1 bottom-1 z-0 rounded-full bg-[#E9C468]"
    />
  );
}
