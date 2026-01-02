import { Typography } from "@mui/material";
import React from "react";

type Props = {
  question: string;
};

export default function QuizQuestion({ question }: Props) {

  // console.log(  'fhuweufhwueh', question)
  return (
    <Typography
        variant="h6"
        className="mb-2"
        dangerouslySetInnerHTML={{ __html: question || "" }}
      />

  );
}
