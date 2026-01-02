import React from "react";

import {  Card, FormControlLabel, Switch, Typography } from "@mui/material";

interface CodeOutputProps {
  output: string;
}

const CodeOutput: React.FC<CodeOutputProps> = ({ output }) => {
  return (
    <Card className="flex flex-1 flex-grow flex-col ">
      {/* Output Header */}
      <div className="w-full flex flex-row justify-between items-center py-3 px-3 border-b-2 rounded-b-none  " >
        <Typography variant="h6" color="textSecondary">
          Output
        </Typography>
        <FormControlLabel value='Interactive ' label='Interactive ' labelPlacement='start' className='mie-4' control={<Switch />} />

      </div>

      {/* Output Content */}
      <Card className="flex-grow overflow-auto dark:px-2 py-1 rounded-t-none" >
        <Typography
          component="pre"
          sx={{ whiteSpace: "pre-wrap" }}
        >
          {output || "Output will appear here..."}
        </Typography>
      </Card>
    </Card>
  );
};

export default CodeOutput;
