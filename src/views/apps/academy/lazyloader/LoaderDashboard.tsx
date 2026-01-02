import { useTheme } from '@mui/material/styles';
import { Box, Skeleton, Stack, Grid } from '@mui/material'
import React from 'react'

function LoaderDashboard() {
  const theme = useTheme();
  const lazybackground = theme.palette.mode === 'dark' ? 'rgb(19, 19, 19)' : 'rgb(255, 255, 255)';

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        {/* Hero card  */}
        <Stack spacing={2} width={'100%'}>
          {/* Box with Two Bars Inside */}
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "start",
              gap: 1.5,
              borderRadius: 2,
              backgroundColor: lazybackground,
              padding: 6,
            }}
          >
            {/* Inside Bars */}

            <Box width={'100%'} sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 4, paddingTop: 6 }}>
              <Box width={'70%'} sx={{ display: "flex", flexDirection: "column", gap: "4" }}>
                <Skeleton className='rounded-md' variant="rectangular" width={'100%'} height={20} />
                <Skeleton className='rounded-md mt-3' variant="rectangular" width={'40%'} height={14} />
                <Box className='mt-6' sx={{ display: "flex", flexDirection: "row", gap: 4 }}>
                  <Skeleton className='rounded-md' variant="rectangular" width={200} height={70} />
                  <Skeleton className='rounded-md' variant="rectangular" width={200} height={70} />
                  <Skeleton className='rounded-md' variant="rectangular" width={200} height={70} />
                </Box>
              </Box>
              <Box width={'30%'} sx={{ display: "flex", flexDirection: "row", gap: 4 }}>
                <Skeleton className='rounded-md' variant="rectangular" width={'100%'} height={'100%'} />
              </Box>
            </Box>
          </Box>
        </Stack>
      </Grid>
      <Grid item xs={12}>
        {/* Contribution  card  */}
        <Stack spacing={2} width={'100%'}>
          {/* Box with Two Bars Inside */}
          <Box
            sx={{
              width: '100%',
              height: '200px',
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "start",
              gap: 1.5,
              borderRadius: 2,
              backgroundColor: lazybackground,
              padding: 6,
            }}
          >
            {/* Inside Bars */}

            <Box width={'100%'} sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 4, paddingTop: 6 }}>
              <Box width={'100%'} sx={{ display: "flex", flexDirection: "column", gap: "4" }}>
                <Skeleton className='rounded-md' variant="rectangular" width={'100%'} height={20} />
                <Skeleton className='rounded-md mt-3' variant="rectangular" width={'40%'} height={14} />
              </Box>
            </Box>
          </Box>
        </Stack>
      </Grid>
    </Grid>


  );
};

export default LoaderDashboard
