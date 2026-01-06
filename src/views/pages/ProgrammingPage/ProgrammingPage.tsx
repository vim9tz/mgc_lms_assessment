"use client";
import React, { useState, useEffect } from "react";
import { Splitter, Row, Col, Button, Select, Layout, Menu, Tabs } from "antd"; // Corrected Ant Design imports
import MonacoEditor from "@monaco-editor/react"; // Monaco Editor for code editing
import { ProblemStatement } from "@/views/dashboards/sandbox/problem-statement"; // Question statement
import { getSocket } from "@/lib/socket";

const { TabPane } = Tabs; // Correctly destructure TabPane from Tabs component
const { Option } = Select; // For the select dropdown
const { Sider, Content } = Layout; // Ant Design Layout for Sidebar and Content

export default function ProgrammingPage({ groupedQuestions, userId, isProctoringEnabled = true }: any) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0); // To manage selected question
  const [htmlCode, setHtmlCode] = useState(""); // Separate code for each problem
  const [cssCode, setCssCode] = useState(""); // Separate code for each problem
  const [jsCode, setJsCode] = useState(""); // Separate code for each problem
  const [code, setCode] = useState(""); // Generic code state
  const [codeOutput, setCodeOutput] = useState(""); // Generic output state
  const [customOutput, setCustomOutput] = useState(""); // Custom Output
  const [theme, setTheme] = useState("light"); // Theme for Monaco Editor
  const [fontSize, setFontSize] = useState(14); // Font size for Monaco Editor
  const [customInput, setCustomInput] = useState('');
  const [customWeightage, setCustomWeightage] = useState('');
  const [customTestCases, setCustomTestCases] = useState<any[]>([]);
  const [customExpectedOutput, setCustomExpectedOutput] = useState('');
  const [activeTab, setActiveTab] = useState("1");
  const [customTestCasesMap, setCustomTestCasesMap] = useState<Record<number, any[]>>({});
  const [isRunning, setIsRunning] = useState(false);


  const monacoRef = React.useRef<any>(null);




  const currentQuestion = groupedQuestions?.[selectedQuestionIndex] || {};
  const type = currentQuestion?.type?.toLowerCase() || "unknown";
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  console.log('ProgrammingPage groupedQuestions:', groupedQuestions);

  useEffect(() => {
     if (currentQuestion) {
        const backendLang = currentQuestion.programming_language?.slug || currentQuestion.type || 'python';
        setSelectedLanguage(backendLang.toLowerCase());
     }
  }, [selectedQuestionIndex, groupedQuestions]);

  const isWeb = ["html", "web", "web technologies"].includes(type);

  // Helper to render language label
  const getLanguageLabel = (t: string) => {
    if (t === 'c') return 'C';
    if (t === 'cpp' || t === 'c++') return 'C++';
    if (t === 'java') return 'Java';
    if (t === 'python') return 'Python';
    if (t === 'javascript') return 'JavaScript';
    return t.toUpperCase();
  };

  // Live preview for web tech (HTML, CSS, JS)
  const srcDoc = `
    <html>
      <head><style>${cssCode}</style></head>
      <body>
        ${htmlCode}
        <script>${jsCode}<\/script>
      </body>
    </html>
  `;


  const handleAddCustomTestCase = () => {
    if (customInput.trim() === '') return;

    const newCase = {
      input: customInput,
      expected_output: customExpectedOutput || null,
    };

    setCustomTestCases((prev) => [...prev, newCase]);
    setCustomInput('');
    setCustomExpectedOutput('');
  };


  const handleWebRun = async () => {
    setActiveTab("3");   // ✅ open Test Cases tab
    setIsRunning(true);

    const question = groupedQuestions[selectedQuestionIndex];
    const testCases = [...(question?.test_cases || []), ...customTestCases];

    if (!htmlCode && !cssCode && !jsCode) {
      setCustomOutput("❌ Please enter HTML/CSS/JS code to run.");
      setIsRunning(false);
      return;
    }

    const formattedTestCases = testCases.map(tc => {
      let inputScript = tc.input; // default to original input
    
      // Optional special handling for click-based test cases
      if (tc.input.includes("click")) {
        const count = parseInt(tc.input.match(/\d+/)?.[0]) || 1;
        inputScript = "document.getElementById('inc').click();".repeat(count).trim();
      }
    
      return {
        input_script: inputScript,
        expected_output: `${tc.expected_output}`
      };
    });
    

    const payload = {
      language: "web",
      html: htmlCode,
      css: cssCode,
      js: jsCode,
      test_cases: formattedTestCases,
      filename: 'web_' + Date.now(),
    };

    try {
      const res = await fetch("https://compilers.milliongeniuscoders.com/api/execute/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const storageKey = `testcases-${selectedQuestionIndex}`;

      if (res.ok) {
        // Inject weightage into each returned test case from currentQuestion
        const enrichedTestCases = (data || []).map((result: any, index: number) => {
          const original = currentQuestion?.test_cases?.[index];

          const merged = {
            ...result,
            input: original?.input ?? '',
            expected_output: original?.expected_output ?? '',
            weightage: original?.weightage ?? 0,  // ✅ This will now appear
          };
          return merged; // ✅ this is key
        });

        console.log('✅ Final Merged Array:', enrichedTestCases, currentQuestion?.test_cases, data);
        sessionStorage.setItem(storageKey, JSON.stringify(enrichedTestCases));
        sessionStorage.setItem('testcases', JSON.stringify(enrichedTestCases));
        setCustomOutput(JSON.stringify(enrichedTestCases, null, 2));
      } else {
        setCustomOutput(`❌ Error: ${data?.message || 'Execution failed'}`);
      }

    } catch (error: any) {
      console.error("Web Execution Error:", error);
      setCustomOutput(`❌ Execution error: ${error.message}`);
    } finally {
        setIsRunning(false);
    }
  };


  const allowedClipboard = new Set<string>();

  const handleEditorDidMount = (editor: any, monaco: any) => {
    monacoRef.current = editor;
    // Clipboard blocking removed as per user request
  };

  const handleCodeRun = async () => {
    setActiveTab("3");
    setIsRunning(true);

    const question = groupedQuestions[selectedQuestionIndex];
    // Dynamically map language name to compiler API code
    // Assuming: 1=Python, 2=Java, 3=C, 4=C++, 10=NodeJS/JS (Standard Judge0-like mapping often used)
    const languageMap: Record<string, string> = {
      python: '1',
      java: '2',
      c: '3',
      'c language': '3',
      'cpp': '4',
      'c++': '4',
      javascript: '10', // Or 'node' depending on API. Trying '10' based on commonality or 'node' if string supported. 
      js: '10',
      node: '10'
    };

    // Normalize incoming type/language
    const langKey = (selectedLanguage || type || '').toLowerCase(); // Use selected language first
    const languageCode = languageMap[langKey] || '1'; // Default to Python if unknown

    if (!code || languageCode === '0') {
      setCodeOutput(`❌ Language '${type}' not supported or code empty.`);
      setIsRunning(false);
      return;
    }
    const testCases = [
      ...(currentQuestion?.test_cases || []),
      ...customTestCases,
    ];


    const payload = {
      code: code,
      test_cases: testCases,
      language: languageCode,
      filename: `solution_${Date.now()}`,
    };

    try {
      const res = await fetch('https://compilers.milliongeniuscoders.com/api/execute/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        const output = data?.[0]?.output || 'No output';
        setCodeOutput(output);
        setCustomOutput(JSON.stringify(data, null, 2));

        // Persist for Submission (similar to Web Handler)
        const storageKey = `testcases-${selectedQuestionIndex}`;
        const enrichedTestCases = (data || []).map((result: any, index: number) => {
          const original = currentQuestion?.test_cases?.[index];
          return {
            ...result,
            input: original?.input ?? result?.input ?? '',
            expected_output: original?.expected_output ?? '',
            weightage: original?.weightage ?? 0,
          };
        });
        sessionStorage.setItem(storageKey, JSON.stringify(enrichedTestCases));
        
        console.log('✅ Final Merged Array (Code):', enrichedTestCases);

      } else {
        setCodeOutput(`❌ Error: ${data?.message || 'Execution failed'}`);
      }
    } catch (error: any) {
      console.error('❌ Execution Error:', error);
      setCodeOutput(`❌ Execution error: ${error.message}`);
    } finally {
        setIsRunning(false);
    }
  };


  const handleMenuClick = (index: number) => {
    setSelectedQuestionIndex(index); // Change to the selected problem index
    setCustomOutput("");
    // reload any saved run results (if you want)
    const saved = sessionStorage.getItem(`testcases-${index}`);
    if (saved) {
      setCustomOutput(saved);
    }
    loadCodeFromSessionStorage(index); // Load the corresponding code for the selected question from sessionStorage
  };

  const loadCodeFromSessionStorage = (index: number) => {
    const savedHtmlCode = sessionStorage.getItem(`htmlCode-${index}`);
    const savedCssCode = sessionStorage.getItem(`cssCode-${index}`);
    const savedJsCode = sessionStorage.getItem(`jsCode-${index}`);
    const savedCode = sessionStorage.getItem(`code-${index}`);

    const question = groupedQuestions?.[index];

    setHtmlCode(savedHtmlCode || "");
    setCssCode(savedCssCode || "");
    setJsCode(savedJsCode || "");
    // Use Session Storage -> Backend Persistence -> Empty
    setCode(savedCode || question?.user_code || "");
  };

  const saveCodeToSessionStorage = (codeVal: string, langType: string) => {
    if (['html', 'css', 'js'].includes(langType)) {
       sessionStorage.setItem(`${langType}Code-${selectedQuestionIndex}`, codeVal);
    } else {
       sessionStorage.setItem(`code-${selectedQuestionIndex}`, codeVal);
    }
    const socket = getSocket();
    const questionId = currentQuestion?.question_id


    // 🔁 Emit to socket
    socket.emit('code:update', {
      userId,
      questionId,
      language: type,
      code,
    });


  };

  useEffect(() => {
    loadCodeFromSessionStorage(selectedQuestionIndex); // Load the code for the first question on initial load (if any code is stored)
  }, [selectedQuestionIndex]);

  return (
    <div className="h-[90vh] border-b border-x flex  overflow-hidden ">
      {/* Sidebar */}
      <div className="w-[80px] bg-white  p-2">
        <div className="grid grid-cols-2 h-fit gap-2">
          {groupedQuestions.map((question: any, index: number) => (
            <button
              key={index}
              onClick={() => handleMenuClick(index)}
              className={`w-7 h-7 flex justify-center cursor-pointer items-center col-span-1 p-2 text-xs font-medium text-center rounded-md transition-colors  ${selectedQuestionIndex === index
                ? "ring-2 ring-blue-500 bg-[#7367f0] text-blue-700 ring-blue-400 text-white"
                : "hover:bg-slate-200 bg-slate-100 "
                }`}
            >
              {index + 1}
            </button>
          ))}

        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-hidden border-x">
        <div className="h-full flex flex-col">
          <Splitter layout="horizontal" className="flex-1 overflow-hidden">
            {/* Problem Statement Panel */}
            <Splitter.Panel
              defaultSize="40%"
              className="overflow-y-auto bg-white  rounded-lg"
            >
              <ProblemStatement question={currentQuestion} />
            </Splitter.Panel>

            {/* Editor & Preview Panel */}
            <Splitter.Panel className="">
              <Splitter layout="vertical" className="h-full border-x overflow-scroll">
                {/* Code Editor Panel */}
                <Splitter.Panel
                  defaultSize="50%"
                  className="bg-white border-b h-full "
                >
                  {/* Header with Monaco Editor Options */}


                  {/* WEB EDITOR */}
                  {isWeb && (


                    <div className="flex flex-col px-2">
                      <div className="w-full flex justify-end items-center py-2 -mb-12 ">
                        <Button
                          onClick={handleWebRun}
                          type="default"
                          className="border-2 z-10 border-blue-500 text-blue-600 font-medium px-4 py-1 rounded-md flex items-center gap-2 group"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z"
                            />
                          </svg>
                          Run
                        </Button>
                      </div>
                      <Tabs defaultActiveKey="1">
                        <TabPane tab="HTML" key="1">
                          <MonacoEditor
                            height="calc(50vh - 3rem)"
                            language="html"
                            value={htmlCode}
                            theme={theme}
                            options={{ fontSize }}
                            onChange={(val) => {
                              setHtmlCode(val || "");
                              saveCodeToSessionStorage(val || "", "html");
                            }}
                          />
                        </TabPane>
                        <TabPane tab="CSS" key="2">
                          <MonacoEditor
                            height="calc(50vh - 3rem)"
                            language="css"
                            value={cssCode}
                            theme={theme}
                            options={{ fontSize }}
                            onChange={(val) => {
                              setCssCode(val || "");
                              saveCodeToSessionStorage(val || "", "css");
                            }}
                          />
                        </TabPane>
                        <TabPane tab="JS" key="3">
                          <MonacoEditor
                            height="calc(50vh - 3rem)"
                            language="javascript"
                            value={jsCode}
                            theme={theme}
                            options={{ fontSize }}
                            onChange={(val) => {
                              setJsCode(val || "");
                              saveCodeToSessionStorage(val || "", "js");
                            }}
                          />
                        </TabPane>
                      </Tabs>
                    </div>
                  )}



                  {/* GENERIC CODE EDITOR */}
                  {!isWeb && (

                    <div>
                      <div className="w-full flex justify-between items-center border-b px-3 bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-3 px-2 pr-3 py-2 border-r">
                           {/* Language Dropdown */}
                           <Select
                              value={selectedLanguage || type}
                              style={{ width: 120 }}
                              onChange={(val) => {
                                setSelectedLanguage(val);
                                // Optional: Reset code or template if needed
                              }}
                              options={[
                                { value: 'python', label: 'Python' },
                                { value: 'java', label: 'Java' },
                                { value: 'c', label: 'C' },
                                { value: 'cpp', label: 'C++' },
                                { value: 'javascript', label: 'JavaScript' },
                              ]}
                           />
                        </div>
                        <div className="flex gap-3 items-center ">
                          {/* Run Button */}
                          
                            <Button
                              onClick={handleCodeRun}
                              type="default"
                              className="relative border-2 border-blue-500 text-blue-600 font-medium px-4 py-1 rounded-md flex items-center gap-2 overflow-hidden group"
                              style={{
                                transition: 'all 0.3s ease-in-out',
                              }}
                            >
                              <span className="absolute inset-0 w-full h-full bg-blue-100 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out -z-10"></span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-4 h-4 transform group-hover:scale-110 transition-transform duration-300"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z" />
                              </svg>
                              <span className="transform group-hover:translate-x-1 transition-transform duration-300">
                                Run
                              </span>
                            </Button>
                          
                          
                        </div>
                      </div>
                      <MonacoEditor
                        height="calc(50vh - 3rem)"
                        language={type === 'c' || type === 'cpp' ? 'cpp' : (type === 'java' ? 'java' : 'python')}
                        value={code}
                        theme={theme}
                        options={{
                          fontSize,
                        }}
                        onChange={(val) => {
                          setCode(val || "");
                          saveCodeToSessionStorage(val || "", type);
                        }}
                        onMount={handleEditorDidMount}
                      />



                    </div>
                  )}
                </Splitter.Panel>

                {/* Preview & Output Panel */}
                <Splitter.Panel defaultSize="50%" className="bg-white border-t px-2 h-full">
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                {["html", "web", "web technologies"].includes(type) && (
                      <>
                        <TabPane tab="Preview" key="1">
                          <iframe
                            title="Live Preview"
                            srcDoc={srcDoc}
                            sandbox="allow-scripts"
                            className="w-full  h-screen rounded-lg"
                          />
                        </TabPane>


                        <TabPane tab=" Test Cases" key="3" className="px-4 py-4 space-y-6">
                          {isRunning ? (
                             <div className="flex flex-col items-center justify-center py-10 space-y-4">
                               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                               <p className="text-gray-500 font-medium">Running your code...</p>
                             </div>
                          ) : (
                          (() => {
                            const hasRunResults = !!customOutput;
                            let parsedResults: any[] = [];

                            try {
                              parsedResults = hasRunResults ? JSON.parse(customOutput) : [];
                            } catch (e) {
                              console.warn("⚠️ customOutput is not valid JSON:", customOutput);
                            }

                            const combinedTests = [...(currentQuestion?.test_cases || []), ...customTestCases];
                            const passedCount = parsedResults.filter((r: any) => r.passed).length;
                            const totalCount = combinedTests.length;
                            const allRun = parsedResults.length >= totalCount && totalCount > 0;

                            return (
                              <>
                                {allRun && (
                                    <div className={`mb-4 p-4 rounded-lg flex items-center justify-between ${passedCount === totalCount ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                        <div className="flex items-center gap-2">
                                            {passedCount === totalCount ? (
                                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                                 </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <span className="font-bold text-lg">
                                                {passedCount === totalCount ? 'All Test Cases Passed!' : `${passedCount}/${totalCount} Test Cases Passed`}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                  <h3 className="text-base font-semibold text-gray-800 mb-3 hidden">Test Case Results</h3>
                                  <div className="space-y-4">
                                    {combinedTests.map((test: any, idx: number) => {
                                      const result = parsedResults[idx]; // assuming index-aligned results
                                      const passed = result?.passed;
                                      const output = result?.output ?? (passed ? result?.expected_output : null);
                                      const error = result?.error;
                                      const isRun = result !== undefined;

                                      return (
                                        <div
                                          key={idx}
                                          className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${isRun 
                                            ? (passed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50') 
                                            : 'border-slate-200 bg-white hover:border-blue-300'}`}
                                        >
                                          {/* Status Indicator Bar */}
                                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isRun ? (passed ? 'bg-green-500' : 'bg-red-500') : 'bg-slate-300'}`}></div>
                                          
                                          <div className="p-4 pl-6">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-semibold text-slate-700 text-sm">Test Case {idx + 1}</h4>
                                                {isRun && (
                                                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {passed ? (
                                                            <>
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                                                </svg>
                                                                Pass
                                                            </>
                                                        ) : (
                                                             <>
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                                                </svg>
                                                                Fail
                                                             </>
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Input</p>
                                                    <div className="bg-white border border-slate-200 rounded-md p-2 font-mono text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap">
                                                        {test.input || <span className="text-slate-400 italic">Empty</span>}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected Output</p>
                                                    <div className="bg-white border border-slate-200 rounded-md p-2 font-mono text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap">
                                                        {test.expected_output || <span className="text-slate-400 italic">Empty</span>}
                                                    </div>
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                     <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actual Output</p>
                                                     <div className={`border rounded-md p-2 font-mono text-xs overflow-x-auto whitespace-pre-wrap ${isRun ? (passed ? 'bg-green-50 border-green-100 text-green-900' : 'bg-red-50 border-red-100 text-red-900') : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                                        {output ?? <span className="text-slate-400 italic">Ready to run...</span>}
                                                     </div>
                                                </div>
                                            </div>
                                            
                                            {error && (
                                              <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg text-xs text-red-800">
                                                <p className="font-bold mb-1">Execution Error:</p>
                                                <pre className="whitespace-pre-wrap font-mono">{error}</pre>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </>
                            );
                          })())}
                        </TabPane>



                      </>




                    )}

                    {!isWeb && (
                      <>
                        <TabPane tab="Output" key="2" className="px-4">
                          <pre className="bg-slate-100 p-4 rounded-lg overflow-auto">
                            {codeOutput}
                          </pre>
                        </TabPane>


                        <TabPane tab=" Test Cases" key="3" className="px-4 py-4 space-y-6">
                             {isRunning ? (
                             <div className="flex flex-col items-center justify-center py-10 space-y-4">
                               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                               <p className="text-gray-500 font-medium">Running your code...</p>
                             </div>
                          ) : (
                          (() => {
                            const hasRunResults = !!customOutput;
                            let parsedResults: any[] = [];
                            try {
                                parsedResults = hasRunResults ? JSON.parse(customOutput) : [];
                            } catch (e) {
                                console.warn("⚠️ customOutput is not valid JSON:", customOutput);
                            }
                            
                            const combinedTests = [...(currentQuestion?.test_cases || []), ...customTestCases];
                            const passedCount = parsedResults.filter((r: any) => r.passed).length;
                            const totalCount = combinedTests.length;
                            const allRun = parsedResults.length >= totalCount && totalCount > 0;

                            return (
                              <>
                                {allRun && (
                                    <div className={`mb-4 p-4 rounded-lg flex items-center justify-between ${passedCount === totalCount ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                        <div className="flex items-center gap-2">
                                            {passedCount === totalCount ? (
                                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                                 </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <span className="font-bold text-lg">
                                                {passedCount === totalCount ? 'All Test Cases Passed!' : `${passedCount}/${totalCount} Test Cases Passed`}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    {combinedTests.map((test: any, idx: number) => {
                                      const result = parsedResults.find((res: any) => res.input === test.input);
                                      const passed = result?.passed;
                                      const output = result?.output;
                                      const isRun = result !== undefined;

                                      return (
                                        <div
                                          key={idx}
                                           className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${isRun 
                                            ? (passed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50') 
                                            : 'border-slate-200 bg-white hover:border-blue-300'}`}
                                        >
                                           <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isRun ? (passed ? 'bg-green-500' : 'bg-red-500') : 'bg-slate-300'}`}></div>
                                          
                                          <div className="p-4 pl-6">
                                            <div className="flex justify-between items-center mb-3">
                                                 <h4 className="font-semibold text-slate-700 text-sm">Test Case {idx + 1}</h4>
                                                 {isRun && (
                                                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {passed ? 'Pass' : 'Fail'}
                                                    </span>
                                                 )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                              <div className="col-span-1">
                                                <p className="text-slate-500 text-xs uppercase mb-1">Input</p>
                                                <div className="font-mono text-slate-700 bg-white px-3 py-1.5 rounded-md border border-slate-200 overflow-x-auto whitespace-pre-wrap">{test.input || '—'}</div>
                                              </div>
                                              <div className="col-span-1">
                                                <p className="text-slate-500 text-xs uppercase mb-1">Expected</p>
                                                <div className="font-mono text-slate-700 bg-white px-3 py-1.5 rounded-md border border-slate-200 overflow-x-auto whitespace-pre-wrap">
                                                  {test.expected_output ?? 'null'}
                                                </div>
                                              </div>
                                               <div className="col-span-2">
                                                <p className="text-slate-500 text-xs uppercase mb-1">Actual Output</p>
                                                <div className={`font-mono px-3 py-1.5 rounded-md border overflow-x-auto whitespace-pre-wrap ${isRun ? (passed ? 'bg-green-50 border-green-100 text-green-900' : 'bg-red-50 border-red-100 text-red-900') : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                                  {output ?? 'Ready to run...'}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                <div className="pt-6 border-t border-slate-200 mt-6">
                                  <h4 className="text-base font-semibold text-slate-700 mb-4">Add Custom Test Case</h4>
                                  <div className="grid grid-cols-12 gap-4 items-end">
                                    <div className="col-span-5">
                                      <label className="block text-xs text-slate-500 mb-1.5">Input</label>
                                      <input
                                        placeholder="Enter test input"
                                        className="w-full border border-slate-200 text-slate-600 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 bg-white"
                                        value={customInput}
                                        onChange={(e) => setCustomInput(e.target.value)}
                                      />
                                    </div>
                                    <div className="col-span-5">
                                      <label className="block text-xs text-slate-500 mb-1.5">Expected Output</label>
                                      <input
                                        placeholder="Enter expected output"
                                        className="w-full border border-slate-200 text-slate-600 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 bg-white"
                                        value={customExpectedOutput}
                                        onChange={(e) => setCustomExpectedOutput(e.target.value)}
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <Button
                                        type="default"
                                        block
                                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200 h-[42px]"
                                        onClick={handleAddCustomTestCase}
                                      >
                                        Add
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          })())}
                        </TabPane>
                      </>
                    )}
                  </Tabs>
                </Splitter.Panel>
              </Splitter>
            </Splitter.Panel>
          </Splitter>
        </div>
      </div>
    </div>
  );
}
