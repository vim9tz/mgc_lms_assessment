"use client"

import React from 'react'
export default function AssessmentQuiz() {
  const ApiData = {
    "data": {
        "mcq": [
            {
                "module_name": "Aptitude ",
                "questions": [
                    {
                        "quiz_id": "1",
                        "question": "What do we mean by website?",
                        "options": [
                            {
                                "text": "A",
                                "is_correct": true
                            },
                            {
                                "text": "B",
                                "is_correct": false
                            },
                            {
                                "text": "C",
                                "is_correct": false
                            },
                            {
                                "text": "D",
                                "is_correct": false
                            }
                        ]
                    },
                    {
                        "quiz_id": "2",
                        "question": "What do we mean by website A?",
                        "options": [
                            {
                                "text": "A",
                                "is_correct": true
                            },
                            {
                                "text": "B",
                                "is_correct": false
                            }
                        ]
                    },
                    {
                        "quiz_id": "3",
                        "question": "What do we mean by website? B",
                        "options": [
                            {
                                "text": "A",
                                "is_correct": false
                            },
                            {
                                "text": "B",
                                "is_correct": true
                            }
                        ]
                    }
                ]
            },
            {
                "module_name": "Coding ",
                "questions": [
                    {
                        "quiz_id": "2",
                        "question": "What do we mean by website A?",
                        "options": [
                            {
                                "text": "A",
                                "is_correct": true
                            },
                            {
                                "text": "B",
                                "is_correct": false
                            }
                        ]
                    },
                    {
                        "quiz_id": "3",
                        "question": "What do we mean by website? B",
                        "options": [
                            {
                                "text": "A",
                                "is_correct": false
                            },
                            {
                                "text": "B",
                                "is_correct": true
                            }
                        ]
                    },
                    {
                        "quiz_id": "1",
                        "question": "What do we mean by website?",
                        "options": [
                            {
                                "text": "A",
                                "is_correct": true
                            },
                            {
                                "text": "B",
                                "is_correct": false
                            },
                            {
                                "text": "C",
                                "is_correct": false
                            },
                            {
                                "text": "D",
                                "is_correct": false
                            }
                        ]
                    }
                ]
            },
            {
                "module_name": "Logical Reasoning ",
                "questions": [
                    {
                        "quiz_id": "3",
                        "question": "What do we mean by website? B",
                        "options": [
                            {
                                "text": "A",
                                "is_correct": false
                            },
                            {
                                "text": "B",
                                "is_correct": true
                            }
                        ]
                    },
                    {
                        "quiz_id": "1",
                        "question": "What do we mean by website?",
                        "options": [
                            {
                                "text": "A",
                                "is_correct": true
                            },
                            {
                                "text": "B",
                                "is_correct": false
                            },
                            {
                                "text": "C",
                                "is_correct": false
                            },
                            {
                                "text": "D",
                                "is_correct": false
                            }
                        ]
                    }
                ]
            },
            {
                "module_name": "Verbal Ability ",
                "questions": [
                    {
                        "quiz_id": "1",
                        "question": "What do we mean by website?",
                        "options": [
                            {
                                "text": "A",
                                "is_correct": true
                            },
                            {
                                "text": "B",
                                "is_correct": false
                            },
                            {
                                "text": "C",
                                "is_correct": false
                            },
                            {
                                "text": "D",
                                "is_correct": false
                            }
                        ]
                    }
                ]
            }
        ],
        "coding": [
            {
                "module_name": "Aptitude ",
                "questions": [
                    {
                        "question_id": "1",
                        "title": "This is the Python Code",
                        "description": "<p><figure data-trix-attachment=\"{&quot;contentType&quot;:&quot;image/jpeg&quot;,&quot;filename&quot;:&quot;family pics.jpg&quot;,&quot;filesize&quot;:1799420,&quot;height&quot;:2340,&quot;href&quot;:&quot;http://localhost/storage/Zz6ToKfK5LIE2sjQ0Gb5F6P9mIVXEXOxdX9mbZyd.jpg&quot;,&quot;url&quot;:&quot;http://localhost/storage/Zz6ToKfK5LIE2sjQ0Gb5F6P9mIVXEXOxdX9mbZyd.jpg&quot;,&quot;width&quot;:3949}\" data-trix-content-type=\"image/jpeg\" data-trix-attributes=\"{&quot;presentation&quot;:&quot;gallery&quot;}\" class=\"attachment attachment--preview attachment--jpg\"><a href=\"http://localhost/storage/Zz6ToKfK5LIE2sjQ0Gb5F6P9mIVXEXOxdX9mbZyd.jpg\"><img src=\"http://localhost/storage/Zz6ToKfK5LIE2sjQ0Gb5F6P9mIVXEXOxdX9mbZyd.jpg\" width=\"3949\" height=\"2340\"><figcaption class=\"attachment__caption\"><span class=\"attachment__name\">family pics.jpg</span> <span class=\"attachment__size\">1.72 MB</span></figcaption></a></figure>This is the Question</p>",
                        "test_cases": [
                            {
                                "input": "krithick",
                                "expected_output": "krithick",
                                "weightage": "10"
                            },
                            {
                                "input": "varshan",
                                "expected_output": "varshan",
                                "weightage": "10"
                            }
                        ],
                        "solution": "# Write your solution here...\nprint('KRITHICK')",
                        "folder_path": null
                    },
                    {
                        "question_id": "2",
                        "title": "This is the Python Code 2",
                        "description": "<p>print the result a function return addition</p>",
                        "test_cases": [
                            {
                                "input": "krithick",
                                "expected_output": "krithick",
                                "weightage": "10"
                            },
                            {
                                "input": "varshan",
                                "expected_output": "varshan",
                                "weightage": "15"
                            }
                        ],
                        "solution": "# Write your solution here...\ndef a(b):\n    return b\nl = a('krithick')\nprint(l)",
                        "folder_path": null
                    }
                ]
            },
            {
                "module_name": "Coding ",
                "questions": [
                    {
                        "question_id": "1",
                        "title": "This is the Python Code",
                        "description": "<p><figure data-trix-attachment=\"{&quot;contentType&quot;:&quot;image/jpeg&quot;,&quot;filename&quot;:&quot;family pics.jpg&quot;,&quot;filesize&quot;:1799420,&quot;height&quot;:2340,&quot;href&quot;:&quot;http://localhost/storage/Zz6ToKfK5LIE2sjQ0Gb5F6P9mIVXEXOxdX9mbZyd.jpg&quot;,&quot;url&quot;:&quot;http://localhost/storage/Zz6ToKfK5LIE2sjQ0Gb5F6P9mIVXEXOxdX9mbZyd.jpg&quot;,&quot;width&quot;:3949}\" data-trix-content-type=\"image/jpeg\" data-trix-attributes=\"{&quot;presentation&quot;:&quot;gallery&quot;}\" class=\"attachment attachment--preview attachment--jpg\"><a href=\"http://localhost/storage/Zz6ToKfK5LIE2sjQ0Gb5F6P9mIVXEXOxdX9mbZyd.jpg\"><img src=\"http://localhost/storage/Zz6ToKfK5LIE2sjQ0Gb5F6P9mIVXEXOxdX9mbZyd.jpg\" width=\"3949\" height=\"2340\"><figcaption class=\"attachment__caption\"><span class=\"attachment__name\">family pics.jpg</span> <span class=\"attachment__size\">1.72 MB</span></figcaption></a></figure>This is the Question</p>",
                        "test_cases": [
                            {
                                "input": "krithick",
                                "expected_output": "krithick",
                                "weightage": "10"
                            },
                            {
                                "input": "varshan",
                                "expected_output": "varshan",
                                "weightage": "10"
                            }
                        ],
                        "solution": "# Write your solution here...\nprint('KRITHICK')",
                        "folder_path": null
                    },
                    {
                        "question_id": "2",
                        "title": "This is the Python Code 2",
                        "description": "<p>print the result a function return addition</p>",
                        "test_cases": [
                            {
                                "input": "krithick",
                                "expected_output": "krithick",
                                "weightage": "10"
                            },
                            {
                                "input": "varshan",
                                "expected_output": "varshan",
                                "weightage": "15"
                            }
                        ],
                        "solution": "# Write your solution here...\ndef a(b):\n    return b\nl = a('krithick')\nprint(l)",
                        "folder_path": null
                    },
                    {
                        "question_id": "24",
                        "title": "PerfectFile",
                        "description": "<p>This is the Problem Description</p>",
                        "test_cases": [
                            {
                                "input": "10",
                                "expected_output": null,
                                "weightage": "10"
                            },
                            {
                                "input": "10",
                                "expected_output": null,
                                "weightage": "10"
                            }
                        ],
                        "solution": null,
                        "folder_path": "https://github.com/mgc-projects/perfectfile"
                    }
                ]
            }
        ],
        "is_saved_state": false
    }
}
  return (
    <div className=" w-full h-full">
      {/* <QuizPanel groupedQuestions={ApiData.data.mcq}/> */}
      <h1>Hello buddy!</h1>
    </div>
  )
}

