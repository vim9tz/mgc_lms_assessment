// Type Imports
import type { ThemeColor } from '@core/types'

export type Course = {
  id: number
  image: string
  user: string
  tutorImg: string
  completedTasks: number
  totalTasks: number
  userCount: number
  note: number
  view: number
  time: string
  logo: string
  name: string
  color: ThemeColor
  desc: string
  tags: string
  rating: number
  ratingCount: number
}

export type CourseContent = {
  id: number;
  title: string;
  duration: string;
  topics: Topic[]; // ✅ Now properly typed as an array of `Topic`
};

export type CourseDetails = {
  id: number;
  title: string;
  description: string[];
  about: string;
  instructor: string;
  instructorAvatar: string;
  instructorPosition: string;
  // Optional since it isn’t provided by the backend
  skillLevel?: string;
  ratings: {
    average: number;
    count: number;
  };
  tags: string[];
  totalLectures: number;
  totalStudents: number;
  isCaptions: boolean; // Convert 1/0 to true/false when processing the data
  language: string[];  // Backend returns an array, e.g., ['Tamil', 'English']
  length: string;
  content: CourseContent[];
};

export interface Topic {
  title: string
  subtopic_id : string
  time: string
  isCompleted: boolean
}

export interface ContentItem {
  id: number
  title: string
  duration: string
  topics: Topic[]
}

export type CourseTopic = {
  title: string
  time: string
  isCompleted: boolean
}

export type AcademyType = {
  courses: Course[]
  courseDetails: CourseDetails
}
