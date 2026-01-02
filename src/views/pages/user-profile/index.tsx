'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import UserProfileHeader from './UserProfileHeader'

// Props Type
import type { Data, ProfileHeaderType } from '@/types/pages/profileTypes'

const UserProfile = ({ data }: { data?: Data }) => {
  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    token: ''
  })

  useEffect(() => {
    if (data) {
      setUser({
        id: String(data.user.id),
        name: data.user.name,
        email: data.user.email,
        token: ''
      })
    }
  }, [data])

  const profileHeaderData: ProfileHeaderType = {
    fullName: user.name || '',
    coverImg: '', // Add appropriate data or leave empty
    location: '', // Add appropriate data or leave empty
    profileImg: '', // Add appropriate data or leave empty
    joiningDate: '', // Add appropriate data or leave empty
    designation: '', // Add appropriate data or leave empty
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <UserProfileHeader data={profileHeaderData} />
      </Grid>
      <Grid item xs={12}>
        {/* <div>
          <h2>Welcome, {user.name || 'User'}!</h2>
          <p>Email: {user.email || 'Not Available'}</p>
        </div> */}
      </Grid>
    </Grid>
  )
}

export default UserProfile
