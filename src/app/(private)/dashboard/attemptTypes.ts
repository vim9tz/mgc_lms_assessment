export interface GeeksTestSubmissionType {
    test_id: string;
    title:string;
    description:string;
    quiz_id: number;
    coding_id: number;
    total_marks: number;
    obtained_marks: number;
    negative_marks: number;
    start_time: string;
    end_time: string;
    time_taken: number;
    time_remaining: number;
    time_limit: number;
    tab_switches: number;
    copy_paste: number;
    submitted_by: string;
    session: string;
    browser: string;
    ip_address: string;
    time_zone: string;
    attempts: number;
    total_tests:number;
    average_marks:number;
    quiz_modules?: QuizModule[];
  coding_modules?: CodingModule[];
  }


  export interface QuizModule {
    module_id: string;
    module_name: string;
    quiz_question_count: number;
  }
  
  export interface CodingModule {
    module_id: string;
    module_name: string;
    coding_question_count: number;
  }
  

  export interface UserDetailsType {
    avatar_url: string;
    email: string;
    name: string;
    time_taken: number;
    time_remaining: number;
    time_limit: number;
    tab_switches: number;
    copy_paste: number;
    submitted_by: string;
    session: string;
    browser: string;
    ip_address: string;
    time_zone: string;
    attempts: number;
    total_tests:number;
    average_marks:number;
  }
