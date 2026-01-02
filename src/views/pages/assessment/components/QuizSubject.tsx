import React from 'react';
import { Box, Typography, TextField } from '@mui/material';

/** Props for the QuizSubject component */
export interface QuizSubjectProps {
  /**
   * Title of the subjective question
   */
  title: string;
  /**
   * Additional description/content for the question
   */
  description?: string;
  /**
   * Student's current answer
   */
  answer: string;
  /**
   * Handler when student types an answer
   */
  onContentChange: (newContent: string) => void;
  /**
   * Optional callback to handle selected answer logic externally
   */
  handleSelect?: (answer: string) => void;
}

/**
 * Component for displaying a subjective question with a large answer box
 */
const QuizSubject: React.FC<QuizSubjectProps> = ({
  title,
  description,
  answer,
  onContentChange,
  handleSelect
}) => {


  // console.log('description' , description)
  return (
    <Box className="h-full flex flex-col p-4">
      <Typography variant="h6" className="mb-2">
        {title}
      </Typography>

      <Typography
        variant="h6"
        className="mb-2"
        dangerouslySetInnerHTML={{ __html: description || "" }}
      />

      {description && (<Typography variant="body2" color="textSecondary" className="mb-4" dangerouslySetInnerHTML={{ __html: description }} />)}

      <TextField
        multiline
        fullWidth
        minRows={12}
        variant="outlined"
        value={answer}
        onChange={(e) => {
          const value = e.target.value;
          onContentChange(value);
          if (handleSelect) handleSelect(value);
        }}
      />
    </Box>
  );
};

export default QuizSubject;

/*
Usage in QuizPanel:

<QuizSubject
  title={currentQuestion.question}
  description={currentQuestion.content}
  answer={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
  onContentChange={(value) =>
    updateAnswer({
      questionId: currentQuestion.quiz_id,
      answer: value
    })
  }
  handleSelect={handleAnswerSelect}
/>
*/
