import React from "react";
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  IconButton,
  Button,
  Tooltip,
} from "@mui/material";
import {
  List as ListIcon,
  NavigateBefore,
  NavigateNext,
  KeyboardDoubleArrowLeft,
} from "@mui/icons-material";
import { Question } from "../types";

interface LeftPanelProps {
  question: Question;
  drawerOpen: boolean;
  onCollapse: () => void;
  onOpenDrawer: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  question,
  onCollapse,
  onOpenDrawer,
  onPrev,
  onNext,
}) => {
  return (
    <div className="w-full md:w-[400px] xl:w-[450px] bg-white border-r flex flex-col h-full shrink-0 transition-all duration-300">
      
      {/* HEADER */}
      <Box
        p={1.5}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bgcolor="white"
        borderBottom={1}
        borderColor="divider"
        height="50px"
      >
        <div className="flex items-center gap-2">
            <Button
            startIcon={<ListIcon />}
            variant="text"
            size="small"
            onClick={onOpenDrawer}
            sx={{ textTransform: 'none', color: '#444', fontWeight: 600 }}
            >
            Problem List
            </Button>
            
            <div className="flex items-center bg-gray-100 rounded p-0.5 ml-2 h-7">
                <Tooltip title="Previous Question">
                    <span>
                        <IconButton
                            disabled={!onPrev}
                            onClick={() => onPrev && onPrev()}
                            size="small"
                            sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '4px',
                                color: onPrev ? '#555' : '#ccc',
                                bgcolor: onPrev ? 'white' : 'transparent',
                                boxShadow: onPrev ? 1 : 0,
                                '&:hover': { bgcolor: onPrev ? 'white' : 'transparent', color: '#333' }
                            }}
                        >
                            <NavigateBefore sx={{ fontSize: 16 }} />
                        </IconButton>
                    </span>
                </Tooltip>
                <div className="w-[1px] h-4 bg-gray-300 mx-0.5" />
                <Tooltip title="Next Question">
                    <span>
                        <IconButton
                            disabled={!onNext}
                            onClick={() => onNext && onNext()}
                            size="small"
                            sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '4px',
                                color: onNext ? '#555' : '#ccc',
                                bgcolor: onNext ? 'white' : 'transparent',
                                boxShadow: onNext ? 1 : 0,
                                '&:hover': { bgcolor: onNext ? 'white' : 'transparent', color: '#333' }
                            }}
                        >
                            <NavigateNext sx={{ fontSize: 16 }} />
                        </IconButton>
                    </span>
                </Tooltip>
            </div>
        </div>

        <Tooltip title="Collapse Panel">
            <IconButton onClick={onCollapse} size="small">
                <KeyboardDoubleArrowLeft fontSize="small" />
            </IconButton>
        </Tooltip>
      </Box>

      {/* CONTENT AREA */}
      <Box flex={1} overflow="auto" p={3}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
                {question.title}
            </Typography>

            <Chip
                label={question.difficulty.toUpperCase()}
                color={
                question.difficulty === "easy"
                    ? "success"
                    : question.difficulty === "medium"
                    ? "warning"
                    : "error"
                }
                size="small"
                className="mb-4"
            />

            <div
                className="prose max-w-none text-gray-700 mt-2 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: question.content }}
            />

            {/* Test Cases removed from Content Panel as per request */}
      </Box>
    </div>
  );
};

export default LeftPanel;
