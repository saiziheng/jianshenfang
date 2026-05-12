import type { Metadata } from 'next';
import { CourseWorkbenchClient } from './course-workbench-client';

export const metadata: Metadata = {
  title: 'Seedance老师授课整理页',
  description: '12天Seedance单工具课程授课内容整理网页'
};

export default function CourseWorkbenchPage() {
  return <CourseWorkbenchClient />;
}
