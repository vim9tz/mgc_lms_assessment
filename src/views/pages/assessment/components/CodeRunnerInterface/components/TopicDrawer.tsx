import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { Close as CloseIcon, CheckCircle, Lock as LockIcon } from "@mui/icons-material";
import { TopicQuestion } from "../types";

interface TopicDrawerProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  topicQuestions: TopicQuestion[];
  currentQuestionId: string;
  onSwitchQuestion: (id: number) => void;
}

const TopicDrawer: React.FC<TopicDrawerProps> = ({
  open,
  onClose,
  loading,
  topicQuestions,
  currentQuestionId,
  onSwitchQuestion,
}) => {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 320 },
      }}
    >
      <Box
        p={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        borderBottom={1}
        borderColor="divider"
      >
        <Typography variant="h6" fontWeight={600}>
          Topic Questions
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {loading && (
          <Box p={2} textAlign="center">
            <CircularProgress size={24} />
          </Box>
        )}
        {!loading &&
          topicQuestions.map((q) => {
            const isCurrent = q.id.toString() === currentQuestionId;

            let StatusIcon = <div className="w-3 h-3 rounded-full bg-gray-300" />;
            if (q.status === "solved") {
              StatusIcon = <div className="w-3 h-3 rounded-full bg-green-500" />;
            } else if (q.status === "attempted") {
              StatusIcon = <div className="w-3 h-3 rounded-full bg-orange-400" />;
            }

            return (
              <ListItem key={q.id} disablePadding>
                <ListItemButton
                  selected={isCurrent}
                  onClick={() => onSwitchQuestion(q.id)}
                >
                  <ListItemIcon sx={{ minWidth: 24, pr: 1 }}>
                    {StatusIcon}
                  </ListItemIcon>
                  <ListItemText
                    primary={q.title}
                    secondary={q.difficulty.toUpperCase()}
                    primaryTypographyProps={{
                      variant: "body2",
                      fontWeight: isCurrent ? 700 : 400,
                    }}
                    secondaryTypographyProps={{
                      variant: "caption",
                      color:
                        q.difficulty === "easy"
                          ? "green"
                          : q.difficulty === "medium"
                          ? "orange"
                          : "red",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        {!loading && topicQuestions.length === 0 && (
          <Box p={2} textAlign="center" color="text.secondary">
            No other questions found.
          </Box>
        )}
      </List>
    </Drawer>
  );
};

export default TopicDrawer;
