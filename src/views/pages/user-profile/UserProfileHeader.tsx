// MUI Imports
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
// import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import { Pencil } from 'lucide-react';
import Grid from '@mui/material/Grid'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'

// Components Imports
import CustomTextField from '@core/components/mui/TextField'
import Form from '@components/Form'
// React Imports
import { useState } from 'react'

// Type Imports
import type { ProfileHeaderType } from '@/types/pages/profileTypes'
import { Button, IconButton } from '@mui/material'

// Third-party Imports
import { toast } from 'react-toastify'
// import ProfileYearlyContribution from '@/views/apps/academy/profile/ProfileYearlyContribution'
// import ProfileTabs from '@/views/apps/academy/profile/ProfileTab'


const UserProfileHeader = ({ data }: { data?: ProfileHeaderType }) => {

  const [open, setOpen] = useState<boolean>(false)

  const handleClickOpen = () => setOpen(true)

  const handleClose = () => setOpen(false)

  const handleClick = () => {
    const myPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.5) {
          resolve('foo')
        } else {
          reject('fox')
        }
      }, 1000)
    })

    return toast.promise(myPromise, {
      pending: 'Loading',
      success: {
        render() {
          handleClose();
          return 'Got the data';
        }
      },
      error: 'Error when fetching'
    })
  }

  return (
    <>
    {/* <!-- Hero Content --> */}
    <Card>
        <CardMedia image={data?.coverImg || '/profile_cover.jpg'} className='bs-[220px]' />
      </Card>
      <div className='grid grid-cols-12 w-full gap-4'>
        {/* Details card  */}
        <Card className='h-fit sm:col-span-4 col-span-12  p-6 sm:ml-4 ml-0 -mt-16 overflow-visible flex gap-5 justify-center flex-col items-center md:items-center md:flex-col !pt-0 md:justify-start'>
          <div className='flex rounded-bs-md -mt-16 border-[5px] border-be-0  border-backgroundPaper bg-backgroundPaper'>
            <img height={100} width={100} src={data?.profileImg || '/images/profile/avatar_1.jpg'} className='rounded' alt='Profile Background' />
          </div>
          <div className='flex flex-col justify-center items-center'>
            <Typography variant='h5' className='font-bold uppercase'>
              {data?.fullName && data.fullName.length > 20 ? `${data.fullName.slice(0, 20)}...` : data?.fullName ?? ''}
            </Typography>
            <Typography>
              Student111@devhub.com
            </Typography>
          </div>
          {/* bar style  */}
          <div className='flex justify-center items-center'>
            <div className='w-6 h-1 bg-primary rounded-md '>
            </div>
          </div>
          <div className='flex justify-center w-full'>
            <table className="w-full">
              <tbody className='space-y-6'>
                <tr className='flex justify-between'>
                  <td>Name</td>
                  <td className='font-semibold'>{data?.fullName}</td>
                </tr>
                <tr className='flex justify-between'>
                  <td>Email</td>
                  <td className='font-semibold'>The Eagles</td>
                </tr>
                <tr className='flex justify-between'>
                  <td>Phone</td>
                  <td className='font-semibold'>+91 8940476158</td>
                </tr>
                <tr className='flex justify-between'>
                  <td>Batch Head</td>
                  <td className='font-semibold'>Vimal</td>
                </tr>
                <tr className='flex justify-between'>
                  <td>D-O-B</td>
                  <td className='font-semibold'>18-10-2000</td>
                </tr>
                <tr className='flex justify-between'>
                  <td>Gender</td>
                  <td className='font-semibold'>Male</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* bar style  */}
          <div className=' w-full h-[2px] bg-slate-100 relative dark:bg-zinc-700'>
            <IconButton onClick={handleClickOpen} className=' absolute -mt-3 -ml-3 left-1/2 bg-slate-100 dark:bg-zinc-800 rounded-md '>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>
            </IconButton>
          </div>
          <div>
            <Typography className="text-center">popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.</Typography>
          </div>
        </Card>
      </div>

      {/* Personal details  */}
      <Dialog
        onClose={handleClose}
        aria-labelledby='customized-dialog-title'
        open={open}
        closeAfterTransition={false}
        PaperProps={{ sx: { overflow: 'visible' } }}
      >
        <DialogTitle className=' border-b' id='customized-dialog-title'>
          <Typography variant='h5' component='span'>
            Personal Details
          </Typography>
        </DialogTitle>
        <Card className=' bg-transparent shadow-none'>
          <CardContent>
            <Form>
              <Grid container spacing={6}>
                <Grid item xs={12}>
                  <CustomTextField
                    fullWidth
                    label='Name'
                    placeholder='John Doe'
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-user' />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <CustomTextField
                    fullWidth
                    type='email'
                    label='Email'
                    placeholder='johndoe@gmail.com'
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-mail' />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <CustomTextField
                    fullWidth
                    label='Phone No.'
                    placeholder='123-456-7890'
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-phone' />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <CustomTextField
                    fullWidth
                    rows={4}
                    multiline
                    label='About'
                    placeholder='About...'
                    sx={{ '& .MuiInputBase-root.MuiFilledInput-root': { alignItems: 'baseline' } }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-message' />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <div className='flex justify-between'>
                    <Button onClick={handleClose} variant='tonal' color='secondary'>
                      Close
                    </Button>
                    <Button onClick={handleClick} variant='contained'>
                      Submit
                    </Button>
                  </div>
                </Grid>
              </Grid>
            </Form>
          </CardContent>
        </Card>
      </Dialog>
    </>
  )
}

export default UserProfileHeader
