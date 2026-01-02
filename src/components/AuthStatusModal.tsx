"use client";

import { Modal, Box, Typography, CircularProgress, Button } from "@mui/material";

interface AuthStatusModalProps {
  open: boolean;
  unauthorized?: boolean;
  onClose?: () => void;
}

export default function AuthStatusModal({ open, unauthorized, onClose }: AuthStatusModalProps) {
  return (
    <Modal open={open} onClose={unauthorized ? onClose : undefined}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          minWidth: 300,
          textAlign: "center",
        }}
      >
        {unauthorized ? (
          <>
            <Typography variant="h6" color="error">
              Unauthorized Access
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Your authentication has failed. Please try again.
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={onClose}>
              Close
            </Button>
          </>
        ) : (
          <>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Authenticating, please wait...
            </Typography>
          </>
        )}
      </Box>
    </Modal>
  );
}
