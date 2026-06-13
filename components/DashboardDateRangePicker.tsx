'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

const DateRangePicker = dynamic(
  () => import('rsuite').then((mod) => mod.DateRangePicker),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-9 w-full min-w-[240px] rounded-md border border-gray-200 bg-gray-50/80"
        aria-hidden
      />
    ),
  }
);

export type DashboardDateRangePickerProps = ComponentProps<typeof DateRangePicker>;

export default function DashboardDateRangePicker(props: DashboardDateRangePickerProps) {
  return <DateRangePicker {...props} />;
}
