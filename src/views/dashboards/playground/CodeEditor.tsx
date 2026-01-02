import React, { useState } from "react";

import Editor from "@monaco-editor/react";
import axios from "axios";
import { Box, Button, FormControlLabel, Grid, MenuItem, Select, Switch, } from "@mui/material";
import Card from '@mui/material/Card';
import { Flex, Splitter, Typography } from 'antd';


import CodeOutput from "./CodeOutput"; // Import the separate CodeOutput

const CodeEditor: React.FC = () => {
  const [language, setLanguage] = useState("cpp"); // Default language
  const [code, setCode] = useState(""); // Code input
  const [output, setOutput] = useState(""); // Execution output
  const [isLoading, setIsLoading] = useState(false); // Loading state for "Run"

  const languages = [
    { label: "C", value: "c", judge0LangId: 50 },
    { label: "C++", value: "cpp", judge0LangId: 54 },
    { label: "Java", value: "java", judge0LangId: 62 },
    { label: "Python", value: "python", judge0LangId: 71 },
  ];




  const handleRunCode = async () => {
    const selectedLang = languages.find((lang) => lang.value === language);

    if (!selectedLang) {
      setOutput("Unsupported language selected.");

      return;
    }

    setIsLoading(true);
    setOutput(""); // Clear previous output

    try {
      const response = await axios.post(
        "https://api.judge0.com/submissions/?base64_encoded=false&wait=true",
        {
          source_code: code,
          language_id: selectedLang.judge0LangId,
        }
      );

      const { stdout, stderr } = response.data;

      setOutput(stdout || stderr || "No output.");
    } catch (error) {
      setOutput("Error executing code: ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Splitter style={{ height: '85vh', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', gap: '2px' }}>
        <Splitter.Panel collapsible defaultSize="65%" min="15%" max="70%">
          {/* Left Section: Editor */}
          <Card className="flex flex-col flex-1 h-[85vh]">
        {/* Toolbar */}
        <div className="px-3 py-3 flex justify-between items-center border-b-2 rounded-t-lg">
          {/* Language Dropdown */}
          <div className="flex items-center w-fit">
            {/* <Typography variant="body1" mr={2}>
          Language:
            </Typography> */}
            <Select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          variant="outlined"
          size="small"
            >
          {languages.map((lang) => (
            <MenuItem key={lang.value} value={lang.value}>
              {lang.label}
            </MenuItem>
          ))}
            </Select>
          </div>
          {/* Run Button */}
          <Button
            variant="contained"
            color="success"
            onClick={handleRunCode}
            disabled={isLoading}
          >
            {isLoading ? "Running..." : "Run Code"}
          </Button>
        </div>

        {/* Code Editor */}
            <div className="flex-grow overflow-auto px-2 pb-2 rounded-md">
              <Editor
                height="100%"
                border-radius="100px"
                language={language}
                value={code}
                theme="vs-light"
                onChange={(value) => setCode(value || "")}
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                }}
              />
            </div>
          </Card>
        </Splitter.Panel>
        <Splitter.Panel collapsible={{ start: true }} defaultSize="25%" min="15%" max="70%">
          {/* Right Section: Output */}
          <Card className="flex-1 flex flex-col  h-[85vh]">
            {/* Output Content */}
            <CodeOutput output={output} />
          </Card>
        </Splitter.Panel>
      </Splitter>
    </Box>
  );
};

export default CodeEditor;
