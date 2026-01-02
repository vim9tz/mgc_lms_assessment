// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

const ToastsPromise: React.FC = () => {
  const handleClick = (): void => {
    const myPromise: Promise<string> = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.5) {
          resolve('foo')
        } else {
          reject(new Error('fox'))
        }
      }, 1000)
    })

    toast.promise(myPromise, {
      pending: 'Loading',
      success: 'Enroll Successfully',
      error: 'Enroll Failed',
    })
  }

  return (
    <div >
      <Button variant="contained" onClick={handleClick}>
        Enroll Now
      </Button>
    </div>
  )
}

export default ToastsPromise
