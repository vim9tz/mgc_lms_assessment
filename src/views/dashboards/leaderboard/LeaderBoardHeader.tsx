import { Avatar, Card, CardContent, CardMedia, Chip, Grid, IconButton, Typography } from '@mui/material'
import React from 'react'

function LeaderBoardHeader() {
  return (
    <div className="relative">
      {/* Grid Background with Radial Mask */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-transparent">
        {/* Grid Pattern */}
        <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#8f8f8f36_1px,transparent_1px),linear-gradient(to_bottom,#8f8f8f36_1px,transparent_1px)] bg-[size:6rem_4rem]
    [mask-image:radial-gradient(circle,rgba(0,0,0,1)_60%,rgba(0,0,0,0)_70%)]
    [--webkit-mask-image:radial-gradient(circle,rgba(0,0,0,1)_60%,rgba(0,0,0,0)_70%)]">
        </div>
      </div>

      {/* <!-- Hero Content --> */}
      <Grid container spacing={6} paddingY={10} paddingX={40}
        sx={{
          paddingY: { xs: 0, md: 10 }, // No padding on smaller screens, 10 on md and above
          paddingX: { xs: 0, md: 40 },
        }}>
        <Grid item xs={12} md={4} >
          <Card className=' shadow-sm rounded-2xl'>
            <CardMedia image={'/images/leaderboard/2nd_place.png'} className='bs-[130px] ' />
            <CardContent className='flex gap-5 justify-center flex-col items-center md:items-end md:flex-row !pt-0 md:justify-start'>
              <div className='flex rounded-bs-md mbs-[-40px] border-[5px] mis-[-5px] border-be-0  border-backgroundPaper bg-backgroundPaper'>
                <img height={80} width={80} src={'/images/avatars/1.png'} className='rounded' alt='Profile Background' />
              </div>
              <div className='flex w-full gap-4 sm:justify-end justify-center'>
                <Chip
                  sx={{
                    '.MuiChip-label': {
                      fontWeight: 'bold', // Adjust font weight
                    },
                  }}
                  label='1000' variant='tonal' avatar={<Avatar src='/images/leaderboard/lms_coin.svg' alt='Coin' />} />
              </div>
            </CardContent>
            <CardContent className='flex flex-wrap sm:justify-between justify-center items-center'>
              <div className='flex flex-col gap-1'>
                <Typography variant='h5' className=' font-bold sm:text-left text-center'>Vimal Umar</Typography>
                <div className='flex is-full justify-center self-end flex-col items-center gap-3 sm-gap-0 sm:flex-row sm:justify-between sm:items-end '>
                  <div className='flex flex-col items-center sm:items-start gap-2'>
                    <div className='flex flex-wrap gap-1 justify-center sm:justify-normal'>
                      <div className='flex items-center gap-2'>
                        <Typography className='font-medium text-xs'>Coimbatore,</Typography>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Typography className='font-medium text-xs'>Vimal@gmail.com</Typography>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <IconButton aria-label='capture screenshot' color='primary'>
                  <i className='tabler-arrow-up-right' />
                </IconButton>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card className=' shadow-sm rounded-2xl'>
            <CardMedia image={'/images/leaderboard/1st_place.png'} className='bs-[130px] ' />
            <CardContent className='flex gap-5 justify-center flex-col items-center md:items-end md:flex-row !pt-0 md:justify-start'>
              <div className='flex rounded-bs-md mbs-[-40px] border-[5px] mis-[-5px] border-be-0  border-backgroundPaper bg-backgroundPaper'>
                <img height={80} width={80} src={'/images/avatars/5.png'} className='rounded' alt='Profile Background' />
              </div>
              <div className='flex w-full gap-4 justify-end'>
                <Chip
                  sx={{
                    '.MuiChip-label': {
                      fontWeight: 'bold', // Adjust font weight
                    },
                  }}
                  label='2200' variant='tonal' avatar={<Avatar src='/images/leaderboard/lms_coin.svg' alt='Coin' />} />
              </div>
            </CardContent>
            <CardContent className='flex flex-wrap justify-between items-center'>
              <div className='flex flex-col gap-1'>
                <Typography variant='h5' className=' font-bold'>Prabhu</Typography>
                <div className='flex is-full justify-start self-end flex-col items-center gap-3 sm-gap-0 sm:flex-row sm:justify-between sm:items-end '>
                  <div className='flex flex-col items-center sm:items-start gap-2'>
                    <div className='flex flex-wrap gap-1 justify-center sm:justify-normal'>
                      <div className='flex items-center gap-2'>
                        <Typography className='font-medium text-xs'>Coimbatore,</Typography>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Typography className='font-medium text-xs'>prabhugmail.com</Typography>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <IconButton aria-label='capture screenshot' color='primary'>
                  <i className='tabler-arrow-up-right' />
                </IconButton>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card className=' shadow-sm rounded-2xl'>
            <CardMedia image={'/images/leaderboard/3rd_place.png'} className='bs-[130px] ' />
            <CardContent className='flex gap-5 justify-center flex-col items-center md:items-end md:flex-row !pt-0 md:justify-start'>
              <div className='flex rounded-bs-md mbs-[-40px] border-[5px] mis-[-5px] border-be-0  border-backgroundPaper bg-backgroundPaper'>
                <img height={80} width={80} src={'/images/avatars/7.png'} className='rounded' alt='Profile Background' />
              </div>
              <div className='flex w-full gap-4 justify-end'>
                <Chip
                  sx={{
                    '.MuiChip-label': {
                      fontWeight: 'bold', // Adjust font weight
                    },
                  }}
                  label='800' variant='tonal' avatar={<Avatar src='/images/leaderboard/lms_coin.svg' alt='Coin' />} />
              </div>
            </CardContent>
            <CardContent className='flex flex-wrap justify-between items-center'>
              <div className='flex flex-col gap-1'>
                <Typography variant='h5' className=' font-bold'>kirthick</Typography>
                <div className='flex is-full justify-start self-end flex-col items-center gap-3 sm-gap-0 sm:flex-row sm:justify-between sm:items-end '>
                  <div className='flex flex-col items-center sm:items-start gap-2'>
                    <div className='flex flex-wrap gap-1 justify-center sm:justify-normal'>
                      <div className='flex items-center gap-2'>
                        <Typography className='font-medium text-xs'>Karaikudi,</Typography>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Typography className='font-medium text-xs'>kirthick@gmail.com</Typography>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <IconButton aria-label='capture screenshot' color='primary'>
                  <i className='tabler-arrow-up-right' />
                </IconButton>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>

  )
}

export default LeaderBoardHeader
